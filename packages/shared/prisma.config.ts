import { defineConfig } from 'prisma/config';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '../../.env.local'), quiet: true });

export default defineConfig({
  schema: './prisma/schema.prisma',
});
