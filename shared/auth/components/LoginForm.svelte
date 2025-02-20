<!-- LoginForm.svelte -->
<script lang="ts">
  import { auth } from '../auth';
  import { authStore } from '../stores/auth';

  let email = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      const { user } = await auth.signInWithEmail(email, password);
      authStore.set({ user, loading: false, error: null });
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
      authStore.set({ user: null, loading: false, error: e instanceof Error ? e : null });
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="card w-96 bg-base-100 shadow-xl">
  <div class="card-body">
    {#if error}
      <div class="alert alert-error mb-4">
        <span>{error}</span>
      </div>
    {/if}

    <div class="form-control">
      <label class="label" for="email">
        <span class="label-text">Email</span>
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        class="input input-bordered"
        required
      />
    </div>

    <div class="form-control">
      <label class="label" for="password">
        <span class="label-text">Password</span>
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        class="input input-bordered"
        required
      />
    </div>

    <div class="form-control mt-6">
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <span class="loading loading-spinner"></span>
        {:else}
          Sign In
        {/if}
      </button>
    </div>
  </div>
</form> 