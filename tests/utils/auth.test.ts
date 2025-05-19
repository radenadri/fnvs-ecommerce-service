import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
} from '@/utils/auth';
import { config } from '@/config';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('bcrypt');
vi.mock('@/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '24h',
    },
  },
}));

describe('Auth Utils', () => {
  describe('generateToken', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'test@example.com',
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should generate a JWT token', () => {
      // Act
      generateToken(mockUser);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
        'test-secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.i6jqfgTyJu3TgzVTWhkBI0RFiJjxtlyB7Ze89ySRzh8';

      verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
    });

    it('should throw an error for invalid token', () => {
      const token = 'invalid_token';

      // Mock jwt.verify to throw an error
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken(token)).toThrow();
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'password123';
      const salt = 's4lt3dpwdd'

      const result = await hashPassword(password);

      vi.mocked(bcrypt.genSalt).mockImplementation(() => Promise.resolve(10))
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);

      expect(bcrypt.hash).toHaveBeenCalledAfter;
      expect(result).toReturn
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed_password';

      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true))

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'wrong_password';
      const hashedPassword = 'hashed_password';

      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false))

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
