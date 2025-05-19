import { db } from '@/db';
import { products } from '@/models/product';
import { CreateProduct, Product, UpdateProduct } from '@/models/product';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { redisClient } from '@/utils/redis';
import { formatISO } from 'date-fns';
import { eq } from 'drizzle-orm';

export class ProductService {
  // Get all products
  public async getAllProducts(): Promise<Product[]> {
    try {

      // Try to get from cache first
      const cachedProducts = await redisClient.get('all_products');

      if (cachedProducts) {
        logger.debug('Returning products from cache');

        const cachedProductsParsed = JSON.parse(cachedProducts) as Product[];

        return cachedProductsParsed;
      }

      // If not in cache, get from database
      const allProducts = await db.select().from(products).execute();

      // Cache the results
      await redisClient.set(
        'all_products',
        JSON.stringify(allProducts),
        'EX',
        3600
      ); // 1 hour

      return allProducts;
    } catch (error) {
      logger.error('Error getting all products', { error });

      throw error;
    }
  }

  // Get product by slug
  public async getProductBySlug(slug: string): Promise<Product> {
    try {
      // Try to get from cache first
      const cachedProduct = await redisClient.get(`product:${slug}`);

      if (cachedProduct) {
        logger.debug(`Returning product ${slug} from cache`);

        return JSON.parse(cachedProduct) as Product;
      }

      // If not in cache, get from database
      const product = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .then((res) => res[0]);

      if (!product) {
        throw new NotFoundError(`Product with slug ${slug} not found`);
      }

      // Cache the result
      await redisClient.set(
        `product:${slug}`,
        JSON.stringify(product),
        'EX',
        3600
      ); // 1 hour

      return product;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Error getting product by slug ${slug}`, { error });
      throw error;
    }
  }

  // Create a new product
  public async createProduct(productData: CreateProduct): Promise<Product> {
    try {
      const newProduct = await db
        .insert(products)
        .values(productData)
        .returning();

      // Invalidate cache
      await redisClient.del('all_products');

      return newProduct[0];
    } catch (error) {
      logger.error('Error creating product', { error, productData });
      throw error;
    }
  }

  // Update a product
  public async updateProduct(
    slug: string,
    productData: UpdateProduct
  ): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.getProductBySlug(slug);

      // Update product
      const updatedProduct = await db
        .update(products)
        .set({ ...productData, updatedAt: new Date() })
        .where(eq(products.id, existingProduct.id as number))
        .returning();

      // Invalidate cache
      await redisClient.del(`product:${slug}`);
      await redisClient.del('all_products');

      return updatedProduct[0];
    } catch (error) {
      logger.error(`Error updating product ${slug}`, { error, productData });
      throw error;
    }
  }

  // Delete a product
  public async deleteProduct(slug: string): Promise<void> {
    try {
      // Check if product exists
      const existingProduct = await this.getProductBySlug(slug);

      // Delete product
      await db
        .delete(products)
        .where(eq(products.id, existingProduct.id as number));

      // Invalidate cache
      await redisClient.del(`product:${slug}`);
      await redisClient.del('all_products');
    } catch (error) {
      logger.error(`Error deleting product ${slug}`, { error });
      throw error;
    }
  }
}
