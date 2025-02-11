import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Clean up after each test
afterEach(() => {
  cleanup();
});

export default {};

// Add any global test setup here 