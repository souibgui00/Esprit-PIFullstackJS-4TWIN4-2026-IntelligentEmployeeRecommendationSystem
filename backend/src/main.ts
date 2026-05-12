import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { imageOptimizationMiddleware } from './image-optimization.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
    'https://intelligent-employee-recommendation-system-d363-kbcappi90.vercel.app',
  ];

  const envAllowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const allowedOrigins = new Set([
    ...defaultAllowedOrigins,
    ...envAllowedOrigins,
  ]);

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedOrigins.has(origin)) {
      return true;
    }

    // Allow Vercel preview and production deployments.
    return /^https:\/\/[a-z0-9._-]+\.vercel\.app$/i.test(origin);
  };

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Serve static files from 'uploads' directory
  const uploadDir = join(process.cwd(), 'uploads');
  // Use Sharp middleware to convert/resize dynamic images before falling back to express.static
  app.use('/uploads', imageOptimizationMiddleware);
  app.use('/uploads', express.static(uploadDir));
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
