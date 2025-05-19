import { config } from '@/config';
import { logger } from '@/utils/logger';
import { drizzle } from 'drizzle-orm/libsql';

// Export the database client
export const db = drizzle({
  connection: {
    url: config.database.url,
    authToken: config.database.authToken,
  },
});

// Database initialization function
export const initDatabase = async (): Promise<void> => {
  try {
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', { error });
    throw error;
  }
};
