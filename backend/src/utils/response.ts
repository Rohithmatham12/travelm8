import { Response } from 'express';
import { ApiResponse } from '../types/trip';

export function createResponse<T>(
  res: Response,
  statusCode: number,
  data?: T,
  error?: string,
  message?: string
): Response {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    ...(data && { data }),
    ...(error && { error }),
    ...(message && { message }),
  };

  return res.status(statusCode).json(response);
}

export function successResponse<T>(res: Response, data: T, message?: string): Response {
  return createResponse(res, 200, data, undefined, message);
}

export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  return createResponse(res, 201, data, undefined, message);
}

export function badRequestResponse(res: Response, error: string): Response {
  return createResponse(res, 400, undefined, error);
}

export function unauthorizedResponse(res: Response, error: string = 'Unauthorized'): Response {
  return createResponse(res, 401, undefined, error);
}

export function forbiddenResponse(res: Response, error: string = 'Forbidden'): Response {
  return createResponse(res, 403, undefined, error);
}

export function notFoundResponse(res: Response, error: string = 'Not found'): Response {
  return createResponse(res, 404, undefined, error);
}

export function internalErrorResponse(res: Response, error: string = 'Internal server error'): Response {
  return createResponse(res, 500, undefined, error);
}

