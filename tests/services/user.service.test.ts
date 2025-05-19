import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '@/services/user.service';
import { db } from '@/db';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import * as auth from '@/utils/auth';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    get: vi.fn(),
    returning: vi.fn().mockResolvedValue([{
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      username: 'test',
      password: 'hashedPassword123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }]),
  },
}));

vi.mock('@/utils/auth', () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  username: 'test',
  password: 'hashedPassword123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const result = await userService.register({
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
        password_confirmation: mockUser.password,
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).not.toHaveProperty('password');
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
      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve([mockUser]));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      // Mock password comparison
      (auth.comparePassword as any).mockResolvedValue(true);
      (auth.generateToken as any).mockReturnValue('mockToken123');

      const result = await userService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token', 'mockToken123');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        userService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve([mockUser]));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      (auth.comparePassword as any).mockResolvedValue(false);

      await expect(
        userService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getUserById', () => {
    it('should successfully return a user by id', async () => {
      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve([mockUser]));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValueOnce({ from: mockFrom });

      const result = await userService.getUserById(1);

      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundError if user not found', async () => {
      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve([]));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await expect(userService.getUserById(999)).rejects.toThrow(NotFoundError);
    });
  });
});
