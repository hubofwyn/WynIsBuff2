import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import boundariesPlugin from 'eslint-plugin-boundaries';

export default [
    // Base JavaScript configuration
    js.configs.recommended,

    // Prettier compatibility
    prettierConfig,

    // Global configuration
    {
        files: ['**/*.{js,mjs}'],
        languageOptions: {
            ecmaVersion: 2025,
            sourceType: 'module',
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                require: 'readonly',
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                performance: 'readonly',
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
            boundaries: boundariesPlugin,
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.mjs'],
                },
            },
            // Boundaries plugin configuration - matches A-Spec v2.0.0
            'boundaries/elements': [
                { type: 'observability', pattern: 'src/observability/**' },
                { type: 'constants', pattern: 'src/constants/**' },
                { type: 'core', pattern: 'src/core/**' },
                { type: 'scenes', pattern: 'src/scenes/**' },
                { type: 'gameplay-agents', pattern: 'src/modules/{player,enemy}/**' },
                { type: 'gameplay-systems', pattern: 'src/modules/{level,effects,idle,boss,analytics,ui}/**' },
                { type: 'public-api', pattern: 'src/features/**' },
            ],
            'boundaries/ignore': [
                'src/main.js',
                'src/utils/**',
                'src/types/**',
            ],
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-case-declarations': 'warn',
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

            // Architecture enforcement rules
            'boundaries/element-types': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        // Observability can only import itself
                        { from: 'observability', allow: ['observability'] },
                        // Constants import nothing
                        { from: 'constants', allow: [] },
                        // Core can import: core, observability, constants
                        { from: 'core', allow: ['core', 'observability', 'constants'] },
                        // Scenes can import: public-api, constants, observability
                        { from: 'scenes', allow: ['public-api', 'constants', 'observability'] },
                        // Gameplay agents can import: core, constants, observability
                        { from: 'gameplay-agents', allow: ['core', 'constants', 'observability'] },
                        // Gameplay systems can import: core, gameplay-agents, constants, observability
                        {
                            from: 'gameplay-systems',
                            allow: ['core', 'gameplay-agents', 'constants', 'observability'],
                        },
                        // Public API can import: core, gameplay-agents, gameplay-systems, constants
                        {
                            from: 'public-api',
                            allow: ['core', 'gameplay-agents', 'gameplay-systems', 'constants'],
                        },
                    ],
                },
            ],

            // Determinism enforcement: no Math.random in gameplay code
            'no-restricted-properties': [
                'error',
                {
                    object: 'Math',
                    property: 'random',
                    message:
                        'Use DeterministicRNG from @features/core instead of Math.random() for reproducible gameplay',
                },
            ],

            // Vendor access enforcement (warn for now, will error after restructure)
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['phaser', 'howler', '@dimforge/rapier2d-compat'],
                            message:
                                'Direct vendor imports should only occur in core layer. Use managers from @features/* instead.',
                        },
                    ],
                },
            ],
        },
    },

    // Observability layer exception: allow Math.random for sampling (non-gameplay)
    {
        files: ['src/observability/**/*.js'],
        rules: {
            'no-restricted-properties': 'off', // Math.random allowed for observability sampling
        },
    },

    // Core layer exception: allow vendor imports (core abstracts vendors for the rest of the codebase)
    {
        files: ['src/core/**/*.js'],
        rules: {
            'no-restricted-imports': 'off', // Core layer is the only layer allowed to import vendors directly
        },
    },

    // Constants layer exception: allow console for deprecation warnings (no LOG dependency allowed)
    {
        files: ['src/constants/**/*.js'],
        rules: {
            'no-console': 'off', // Constants layer can't use LOG (zero dependencies), console is acceptable
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
