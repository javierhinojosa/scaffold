import { writable } from 'svelte/store';
import { auth } from '../auth';
import { createSvelteAuthStore } from '@sfh/backend';

export const authStore = createSvelteAuthStore({
  auth,
  createStore: writable,
}); 