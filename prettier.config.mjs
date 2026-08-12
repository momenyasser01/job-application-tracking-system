/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind v4 has no JS config; the plugin reads the theme from the CSS entry point.
  tailwindStylesheet: './apps/web/src/app/globals.css',
}
