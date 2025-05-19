import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '@/services/product.service';
import { db } from '@/db';
import { NotFoundError } from '@/utils/errors';
import { redisClient } from '@/utils/redis';

// Mock the database and redis utilities
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/utils/redis', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProductService', () => {
  let productService: ProductService;

  const mockProducts = [
    {
      id: 1,
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test description',
      price: 100,
      image: 'test-image.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test description',
      price: 150,
      image: 'test-image.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    productService = new ProductService();
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return products from cache if available', async () => {
      (redisClient.get as any).mockResolvedValue(JSON.stringify(mockProducts));

      const result = await productService.getAllProducts();

      expect(result).toEqual(mockProducts);
      expect(redisClient.get).toHaveBeenCalledWith('all_products');
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      vi.mocked(redisClient.get).mockResolvedValue(null);
      vi.mocked(db.get).mockResolvedValue(mockProducts);

      // Act
      await productService.getAllProducts();

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalledAfter
    });
  });

  describe('getProductBySlug', () => {
    it('should return product from cache if available', async () => {
      (redisClient.get as any).mockResolvedValue(JSON.stringify(mockProducts));

      const result = await productService.getProductBySlug('test-product');

      expect(result).toEqual(mockProducts);
      expect(redisClient.get).toHaveBeenCalledWith('product:test-product');
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      (redisClient.get as any).mockResolvedValue(null);

      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve(mockProducts));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValueOnce({ from: mockFrom });

      await productService.getProductBySlug('test-product-1');

      expect(db.select).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalledAfter;
    });

    it('should throw NotFoundError if product not found', async () => {
      (redisClient.get as any).mockResolvedValue(null);

      const mockWhere = vi.fn().mockReturnValueOnce(Promise.resolve([]));
      const mockFrom = vi.fn().mockReturnValueOnce({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await expect(productService.getProductBySlug('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
