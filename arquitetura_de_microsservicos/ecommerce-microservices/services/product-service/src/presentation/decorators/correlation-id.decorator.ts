import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getOrCreateCorrelationId } from '@ecommerce/common';
import { CORRELATION_ID_HEADER } from '@ecommerce/common';

export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const header = request.headers?.[CORRELATION_ID_HEADER] ?? request.headers?.['x-correlation-id'];
    return getOrCreateCorrelationId(header);
  }
);
