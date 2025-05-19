import { createApp } from './app';
import { config } from '@/config';
import { initDatabase } from '@/db';
import { logger } from '@/utils/logger';
import { connectRedis } from '@/utils/redis';
import { initSentry } from '@/utils/sentry';

const startServer = async (): Promise<void> => {
  try {
    // Initialize Sentry
    initSentry();

    // Initialize database
    await initDatabase();

    // Connect to Redis
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.server.port, () => {
      logger.info(
        `Server running on port ${config.server.port} in ${config.server.env} mode`
      );
      logger.info(
        `API documentation available at ${config.server.host}:${config.server.port}/api-docs`
      );
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
void startServer();
