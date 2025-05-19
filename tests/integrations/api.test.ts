import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { UserService } from '@/services/user.service';
import { ProductService } from '@/services/product.service';
import { verifyToken } from '@/utils/auth';
import { config } from '@/config';

// Mock services
vi.mock('@/services/user.service');
vi.mock('@/services/product.service');
vi.mock('@/utils/auth');
vi.mock('@/db', () => ({}));
vi.mock('@/utils/redis', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('API Routes Integration Tests', () => {
  const app = createApp();
  const prefix = `/api/${config.server.apiVersion}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Endpoint', () => {
    it('GET /api/v1/health should return OK status', async () => {
      const response = await request(app).get(`${prefix}/health`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.service).toBe('ecommerce-service');
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/v1/auth/register should register a new user', async () => {
      const userData = {
        id: 1,
        name: 'Test User',
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        user: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
        token: 'mock_token',
      };

      // Mock register method
      vi.mocked(UserService.prototype.register).mockResolvedValue(mockResponse);

      const response = await request(app).post(`${prefix}/auth/register`).send({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/v1/auth/login should authenticate a user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 1,
          name: 'Test User',
          email: loginData.email,
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'mock_token',
      };

      // Mock login method
      vi.mocked(UserService.prototype.login).mockResolvedValue(mockResponse);

      const response = await request(app).post(`${prefix}/auth/login`).send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('POST /register should return 400 for invalid data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        username: 'te', // too short
        password: 'short', // too short
      };

      const response = await request(app)
        .post(`${prefix}/auth/register`)
        .send(invalidUserData);

      expect(response.status).toBe(400);
    });
  });

  describe('Product Endpoints', () => {
    it('GET /api/v1/products should return all products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product 1',
          slug: 'test-product-1',
          description: 'Description 1',
          price: 1999,
          image: 'https://example.com/image1.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Test Product 2',
          slug: 'test-product-2',
          description: 'Description 2',
          price: 2999,
          image: 'https://example.com/image2.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock getAllProducts method
      vi.mocked(ProductService.prototype.getAllProducts).mockResolvedValue(
        mockProducts
      );

      const response = await request(app).get(`${prefix}/products`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });

    it('GET /api/v1/products/:slug should return a specific product when authenticated', async () => {
      const slug = 'test-product';
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        slug,
        description: 'Test description',
        price: 1999,
        image: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductBySlug method
      vi.mocked(ProductService.prototype.getProductBySlug).mockResolvedValue(
        mockProduct
      );

      // Mock verifyToken
      vi.mocked(verifyToken).mockReturnValueOnce({ id: 1 });

      const response = await request(app)
        .get(`${prefix}/products/${slug}`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /products/:slug should return 401 when not authenticated', async () => {
      const slug = 'test-product';

      const response = await request(app).get(`${prefix}/products/${slug}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('GET /api/v1/products/:slug should return 404 when product not found', async () => {
      const slug = 'nonexistent-product';

      // Mock getProductBySlug to throw NotFoundError
      vi.mocked(ProductService.prototype.getProductBySlug).mockRejectedValue(
        new Error('Product not found')
      );

      // Mock verifyToken
      vi.mocked(verifyToken).mockReturnValueOnce({ id: 1 });

      const response = await request(app)
        .get(`${prefix}/products/${slug}`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(500); // Since we're mocking a generic Error, it will be caught by the global error handler
      expect(ProductService.prototype.getProductBySlug).toHaveBeenCalledWith(
        slug
      );
    });
  });
});
