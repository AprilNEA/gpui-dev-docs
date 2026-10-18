import antfu from '@antfu/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactRefresh from 'eslint-plugin-react-refresh'

export default antfu(
  {
    react: true,
    nextjs: true,
  },
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    // Exclude vendored instructions, synced library repositories, and generated output.
    ignores: [
      '.agents/**',
      '.repos/**',
      '**/.source/**',
      '**/.next/**',
      '**/out/**',
      '**/.wrangler/**',
      'lib/collections.generated.ts',
      'projects.lock.json',
    ],
  },
  {
    settings: {
      next: { rootDir: '.' },
    },
  },
  {
    rules: {
      // Prettier owns formatting and puts a brace-less `if` body on the condition's line; this rule would undo that.
      'antfu/if-newline': 'off',
    },
  },
  {
    files: ['**/*.md'],
    // Antfu 9 lints Markdown with its own language; plugins registered for JavaScript do not apply here.
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      // Antfu passes complete Markdown files through a plain parser; Prettier otherwise treats them as JavaScript fragments.
      'prettier/prettier': ['error', { parser: 'markdown' }],
    },
  },
  {
    files: ['app/**/*.{js,jsx,ts,tsx}'],
    // Next.js page modules export framework metadata and route configuration alongside components.
    rules: reactRefresh.configs.next.rules,
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      // Scripts are command-line entry points.
      'no-console': 'off',
    },
  },
)
