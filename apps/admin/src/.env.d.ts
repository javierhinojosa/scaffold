/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user_id?: string;
    email?: string;
    full_name?: string;
    roles?: string[];
    isLoggedIn: boolean;
    message?: string;
    dark_mode?: boolean;
    avatar_url?: string;
    collapsed?: boolean;
  }
}