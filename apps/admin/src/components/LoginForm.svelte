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
      window.location.href = '/dashboard';
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred during sign in';
    } finally {
      loading = false;
    }
  }
</script>

<div class="card w-full max-w-md bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title text-2xl font-bold text-center mb-6">Sign In</h2>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="form-control w-full">
        <label for="email" class="label">
          <span class="label-text">Email</span>
        </label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          class="input input-bordered w-full"
          placeholder="Enter your email"
        />
      </div>

      <div class="form-control w-full">
        <label for="password" class="label">
          <span class="label-text">Password</span>
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          class="input input-bordered w-full"
          placeholder="Enter your password"
        />
      </div>

      {#if error}
        <div class="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-control w-full mt-6">
        <button
          type="submit"
          disabled={loading}
          class="btn btn-primary w-full {loading ? 'loading' : ''}"
        >
          {#if loading}
            <span class="loading loading-spinner"></span>
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </div>
    </form>

    <div class="divider my-8">OR</div>

    <div class="text-center space-y-4">
      <a href="/forgot-password" class="link link-primary">Forgot password?</a>
      <p class="text-sm">
        Don't have an account?
        <a href="/register" class="link link-primary">Create one</a>
      </p>
    </div>
  </div>
</div>
