import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

export default {};

// Add any global test setup here