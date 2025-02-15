import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
// Using __dirname/../../.. to go up from packages/testing/src to root
const rootEnvPath = resolve(__dirname, '..', '..', '..', '.env');
console.log('Loading .env from:', rootEnvPath);

const result = config({ path: rootEnvPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Verify required environment variables are set
const requiredEnvVars = [
  // Admin/service operations
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  // Public client operations
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY',
];

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'set' : 'not set',
  PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL ? 'set' : 'not set',
  PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
});

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Clean up after each test
afterEach(() => {
  cleanup();
});

export default {};

// Add any global test setup here
