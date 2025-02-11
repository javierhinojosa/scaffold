export type Theme = 'light' | 'dark';

interface ThemeConfig {
  storageKey: string;
  defaultTheme: Theme;
  dataAttribute: string;
}

const config: ThemeConfig = {
  storageKey: 'theme',
  defaultTheme: 'light',
  dataAttribute: 'data-theme'
} as const;

export class ThemeManager {
  private controller: HTMLInputElement | null = null;

  constructor() {
    // Defer initialization to ensure DOM is ready
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  private init(): void {
    this.controller = document.querySelector('.theme-controller');
    if (!this.controller) return;

    // Set initial theme
    this.setTheme(this.getInitialTheme());
    
    // Add event listeners
    this.setupEventListeners();
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const savedTheme = localStorage.getItem(config.storageKey) as Theme | null;
    if (savedTheme && this.isValidTheme(savedTheme)) {
      return savedTheme;
    }

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private isValidTheme(theme: string): theme is Theme {
    return ['light', 'dark'].includes(theme);
  }

  private setTheme(theme: Theme): void {
    if (!this.controller) return;

    document.documentElement.setAttribute(config.dataAttribute, theme);
    this.controller.checked = theme === 'dark';
    localStorage.setItem(config.storageKey, theme);
  }

  private setupEventListeners(): void {
    if (!this.controller) return;

    // Theme toggle changes
    this.controller.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.setTheme(target.checked ? 'dark' : 'light');
    });

    // System theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem(config.storageKey)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}