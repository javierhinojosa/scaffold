<script lang="ts">
  import { auth } from '../lib/auth';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      await auth.signInWithEmail(email, password);
      // Redirect or handle successful login
      window.location.href = '/dashboard';
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred during sign in';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4 w-full max-w-sm">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
    <input
      type="email"
      id="email"
      bind:value={email}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    />
  </div>

  <div>
    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
    <input
      type="password"
      id="password"
      bind:value={password}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    />
  </div>

  {#if error}
    <div class="text-red-600 text-sm">{error}</div>
  {/if}

  <button
    type="submit"
    disabled={loading}
    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
  >
    {#if loading}
      Signing in...
    {:else}
      Sign in
    {/if}
  </button>
</form> 