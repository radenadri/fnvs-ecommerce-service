import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '@/config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Finvise Ecommerce Service API',
    version: '1.0.0',
    description: 'API documentation for Finvise Ecommerce Service',
  },
  servers: [
    {
      url: `${config.server.host}:${config.server.port}/api/v1`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Ergonomic Desk Chair',
          },
          slug: {
            type: 'string',
            example: 'ergonomic-desk-chair',
          },
          description: {
            type: 'string',
            example:
              'A comfortable chair designed for long working hours with lumbar support.',
          },
          price: {
            type: 'integer',
            example: 24999,
            description: 'Price in cents',
          },
          image: {
            type: 'string',
            example: 'https://example.com/images/chair.jpg',
          },
          createdAt: {
            type: 'integer',
            format: 'timestamp',
            example: 1630000000000,
          },
          updatedAt: {
            type: 'integer',
            format: 'timestamp',
            example: 1630000000000,
          },
        },
      },
      LoginUser: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'password123',
          },
        },
      },
      RegisterUser: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          password: {
            type: 'string',
            example: 'password123',
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          createdAt: {
            type: 'integer',
            format: 'timestamp',
            example: 1630000000000,
          },
          updatedAt: {
            type: 'integer',
            format: 'timestamp',
            example: 1630000000000,
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['src/controllers/*.ts', 'src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
