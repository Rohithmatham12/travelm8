import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { putItem, getItem, updateItem } from './storage';
import { sendVerificationEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'travelm8-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  userId: string;
  email: string;
  password: string; // hashed
  name?: string;
  role: 'traveler' | 'admin';
  emailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyExpiry?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthRequest extends Request {
  body: any;
  query: any;
  params: any;
  headers: any;
  userId?: string;
  user?: User;
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, email: string): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    options
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authentication middleware
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required'
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
    return;
  }

  // Get user from storage
  const user = await getItem('users', { userId: decoded.userId }) as User | null;
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  req.userId = decoded.userId;
  req.user = user;
  next();
}

export function requireRole(roles: User['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role || 'traveler';
    if (!roles.includes(role)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
  // Check if user already exists
  const existingUser = await getItem('users', { email }) as User | null;
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const verifyToken = generateSecureToken();
  const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const user: User = {
    userId,
    email,
    password: hashedPassword,
    name,
    role: 'traveler',
    emailVerified: false,
    emailVerifyToken: verifyToken,
    emailVerifyExpiry: verifyExpiry,
    createdAt: now,
    updatedAt: now,
  };

  await putItem('users', user);
  sendVerificationEmail(email, verifyToken).catch(() => {}); // non-blocking

  const token = generateToken(userId, email);

  return { user, token };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const user = await getItem('users', { email }) as User | null;
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.userId, user.email);

  return { user, token };
}
