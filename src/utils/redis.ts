import Redis from 'ioredis';
import { logger } from './logger';
import { config } from '@/config';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  lazyConnect: true,
  retryStrategy: (times: number): number => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect to Redis during service initialization
export const connectRedis = async (): Promise<void> => {
  try {
    // Attempt to connect only if not already connected
    if (redisClient.status !== 'ready') {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Don't throw error here to allow service to start without Redis
  }
};

export { redisClient };
