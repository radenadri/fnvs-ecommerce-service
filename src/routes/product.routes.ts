import { Router } from 'express';
import { ProductController } from '@/controllers/product.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validateSchema } from '@/middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();
const productController = new ProductController();

// Schema for slug parameter validation
const SlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Product slug is required'),
  }),
});

// Get all products
router.get('/', productController.getAllProducts.bind(productController));

// Get product by slug
router.get(
  '/:slug',
  authenticate,
  validateSchema(SlugParamSchema),
  productController.getProductBySlug.bind(productController)
);

export default router;
