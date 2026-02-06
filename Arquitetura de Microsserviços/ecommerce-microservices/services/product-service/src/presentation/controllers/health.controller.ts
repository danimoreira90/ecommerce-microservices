import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT, IRedisClient } from '../../infrastructure/cache/product-cache.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: IRedisClient,
  ) {}

  @Get('live')
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<{ status: string; checks: Record<string, string> }> {
    let db = 'fail';
    let redis = 'fail';
    try {
      await this.dataSource.query('SELECT 1');
      db = 'ok';
    } catch {
      // ignore
    }
    try {
      await this.redis.get('health:ping');
      redis = 'ok';
    } catch {
      // ignore
    }
    const allHealthy = db === 'ok' && redis === 'ok';
    return {
      status: allHealthy ? 'ok' : 'degraded',
      checks: { db, redis },
    };
  }
}
