import * as Sentry from '@sentry/node';
import { logger } from './logger';
import { config } from '@/config';

export const initSentry = (): void => {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.server.env,
      tracesSampleRate: config.server.env === 'production' ? 0.2 : 1.0,
    });
    logger.info('Sentry initialized');
  } else {
    logger.warn('Sentry DSN not provided, error tracking disabled');
  }
};
