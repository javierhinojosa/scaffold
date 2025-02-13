import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Welcome', () => {
  it('renders the welcome message', async () => {
    const dom = new JSDOM(`
      <div>
        <h1>To get started, open the <code><pre>src/pages</pre></code> directory in your project.</h1>
        <a href="https://docs.astro.build">Read our docs</a>
        <a href="https://astro.build/chat">Join our Discord</a>
        <img src="/astro.svg" width="115" height="48" alt="Astro Homepage" />
      </div>
    `);

    const { document } = dom.window;
    expect(document.querySelector('h1')?.textContent).toContain('To get started');
    expect(document.querySelector('a[href="https://docs.astro.build"]')?.textContent).toBe('Read our docs');
    expect(document.querySelector('a[href="https://astro.build/chat"]')?.textContent).toContain('Join our Discord');
    expect(document.querySelector('img[alt="Astro Homepage"]')?.getAttribute('width')).toBe('115');
  });
}); 