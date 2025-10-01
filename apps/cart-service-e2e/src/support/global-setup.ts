import { waitForPortOpen } from '@nx/node/utils';
import * as dotenv from 'dotenv';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  // Load environment variables
  dotenv.config({ path: 'apps/cart-service-e2e/.env.test' });
  
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3002;
  console.log(`Waiting for service on ${host}:${port}`);
  await waitForPortOpen(port, { host });

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
