import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function getOrCreateCorrelationId(header?: string): string {
  if (header && header.trim()) return header.trim();
  return randomUUID();
}
