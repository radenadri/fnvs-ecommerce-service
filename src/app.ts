import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cookies from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';

import { config } from '@/config';
import { errorHandler } from '@/middlewares/error.middleware';
import { swaggerSpec } from '@/utils/swagger';

import healthRoutes from '@/routes/health.routes';
import productRoutes from '@/routes/product.routes';
import authRoutes from '@/routes/auth.routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Sentry request handler
  app.use(Sentry.Handlers.requestHandler());

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(cookies());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    cors({
      credentials: true,
      origin: config.cors.origin.split(',').map(origin => origin.trim()),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  });
  app.use(limiter);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.get('/', (_, res) => {
    res.send({
      success: true,
      message: 'Welcome to the Finvise API',
    });
  })
  app.use(`/api/${config.server.apiVersion}/health`, healthRoutes);
  app.use(`/api/${config.server.apiVersion}/products`, productRoutes);
  app.use(`/api/${config.server.apiVersion}/auth`, authRoutes);

  // Sentry error handler
  app.use(Sentry.Handlers.errorHandler());

  // Global error handler
  app.use(errorHandler);

  return app;
};
