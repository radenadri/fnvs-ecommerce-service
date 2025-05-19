import { db } from '@/db';
import { LoginUser, users } from '@/models/user';
import { RegisterUser, UserResponse } from '@/models/user';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { formatISO } from 'date-fns';
import { eq } from 'drizzle-orm';

export class UserService {
  // Register a new user
  public async register(
    userData: RegisterUser
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1)
        .get();

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      if (userData.password !== userData.password_confirmation) {
        throw new ConflictError('Passwords do not match');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          ...userData,
          username: userData.email.split('@')[0],
          password: hashedPassword,
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser[0];

      // Generate JWT token
      const token = generateToken({
        id: userWithoutPassword.id,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
      });

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }

      logger.error('Error registering user', { error, email: userData.email });

      throw error;
    }
  }

  // Login user
  public async login(
    loginData: LoginUser
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Find user by email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, loginData.email))
        .then((res) => res[0]);

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Compare passwords
      const isPasswordValid = await comparePassword(
        loginData.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = generateToken({
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
      });

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      logger.error('Error logging in user', { error, email: loginData.email });
      throw error;
    }
  }

  // Get user by ID
  public async getUserById(id: number): Promise<UserResponse> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then((res) => res[0]);

      if (!user) {
        throw new NotFoundError(`User with id ${id} not found`);
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Error getting user by id ${id}`, { error });
      throw error;
    }
  }
}
