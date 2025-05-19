import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/auth';
import { logger } from '@/utils/logger';

// Define interface to extend Express Request
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        name: string;
        email: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!authHeader || !authHeader.startsWith('Bearer ') || !token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });

      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });

      return;
    }

    req.user = {
      id: decoded.id as number,
      name: decoded.name as string,
      email: decoded.email as string,
    }

    next();
  } catch (error) {
    logger.error('Authentication error', { error });

    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });

    return;
  }
};
