/**
 * @type {import('prettier').Config & import('prettier-plugin-jsdoc').Options}
 * @see https://prettier.io/docs/en/configuration.html
 */
const config = {
  printWidth: 80,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-jsdoc'],
  importOrder: [
    '<BUILTIN_MODULES>', // Node.js built-in modules
    '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
    '^@(/.*)$',
    '^[.]', // relative imports
  ],
  jsdocPrintWidth: 120,
};

export default config;
