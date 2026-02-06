import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './product-cache.service';
import { env } from '../config/environment.config';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    return new Redis({
      host: env.redis.host(),
      port: env.redis.port(),
      maxRetriesPerRequest: 3,
    });
  },
};
