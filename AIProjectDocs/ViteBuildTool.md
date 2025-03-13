# Vite Build Tool Documentation

## Table of Contents
- [Overview](#overview)
- [Version Information](#version-information)
- [Core Concepts](#core-concepts)
  - [Development Server](#development-server)
  - [Build Process](#build-process)
  - [Configuration](#configuration)
  - [Plugins](#plugins)
- [Implementation in WynIsBuff2](#implementation-in-wynisbuff2)
  - [Development Configuration](#development-configuration)
  - [Production Configuration](#production-configuration)
  - [NPM Scripts](#npm-scripts)
  - [Asset Handling](#asset-handling)
- [Best Practices](#best-practices)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Resources](#resources)

## Overview

Vite (French for "quick", pronounced `/vit/`) is a modern frontend build tool that provides a faster and leaner development experience. It leverages native ES modules in the browser during development and bundles code with Rollup for production.

## Version Information

- **Package**: vite
- **Version**: 5.3.1
- **Official Documentation**: https://vitejs.dev/
- **GitHub Repository**: https://github.com/vitejs/vite

## Core Concepts

### Development Server

Vite's development server provides:
- Extremely fast startup times
- Hot Module Replacement (HMR)
- True on-demand compilation
- Native ES module support

```javascript
// Start the development server
npm run dev
```

### Build Process

Vite uses Rollup for production builds, providing:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

```javascript
// Create a production build
npm run build
```

### Configuration

Vite is configured through a `vite.config.js` (or `.ts`, `.mjs`, etc.) file:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  // Configuration options
  base: './',
  build: {
    // Build options
  },
  server: {
    // Server options
  }
});
```

### Plugins

Vite has a plugin system for extending functionality:

```javascript
import { defineConfig } from 'vite';
import somePlugin from 'vite-plugin-some-plugin';

export default defineConfig({
  plugins: [
    somePlugin()
  ]
});
```

## Implementation in WynIsBuff2

WynIsBuff2 uses Vite for both development and production builds, with separate configuration files for each environment.

### Development Configuration

The development configuration (`vite/config.dev.mjs`) includes:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080
    }
});
```

Key features:
- Sets the base path to './'
- Configures Rollup to separate Phaser into its own chunk
- Sets the development server port to 8080

### Production Configuration

The production configuration (`vite/config.prod.mjs`) includes:

```javascript
import { defineConfig } from 'vite';

const phasermsg = () => {
    // Custom plugin implementation
}   

export default defineConfig({
    base: './',
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    },
    server: {
        port: 8080
    },
    plugins: [
        phasermsg()
    ]
});
```

Key features:
- Sets the base path to './'
- Configures Rollup to separate Phaser into its own chunk
- Enables minification with Terser
- Configures Terser for optimal compression
- Includes a custom plugin to display build messages

### NPM Scripts

The project includes the following npm scripts for Vite:

```json
"scripts": {
    "dev": "node log.js dev & vite --config vite/config.dev.mjs",
    "build": "node log.js build & vite build --config vite/config.prod.mjs",
    "dev-nolog": "vite --config vite/config.dev.mjs",
    "build-nolog": "vite build --config vite/config.prod.mjs"
}
```

- `dev`: Starts the development server with logging
- `build`: Creates a production build with logging
- `dev-nolog`: Starts the development server without logging
- `build-nolog`: Creates a production build without logging

### Asset Handling

Vite handles assets in two ways:

1. **Imported Assets**: Assets imported in JavaScript are processed by Vite:

```javascript
import logoImg from './assets/logo.png';

// In preload method
this.load.image('logo', logoImg);
```

2. **Public Assets**: Assets in the `public` folder are served as-is:

```javascript
// In preload method
this.load.image('background', 'assets/bg.png');
```

## Best Practices

1. **Optimize Dependencies**:
   - Use `manualChunks` to separate large dependencies like Phaser
   - Consider using `import()` for code splitting

2. **Asset Management**:
   - Use the `public` folder for assets that need to be referenced by absolute URL
   - Import assets directly in JavaScript when they need to be processed by Vite

3. **Environment Variables**:
   - Use `.env` files for environment-specific configuration
   - Access variables with `import.meta.env`

4. **Performance Optimization**:
   - Enable minification for production builds
   - Configure appropriate compression settings
   - Use browser caching through proper cache headers

5. **Plugin Usage**:
   - Only use plugins when necessary
   - Consider the performance impact of each plugin

## Common Issues and Solutions

1. **Assets Not Found in Production**:
   - Ensure base path is correctly set
   - Check that assets are in the correct location
   - Verify that import paths are correct

2. **Slow Build Times**:
   - Optimize dependencies with `manualChunks`
   - Consider using build caching
   - Review and remove unnecessary plugins

3. **HMR Not Working**:
   - Check that the code is compatible with HMR
   - Ensure the development server is running
   - Verify that the browser supports ES modules

4. **Build Output Size Too Large**:
   - Enable code splitting
   - Configure tree shaking
   - Use production mode to enable optimizations

## Resources

- [Vite Official Documentation](https://vitejs.dev/)
- [Vite GitHub Repository](https://github.com/vitejs/vite)
- [Rollup Documentation](https://rollupjs.org/) (used by Vite for production builds)
- [Terser Documentation](https://terser.org/) (used by Vite for minification)