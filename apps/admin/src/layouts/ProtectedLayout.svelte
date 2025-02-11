<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth';

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: if (mounted && !$authStore.loading && !$authStore.user) {
    window.location.href = '/login';
  }
</script>

{#if $authStore.loading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{:else if $authStore.user}
  <slot />
{/if} 