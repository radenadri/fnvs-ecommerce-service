# Finvise Ecommerce Service

This service handles product listings and authentication for an ecommerce platform.

## Features

- Product listing with details (name, price, image, description)
- User authentication (login/register) with JWT
- Protected routes for detailed product information
- Health check endpoint
- Swagger documentation

## Swagger Screenshot

![Swagger Screenshot](screenshoot/swagger.png)

## Technology Stack

- TypeScript (strict mode)
- Node.js
- Express.js
- SQLite with Drizzle ORM
- JWT for authentication
- Zod for validation
- Swagger for API documentation
- Jest for testing

## Project Structure

```
ecommerce-service/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── db/               # Database schemas and migrations
│   │   ├── migrations/
│   │   └── schema.ts
│   ├── middleware/       # Custom middleware
│   ├── models/           # Data models with Zod validation
│   ├── routes/           # API routes with Swagger documentation
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Entry point
├── tests/                # Unit and integration tests
├── .dockerignore
├── .env.example
├── .eslintrc.js
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/{slug}` - Get product details (JWT protected)
- `POST /api/v1/login` - User login
- `POST /api/v1/register` - User registration

## Getting Started

### Prerequisites

- Node.js LTS version
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Run database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:push
   ```
5. Start the service:
   ```bash
   npm run dev
   ```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

```bash
docker compose up -d
```

## License

[MIT](LICENSE)
