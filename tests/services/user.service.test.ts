import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '@/services/user.service';
import { db } from '@/db';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { comparePassword, generateToken, hashPassword, verifyToken } from '@/utils/auth';
import { eq } from 'drizzle-orm';
import { users } from '@/models/user';
import { logger } from '@/utils/logger';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}));

vi.mock('@/utils/auth', () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('@/utils/logger', () => {
  return {
    logger: {
      error: vi.fn()
    }
  };
});

describe('UserService', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    username: 'test',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginData = {
    email: mockUser.email,
    password: mockUser.password
  }

  const mockRegisterData = {
    email: mockUser.email,
    name: mockUser.name,
    password: mockUser.password,
    password_confirmation: mockUser.password
  }

  const mockToken = 'jwt_token_123';

  const mockDecodedToken = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
  };

  let userService: UserService;
  const mockSaveAccessToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
    userService.saveAccessToken = mockSaveAccessToken;

    // Reset mock implementations
    vi.mocked(verifyToken).mockReturnValueOnce(mockDecodedToken);
    vi.mocked(eq).mockReturnValueOnce({ field: 'id', value: mockDecodedToken.id } as any);
    vi.mocked(db.get).mockResolvedValue(null);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Mock DB returning no existing user
      (db.get as any).mockResolvedValueOnce(null);

      // Mock password hashing
      const hashedPassword = 'hashed_password_123';
      (hashPassword as any).mockResolvedValueOnce(hashedPassword);

      // Mock creating new user in database
      const newUser = {
        id: 1,
        email: mockRegisterData.email,
        name: mockRegisterData.name,
        username: 'test',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date()
      };
      (db.get as any).mockResolvedValueOnce(newUser);

      // Mock token generation
      (generateToken as any).mockReturnValueOnce(mockToken);

      // Mock successful token save
      mockSaveAccessToken.mockResolvedValueOnce(undefined);

      // Execute the register function
      const result = await userService.register(mockRegisterData);

      // Verify the correct DB queries were executed
      expect(db.select).toHaveBeenCalled();
      expect(db.select().from).toHaveBeenCalledWith(users);
      expect(eq).toHaveBeenCalledWith(users.email, newUser.email);
      expect(db.select().from(users).limit).toHaveBeenCalledWith(1);
      expect(db.get).toHaveBeenCalled();

      // Verify password was hashed
      expect(hashPassword).toHaveBeenCalledWith(mockRegisterData.password);

      // Verify user was inserted with correct values
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith({
        ...mockRegisterData,
        username: 'test',
        password: hashedPassword,
      });

      // Verify token was generated with correct payload
      expect(generateToken).toHaveBeenCalledWith({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });

      // Verify token was saved
      expect(mockSaveAccessToken).toHaveBeenCalledWith(mockToken, newUser.id);

      // Verify correct response
      const { password: _, ...userWithoutPassword } = newUser;
      expect(result).toEqual({
        user: userWithoutPassword,
        token: mockToken
      });
    });

    it('should throw ConflictError if user already exists', async () => {
      (db.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUser);

      // Arrange
      const userData = {
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
        password_confirmation: mockUser.password,
      };

      // Act & Assert
      await expect(userService.register(userData))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      // Setup mocks for successful login
      vi.mocked(db.get).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValueOnce(mockToken);

      // Call the function
      const result = await userService.login(mockLoginData);

      // Assertions
      expect(db.select).toHaveBeenCalled();
      expect(db.select().from).toHaveBeenCalledWith(users);
      expect(db.select().from(users).where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(users.email, mockUser.email);
      expect(comparePassword).toHaveBeenCalledWith(mockUser.password, mockUser.password);
      expect(generateToken).toHaveBeenCalledWith(mockDecodedToken);

      // Check result structure and values
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          name: mockUser.name,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        },
        token: mockToken
      });

      // Ensure password is not returned
      expect(result.user).not.toHaveProperty('access_token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      // Setup mock to return null (user not found)
      vi.mocked(db.get).mockResolvedValue(null);

      // Assert that the function throws the expected error
      await expect(userService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
      await expect(userService.login(mockLoginData)).rejects.toThrow('Invalid email or password');

      // Verify that password comparison was not attempted
      expect(comparePassword).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      // Setup mocks for invalid password scenario
      vi.mocked(db.get).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(false);

      // Assert that the function throws the expected error
      await expect(userService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
      await expect(userService.login(mockLoginData)).rejects.toThrow('Invalid email or password');

      // Verify comparePassword was called but token generation wasn't
      expect(comparePassword).toHaveBeenCalledWith(mockLoginData.password, mockUser.password);
      expect(generateToken).not.toHaveBeenCalled();
    });
  });

  describe('getUserByToken', () => {
    it('should successfully retrieve a user with a valid token', async () => {
      // Setup mock to return a user
      vi.mocked(db.get).mockResolvedValue(mockUser);

      // Call the function
      const result = await userService.getUserByToken(mockToken);

      // Assertions
      expect(verifyToken).toHaveBeenCalledWith(mockToken);
      expect(db.select).toHaveBeenCalled();
      expect(db.select().from).toHaveBeenCalledWith(users);
      expect(db.select().from(users).where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(users.id, mockDecodedToken.id);

      // Check result structure and values
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });

      // Ensure password is not returned
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundError when user is not found', async () => {
      // Setup mock to return null (user not found)
      vi.mocked(db.get).mockResolvedValue(null);

      // Assert that the function throws the expected error
      await expect(userService.getUserByToken(mockToken)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserByToken(mockToken)).rejects.toThrow('User not found');

      // Verify token was verified and database was queried
      expect(verifyToken).toHaveBeenCalledWith(mockToken);
      expect(db.get).toHaveBeenCalled();
    });

    it('should log and rethrow other errors from database queries', async () => {
      // Setup mock to throw a non-NotFoundError from the database query
      const databaseError = new Error('Database connection error');
      vi.mocked(db.get).mockRejectedValue(databaseError);

      // Assert that the function rethrows the error
      await expect(userService.getUserByToken(mockToken)).rejects.toThrow(databaseError);

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith('Error getting user by token', {
        error: databaseError
      });
    });

    it('should not log NotFoundError but rethrow it', async () => {
      // Setup mock to throw NotFoundError from the database query
      const notFoundError = new NotFoundError('User not found');
      vi.mocked(db.get).mockRejectedValue(notFoundError);

      // Assert that the function rethrows the error
      await expect(userService.getUserByToken(mockToken)).rejects.toThrow(notFoundError);

      // Verify error was NOT logged
      expect(logger.error).not.toHaveBeenCalled();
    });
  })
});
