import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
    // Base JavaScript configuration
    js.configs.recommended,

    // Prettier compatibility
    prettierConfig,

    // Global configuration
    {
        files: ['**/*.{js,mjs}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                URL: 'readonly',
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                Phaser: 'readonly',
                Howler: 'readonly',
                Howl: 'readonly',
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'import/extensions': ['error', 'ignorePackages'],
            'import/no-unresolved': [
                'error',
                {
                    ignore: ['^@features/', '^phaser$', '^howler$', '^@dimforge/rapier2d-compat$'],
                },
            ],
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                },
            ],
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': 'error',
            'arrow-body-style': ['error', 'as-needed'],
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.mjs'],
                },
            },
        },
    },

    // Ignore patterns
    {
        ignores: ['dist/**', 'node_modules/**', '*.min.js', 'public/**', 'assets/**', 'vite/**'],
    },
];
