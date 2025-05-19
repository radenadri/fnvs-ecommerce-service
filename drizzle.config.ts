import type { Config } from 'drizzle-kit';
import { config } from './src/config/index';

export default {
  schema: './src/models',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: config.database.url,
    authToken: config.database.authToken,
  },
} satisfies Config;
