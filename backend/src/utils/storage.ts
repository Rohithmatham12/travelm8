import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
    })
  : null;

interface StorageItem {
  [key: string]: any;
}

const tableNames = ['users', 'trips', 'feedback', 'vote_sessions'];

if (!pool && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getTablePath(tableName: string): string {
  return path.join(dataDir, `${tableName}.json`);
}

function assertTableName(tableName: string): void {
  if (!tableNames.includes(tableName)) {
    throw new Error(`Unsupported storage table: ${tableName}`);
  }
}

export function getDataDir(): string {
  return pool ? 'postgres:DATABASE_URL' : dataDir;
}

export function isPostgresStorageEnabled(): boolean {
  return Boolean(pool);
}

async function ensurePostgresTables(): Promise<void> {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      user_id TEXT NOT NULL,
      trip_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, trip_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      user_id TEXT NOT NULL,
      trip_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, trip_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vote_sessions (
      code TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
    );
  `);
}

let initPromise: Promise<void> | null = null;

export function initializeStorage(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (pool) {
      await ensurePostgresTables();
      return;
    }

    for (const table of tableNames) {
      const filePath = getTablePath(table);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  })();

  return initPromise;
}

export async function readTable(tableName: string): Promise<StorageItem[]> {
  assertTableName(tableName);
  await initializeStorage();

  if (pool) {
    const result = await pool.query(`SELECT data FROM ${tableName} ORDER BY created_at DESC`);
    return result.rows.map((row) => row.data);
  }

  const filePath = getTablePath(tableName);
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading table ${tableName}:`, error);
    return [];
  }
}

function writeTable(tableName: string, items: StorageItem[]): void {
  const filePath = getTablePath(tableName);
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
}

export async function putItem(tableName: string, item: StorageItem): Promise<void> {
  assertTableName(tableName);
  await initializeStorage();

  if (pool) {
    if (tableName === 'users') {
      await pool.query(
        `INSERT INTO users (user_id, email, data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET email = EXCLUDED.email, data = EXCLUDED.data, updated_at = NOW()`,
        [item.userId, item.email, item]
      );
      return;
    }

    if (tableName === 'feedback') {
      await pool.query(
        `INSERT INTO feedback (user_id, trip_id, data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (user_id, trip_id)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.userId, item.tripId, item]
      );
      return;
    }

    if (tableName === 'vote_sessions') {
      await pool.query(
        `INSERT INTO vote_sessions (code, data, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')
         ON CONFLICT (code)
         DO UPDATE SET data = EXCLUDED.data`,
        [item.code, item]
      );
      return;
    }

    await pool.query(
      `INSERT INTO trips (user_id, trip_id, data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, trip_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.userId, item.tripId, item]
    );
    return;
  }

  const items = await readTable(tableName);
  const existingIndex = items.findIndex((storedItem) => matchesKey(tableName, storedItem, item));

  if (existingIndex >= 0) {
    items[existingIndex] = { ...items[existingIndex], ...item };
  } else {
    items.push(item);
  }

  writeTable(tableName, items);
}

export async function getItem(tableName: string, key: StorageItem): Promise<StorageItem | null> {
  assertTableName(tableName);
  await initializeStorage();

  if (pool) {
    if (tableName === 'users') {
      const result = key.userId
        ? await pool.query('SELECT data FROM users WHERE user_id = $1 LIMIT 1', [key.userId])
        : await pool.query('SELECT data FROM users WHERE lower(email) = lower($1) LIMIT 1', [key.email]);
      return result.rows[0]?.data || null;
    }

    if (tableName === 'feedback') {
      const result = await pool.query(
        'SELECT data FROM feedback WHERE user_id = $1 AND trip_id = $2 LIMIT 1',
        [key.userId, key.tripId]
      );
      return result.rows[0]?.data || null;
    }

    if (tableName === 'vote_sessions') {
      const result = await pool.query(
        'SELECT data FROM vote_sessions WHERE code = $1 LIMIT 1',
        [key.code]
      );
      return result.rows[0]?.data || null;
    }

    const result = await pool.query(
      'SELECT data FROM trips WHERE user_id = $1 AND trip_id = $2 LIMIT 1',
      [key.userId, key.tripId]
    );
    return result.rows[0]?.data || null;
  }

  const items = await readTable(tableName);
  return items.find((item) => matchesKey(tableName, item, key)) || null;
}

export async function updateItem(tableName: string, key: StorageItem, updates: StorageItem): Promise<StorageItem | null> {
  const existing = await getItem(tableName, key);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  await putItem(tableName, updated);
  return updated;
}

export async function deleteItem(tableName: string, key: StorageItem): Promise<void> {
  assertTableName(tableName);
  await initializeStorage();

  if (pool) {
    if (tableName === 'users') {
      await pool.query('DELETE FROM users WHERE user_id = $1', [key.userId]);
      return;
    }
    await pool.query('DELETE FROM trips WHERE user_id = $1 AND trip_id = $2', [key.userId, key.tripId]);
    return;
  }

  const items = await readTable(tableName);
  writeTable(tableName, items.filter((item) => !matchesKey(tableName, item, key)));
}

export async function queryItems(
  tableName: string,
  filterFn?: (item: StorageItem) => boolean
): Promise<StorageItem[]> {
  const items = await readTable(tableName);
  return filterFn ? items.filter(filterFn) : items;
}

function matchesKey(tableName: string, item: StorageItem, key: StorageItem): boolean {
  if ((tableName === 'trips' || tableName === 'feedback') && key.userId && key.tripId) {
    return item.userId === key.userId && item.tripId === key.tripId;
  }
  if (tableName === 'vote_sessions' && key.code) {
    return item.code === key.code;
  }
  if (tableName === 'users') {
    if (key.userId) return item.userId === key.userId;
    if (key.email) return String(item.email).toLowerCase() === String(key.email).toLowerCase();
  }
  return key.id && item.id === key.id;
}
