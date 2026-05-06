import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface StorageItem {
  [key: string]: any;
}

/**
 * Get file path for a table
 */
function getTablePath(tableName: string): string {
  return path.join(dataDir, `${tableName}.json`);
}

export function getDataDir(): string {
  return dataDir;
}

/**
 * Read all items from a table
 */
export function readTable(tableName: string): StorageItem[] {
  const filePath = getTablePath(tableName);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading table ${tableName}:`, error);
    return [];
  }
}

/**
 * Write items to a table
 */
function writeTable(tableName: string, items: StorageItem[]): void {
  const filePath = getTablePath(tableName);
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
}

/**
 * Put an item into storage (create or update)
 */
export function putItem(tableName: string, item: StorageItem): void {
  const items = readTable(tableName);
  const existingIndex = items.findIndex(
    (i) => {
      // For trips table, match by userId and tripId
      if (tableName === 'trips' && item.userId && item.tripId) {
        return i.userId === item.userId && i.tripId === item.tripId;
      }
      // For users table, match by userId
      if (tableName === 'users' && item.userId) {
        return i.userId === item.userId;
      }
      // Default: match by id if exists
      return item.id && i.id === item.id;
    }
  );
  
  if (existingIndex >= 0) {
    items[existingIndex] = { ...items[existingIndex], ...item };
  } else {
    items.push(item);
  }
  
  writeTable(tableName, items);
}

/**
 * Get an item from storage
 */
export function getItem(tableName: string, key: StorageItem): StorageItem | null {
  const items = readTable(tableName);
  
  const item = items.find((i) => {
    // For trips table, match by userId and tripId
    if (tableName === 'trips' && key.userId && key.tripId) {
      return i.userId === key.userId && i.tripId === key.tripId;
    }
    // For users table, match by userId or email
    if (tableName === 'users') {
      if (key.userId) return i.userId === key.userId;
      if (key.email) return i.email === key.email;
    }
    // Default: match by id
    return key.id && i.id === key.id;
  });
  
  return item || null;
}

/**
 * Update an item in storage
 */
export function updateItem(
  tableName: string,
  key: StorageItem,
  updates: StorageItem
): StorageItem | null {
  const items = readTable(tableName);
  
  const index = items.findIndex((i) => {
    if (tableName === 'trips' && key.userId && key.tripId) {
      return i.userId === key.userId && i.tripId === key.tripId;
    }
    if (tableName === 'users' && key.userId) {
      return i.userId === key.userId;
    }
    return key.id && i.id === key.id;
  });
  
  if (index < 0) {
    return null;
  }
  
  items[index] = { ...items[index], ...updates };
  writeTable(tableName, items);
  
  return items[index];
}

/**
 * Delete an item from storage
 */
export function deleteItem(tableName: string, key: StorageItem): void {
  const items = readTable(tableName);
  
  const filteredItems = items.filter((i) => {
    if (tableName === 'trips' && key.userId && key.tripId) {
      return !(i.userId === key.userId && i.tripId === key.tripId);
    }
    if (tableName === 'users' && key.userId) {
      return i.userId !== key.userId;
    }
    return key.id && i.id !== key.id;
  });
  
  writeTable(tableName, filteredItems);
}

/**
 * Query items from storage
 */
export function queryItems(
  tableName: string,
  filterFn?: (item: StorageItem) => boolean
): StorageItem[] {
  const items = readTable(tableName);
  
  if (filterFn) {
    return items.filter(filterFn);
  }
  
  return items;
}

/**
 * Initialize storage with empty arrays if tables don't exist
 */
export function initializeStorage(): void {
  const tables = ['trips', 'users'];
  tables.forEach(table => {
    const filePath = getTablePath(table);
    if (!fs.existsSync(filePath)) {
      writeTable(table, []);
    }
  });
}

// Initialize on module load
initializeStorage();
