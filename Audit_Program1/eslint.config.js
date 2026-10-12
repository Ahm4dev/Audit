/* Audit-Plus · ESLint (errors only). Now that the code is ES modules, `no-undef` really catches typos / missing imports. */
'use strict';
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'js/i18n/en.js', 'tests/**'] },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        I18N_EN: 'readonly', // set by js/i18n/en.js (loaded on demand)
        /* referenced behind typeof / try-catch but never defined anywhere (dead optional hooks – see README "Known issues") */
        TB: 'readonly',
        rnForm: 'readonly',
        PB_LEGACYMAP: 'readonly',
        refreshTabCounts: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-const-assign': 'error',
      'no-import-assign': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'warn', // 85 places patch a function after declaring it ("x = function…"): technical debt, not a bug
      'no-self-assign': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      'use-isnan': 'error',
      'valid-typeof': 'error',
    },
  },
  {
    /* classic scripts that run outside the bundle (head / standalone helpers) */
    files: ['js/init/*.js', 'js/standalone/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: globals.browser },
  },
  {
    files: ['tools/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
  },
];
