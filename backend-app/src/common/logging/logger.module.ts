import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loadEnv } from '../../config/env';

const env = loadEnv();

@Module({ imports: [PinoLoggerModule.forRoot({ pinoHttp: { level: env.LOG_LEVEL, redact: ['req.headers.authorization', 'req.headers.cookie'], customProps: () => ({ service: 'twin-backend' }) } })], exports: [PinoLoggerModule] })
export class LoggerModule {}
