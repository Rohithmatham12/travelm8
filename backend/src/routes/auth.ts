import { Router, Request, Response } from 'express';
import { registerUser, loginUser, generateSecureToken, User } from '../utils/auth';
import { getItem, putItem } from '../utils/storage';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email';
import { successResponse, badRequestResponse, notFoundResponse, internalErrorResponse } from '../utils/response';

export const authRouter = Router();

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return badRequestResponse(res, 'Email and password are required');
    }

    if (password.length < 6) {
      return badRequestResponse(res, 'Password must be at least 6 characters');
    }

    const { user, token } = await registerUser(email, password, name);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    successResponse(res, {
      user: userWithoutPassword,
      token
    }, 'User registered successfully');
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return badRequestResponse(res, error.message);
    }
    console.error('Registration error:', error);
    internalErrorResponse(res, 'Failed to register user');
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return badRequestResponse(res, 'Email and password are required');
    }

    const { user, token } = await loginUser(email, password);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    successResponse(res, {
      user: userWithoutPassword,
      token
    }, 'Login successful');
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return badRequestResponse(res, error.message);
    }
    console.error('Login error:', error);
    internalErrorResponse(res, 'Failed to login');
  }
});

// Forgot password — always returns 200 to avoid email enumeration
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return badRequestResponse(res, 'Email required');

    const user = await getItem('users', { email }) as User | null;
    if (user) {
      const token = generateSecureToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      await putItem('users', { ...user, resetToken: token, resetTokenExpiry: expiry, updatedAt: new Date().toISOString() });
      sendPasswordResetEmail(email, token).catch(() => {});
    }
    return successResponse(res, null, 'If that email exists, a reset link has been sent.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return internalErrorResponse(res, 'Failed to process request');
  }
});

// Reset password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return badRequestResponse(res, 'token and newPassword required');
    if (newPassword.length < 6) return badRequestResponse(res, 'Password must be at least 6 characters');

    const users = await import('../utils/storage').then(m => m.readTable('users'));
    const user = users.find((u: any) => u.resetToken === token) as User | undefined;

    if (!user) return badRequestResponse(res, 'Invalid or expired reset link');
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return badRequestResponse(res, 'Reset link has expired. Request a new one.');
    }

    const { hashPassword } = await import('../utils/auth');
    const hashed = await hashPassword(newPassword);
    await putItem('users', {
      ...user,
      password: hashed,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      updatedAt: new Date().toISOString(),
    });
    return successResponse(res, null, 'Password updated. You can now sign in.');
  } catch (error) {
    console.error('Reset password error:', error);
    return internalErrorResponse(res, 'Failed to reset password');
  }
});

// Verify email
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return badRequestResponse(res, 'token required');

    const users = await import('../utils/storage').then(m => m.readTable('users'));
    const user = users.find((u: any) => u.emailVerifyToken === token) as User | undefined;

    if (!user) return badRequestResponse(res, 'Invalid verification link');
    if (user.emailVerified) return successResponse(res, null, 'Email already verified');
    if (!user.emailVerifyExpiry || new Date(user.emailVerifyExpiry) < new Date()) {
      return badRequestResponse(res, 'Verification link expired. Request a new one.');
    }

    await putItem('users', {
      ...user,
      emailVerified: true,
      emailVerifyToken: undefined,
      emailVerifyExpiry: undefined,
      updatedAt: new Date().toISOString(),
    });
    return successResponse(res, null, 'Email verified successfully!');
  } catch (error) {
    console.error('Verify email error:', error);
    return internalErrorResponse(res, 'Failed to verify email');
  }
});

// Resend verification email
authRouter.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return badRequestResponse(res, 'Email required');

    const user = await getItem('users', { email }) as User | null;
    if (!user) return successResponse(res, null, 'If that email exists, a verification link has been sent.');
    if (user.emailVerified) return badRequestResponse(res, 'Email already verified');

    const token = generateSecureToken();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await putItem('users', { ...user, emailVerifyToken: token, emailVerifyExpiry: expiry, updatedAt: new Date().toISOString() });
    sendVerificationEmail(email, token).catch(() => {});
    return successResponse(res, null, 'Verification email sent.');
  } catch (error) {
    console.error('Resend verification error:', error);
    return internalErrorResponse(res, 'Failed to resend verification');
  }
});

