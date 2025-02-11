/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx,vue,svelte,astro}', 
  ],
  theme: {
    extend: {}, 
  },
  plugins: [
    require('daisyui'),
  ], 
}; 