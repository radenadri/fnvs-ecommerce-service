import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '@/utils/logger';

export const validateSchema = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body as Record<string, unknown>,
      query: req.query,
      params: req.params,
    });

    next();
  } catch (error) {
    logger.error("Validation error: ", error);

    if (error instanceof ZodError) {
      res.status(400).send({
        errors: error.issues.map(issue => ({ field: issue.path[1], message: issue.message }))
      })
    }

    return next(error);
  }
};
