import { Request, Response, NextFunction } from 'express';
import { ProductService } from '@/services/product.service';
import { logger } from '@/utils/logger';

const productService = new ProductService();

export class ProductController {
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get all products
   *     description: Retrieve a list of all products
   *     tags: [Products]
   *     responses:
   *       200:
   *         description: A list of products
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *       500:
   *         description: Server error
   */
  public async getAllProducts(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const products = await productService.getAllProducts();

      res.status(200).json({
        status: true,
        data: products,
      });
    } catch (error) {
      logger.error('[getAllProducts] error : ', { error });

      next(error);
    }
  }

  /**
   * @swagger
   * /products/{slug}:
   *   get:
   *     summary: Get product by slug
   *     description: Retrieve a product by its slug
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: Product slug
   *     responses:
   *       200:
   *         description: Product found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Product not found
   *       500:
   *         description: Server error
   */
  public async getProductBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error('[getProductBySlug] error : ', { error });

      next(error);
    }
  }
}
