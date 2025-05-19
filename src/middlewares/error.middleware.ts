import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import * as Sentry from '@sentry/node';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Log the error
  logger.error(`Error occurred: ${err.message}`, {
    error: err,
    path: req.path,
    method: req.method,
  });

  // Capture error in Sentry if it's enabled
  Sentry.captureException(err);

  // Handle operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).send({
      success: false,
      message: err.message,
    });
  }

  // For all other errors, return a generic error message
  res.status(500).send({
    success: false,
    message: 'Internal Server Error',
  });
};
