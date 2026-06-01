import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { getCorsOrigins, loadEnv } from './config/env';

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => new BadRequestException({
      code: 'validation_failed',
      message: errors.flatMap((error) => Object.values(error.constraints ?? {})),
    }),
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  const documentConfig = new DocumentBuilder()
    .setTitle('Twin@P.CN Backend API')
    .setDescription('Digital twin backend API')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste accessToken from POST /api/v1/auth/login.' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  await app.listen(env.APP_PORT, env.APP_HOST);
}
void bootstrap();
