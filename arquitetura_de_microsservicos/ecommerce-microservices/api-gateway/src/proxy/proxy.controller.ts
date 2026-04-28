import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const ROUTES: Record<string, string> = {
  '/api/v1/users': process.env.USER_SERVICE_URL || 'http://localhost:3001',
  '/api/v1/products': process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  '/api/v1/search': process.env.SEARCH_SERVICE_URL || 'http://localhost:3003',
  '/api/v1/carts': process.env.CART_SERVICE_URL || 'http://localhost:3004',
  '/api/v1/orders': process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
  '/api/v1/payments': process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
};

@Controller()
export class ProxyController {
  @All('api/v1/*')
  proxy(@Req() req: Request, @Res() res: Response): void {
    const path = req.path;
    const base = Object.keys(ROUTES).find((r) => path.startsWith(r));
    if (!base) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    const target = ROUTES[base];
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${base}`]: base },
      onProxyReq: (proxyReq) => {
        const cid = req.headers['x-correlation-id'];
        if (cid) proxyReq.setHeader('x-correlation-id', cid as string);
      },
    })(req, res);
  }
}
