import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validateSchema } from '@/middlewares/validation.middleware';
import { LoginUserSchema, RegisterUserSchema } from '@/models/user';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// Validation schemas for request body
const LoginSchema = z.object({
  body: LoginUserSchema,
});

const RegisterSchema = z.object({
  body: RegisterUserSchema,
});

// Login route
router.post(
  '/login',
  validateSchema(LoginSchema),
  authController.login.bind(authController)
);

// Register route
router.post(
  '/register',
  validateSchema(RegisterSchema),
  authController.register.bind(authController)
);

export default router;
