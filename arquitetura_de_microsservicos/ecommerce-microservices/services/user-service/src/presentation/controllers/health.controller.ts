import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<{ status: string; checks: Record<string, string> }> {
    let db: string = 'fail';
    try {
      await this.dataSource.query('SELECT 1');
      db = 'ok';
    } catch {
      // ignore
    }
    const allHealthy = db === 'ok';
    return {
      status: allHealthy ? 'ok' : 'degraded',
      checks: { db },
    };
  }
}
