import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../utils/auth';
import { successResponse, badRequestResponse, internalErrorResponse } from '../utils/response';

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

