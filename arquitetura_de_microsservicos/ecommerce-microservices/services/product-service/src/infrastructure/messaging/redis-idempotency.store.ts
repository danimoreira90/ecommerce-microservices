import { Injectable, Inject } from '@nestjs/common';
import { IIdempotencyStore } from './kafka.consumer';
import { REDIS_CLIENT } from '../cache/product-cache.service';
import { IRedisClient } from '../cache/product-cache.service';

@Injectable()
export class RedisIdempotencyStore implements IIdempotencyStore {
  private readonly prefix = 'idempotency:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: IRedisClient) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(this.prefix + key);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.redis.setex(this.prefix + key, ttl, value);
  }
}
