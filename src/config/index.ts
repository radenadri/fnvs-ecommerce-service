import dotenv from 'dotenv';
dotenv.config();

interface DatabaseConfig {
  url: string;
  authToken: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: JwtExpiresIn;
}

interface ServerConfig {
  host: string;
  port: number;
  env: string;
  apiVersion: string;
}

interface CorsConfig {
  origin: string;
}

interface RedisConfig {
  host: string;
  port: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface Config {
  server: ServerConfig;
  cors: CorsConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  sentry: {
    dsn: string;
  };
  rateLimit: RateLimitConfig;
}

export type JwtExpiresIn = '15m' | '1h' | '24h' | '7d';

export const config: Config = {
  server: {
    host: process.env.HOST || 'http://localhost',
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  database: {
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || 'your-turso-auth-token',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: (process.env.JWT_EXPIRES_IN as JwtExpiresIn) || '24h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};
