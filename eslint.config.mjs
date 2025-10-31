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
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                // Timers
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly',
                // Game libraries
                Phaser: 'readonly',
                Howler: 'readonly',
                Howl: 'readonly',
                RAPIER: 'readonly',
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
            'import/extensions': ['warn', 'ignorePackages'],
            'import/no-unresolved': [
                'warn',
                {
                    ignore: ['^@features/', '^phaser$', '^howler$', '^@dimforge/rapier2d-compat$'],
                },
            ],
            'import/order': [
                'warn',
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
        ignores: [
            'dist/**',
            'dist-ssr/**',
            'node_modules/**',
            '*.min.js',
            'public/**',
            'assets/**',
            'scripts/**',
            'vite/**',
            '.migration-backup/**',
            'tests/**',
            'doc-analysis/**',
            'doc-analysis-docs/**',
            'doc-analysis-slim/**',
            'src/constants/Assets.js', // Generated file
        ],
    },
];
