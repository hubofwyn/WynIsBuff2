/**
 * Dependency Cruiser Configuration for WynIsBuff2
 * Validates dependency graph and enforces architectural boundaries
 *
 * Aligned with A-Spec v2.0.0
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        // 1. No circular dependencies
        {
            name: 'no-circular',
            severity: 'error',
            comment: 'Circular dependencies make code harder to understand and maintain.',
            from: {},
            to: {
                circular: true,
            },
        },

        // 2. Observability layer isolation
        {
            name: 'observability-isolation',
            severity: 'error',
            comment: 'Observability layer can only import from itself',
            from: { path: '^src/observability' },
            to: {
                pathNot: '^src/observability',
                dependencyTypesNot: ['npm', 'type-only'],
            },
        },

        // 3. Constants layer has no dependencies
        {
            name: 'constants-zero-deps',
            severity: 'error',
            comment: 'Constants layer must have zero dependencies (except npm packages)',
            from: { path: '^src/constants' },
            to: {
                pathNot: '^src/constants',
                dependencyTypesNot: ['npm', 'type-only'],
            },
        },

        // 4. Core layer boundaries
        {
            name: 'core-boundaries',
            severity: 'error',
            comment: 'Core layer can only import: core, observability, constants, types',
            from: { path: '^src/core' },
            to: {
                pathNot: '^src/(core|observability|constants|types)',
                dependencyTypesNot: ['npm', 'type-only'],
            },
        },

        // 5. Scenes layer boundaries
        {
            name: 'scenes-boundaries',
            severity: 'error',
            comment: 'Scenes can only import: public-api (features), constants, observability',
            from: { path: '^src/scenes' },
            to: {
                path: '^src/(core|modules)',
                dependencyTypesNot: ['type-only'],
            },
        },

        // 6. No direct vendor access in gameplay code
        {
            name: 'no-vendor-in-gameplay',
            severity: 'error',
            comment: 'Gameplay modules must not import vendors directly. Use core managers.',
            from: { path: '^src/modules' },
            to: {
                path: 'node_modules/(phaser|@dimforge/rapier2d-compat|howler)',
            },
        },

        // 7. No orphan modules (warn only)
        {
            name: 'no-orphans',
            severity: 'warn',
            comment: 'Module is not part of any dependency chain.',
            from: {
                orphan: true,
                pathNot: [
                    'src/main\\.js$',
                    '\\.test\\.js$',
                    '\\.spec\\.js$',
                    '^scripts/',
                    'src/constants/Assets\\.js$',
                ],
            },
            to: {},
        },
    ],

    options: {
        doNotFollow: {
            path: 'node_modules',
        },

        includeOnly: '^src',

        tsPreCompilationDeps: true,

        reporterOptions: {
            dot: {
                collapsePattern: 'node_modules/[^/]+',
            },
        },
    },
};
