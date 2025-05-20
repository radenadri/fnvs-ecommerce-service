import { db } from '@/db';
import { LoginUser, users } from '@/models/user';
import { RegisterUser, UserResponse } from '@/models/user';
import { comparePassword, generateToken, hashPassword, verifyToken } from '@/utils/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { logger } from '@/utils/logger';
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
        .returning()
        .get();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      // Generate JWT token
      const token = generateToken({
        id: userWithoutPassword.id,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
      });

      // Save token to database
      await this.saveAccessToken(token, newUser.id);

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
        .get();

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

      // Save token to database
      await this.saveAccessToken(token, user.id);

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

  // Logout user
  public async logout(token: string): Promise<boolean> {
    try {
      // Verify JWT token
      const decodedToken = verifyToken(token);

      // Find user by ID
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedToken.id))
        .get();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove access token from database
      await db
        .update(users)
        .set({
          accessToken: null,
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      logger.error('Error logging out user', { error });

      throw error;
    }
  }

  // Get user by access token
  public async getUserByToken(token: string): Promise<UserResponse> {
    try {
      // Verify JWT token
      const decodedToken = verifyToken(token);

      // Find user by ID
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedToken.id))
        .get();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove password from response
      const { password: _password, accessToken: _accessToken, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error getting user by token', { error });

      throw error;
    }
  }

  public async saveAccessToken(token: string, newUserId: number) {
    await db
      .update(users)
      .set({
        accessToken: token,
      })
      .where(eq(users.id, newUserId));
  }
}
