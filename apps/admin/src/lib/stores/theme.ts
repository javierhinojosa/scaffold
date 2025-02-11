import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function createThemeStore() {
  const { subscribe, set } = writable<Theme>(
    typeof localStorage !== 'undefined' 
      ? (localStorage.getItem('theme') as Theme) || 'light'
      : 'light'
  );

  return {
    subscribe,
    toggle: () => {
      if (typeof window === 'undefined') return;
      
      const current = localStorage.getItem('theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      set(next);
    },
    set: (theme: Theme) => {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      set(theme);
    }
  };
}

export const theme = createThemeStore();