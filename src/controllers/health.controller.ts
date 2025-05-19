import { Request, Response } from 'express';

export class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check if the service is up and running
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2023-08-30T12:00:00.000Z"
   *                 uptime:
   *                   type: number
   *                   example: 3600
   *                 service:
   *                   type: string
   *                   example: ecommerce-service
   */
  public health(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime().toPrecision(3),
      service: 'ecommerce-service',
    });
  }
}
