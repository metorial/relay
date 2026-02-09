import { redis } from 'bun';
import { RelayApi } from './controllers';
import { db } from './db';

let server = Bun.serve({
  fetch: RelayApi,
  port: 52110
});

console.log(`Service running on http://localhost:${server.port}`);

Bun.serve({
  fetch: async _ => {
    try {
      await db.sender.count();
      await redis.ping();
      return new Response('OK');
    } catch (e) {
      return new Response('Service Unavailable', { status: 503 });
    }
  },
  port: 12121
});
