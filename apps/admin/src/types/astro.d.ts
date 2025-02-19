/// <reference types="astro/client" />
import type { AuthLocals } from './auth';

declare module 'astro' {
  interface Locals extends AuthLocals {}

  interface APIContext {
    response: Response;
  }
}
