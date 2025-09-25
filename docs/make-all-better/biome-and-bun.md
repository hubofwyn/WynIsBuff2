
# **Optimal Tooling for TypeScript Game Development: A Configuration Guide for Biome v2.2.2 and Bun v1.2.21**

> Repository Alignment Notes
> - This repo ships JS with CommonJS tests; Biome config already exists at `biome.json` with 2-space indentation and ignores for generated files.
> - Scripts use Bun (`bun`/`bunx`) alongside Vite. Keep Vite as the dev/build path; Bun is used as the runner.
> - Import aliases in examples using `@/...` are illustrative. In this repo, prefer `@features/*` barrels and constants from `src/constants/*.js`.
> - TypeScript snippets here are for guidance. Treat them as pseudo-code unless we adopt TS repo-wide.

## **Introduction: Forging a High-Performance Game Development Stack**

The landscape of web development tooling has historically been characterized by fragmentation. A typical project required a carefully orchestrated collection of disparate tools: a package manager like npm or Yarn, a runtime like Node.js, a linter such as ESLint, a formatter like Prettier, and a bundler like Webpack or Rollup. While powerful, this approach introduces significant complexity in configuration, maintenance, and performance, often leading to "rule fights" between tools and slow feedback cycles that hinder developer productivity.1  
A new paradigm is emerging, championed by integrated, high-performance toolkits designed to provide a cohesive and streamlined developer experience (DX) from the ground up. This report details a definitive configuration for one such stack, pairing **Biome (v2.2.2)**, an all-in-one linter and formatter, with **Bun (v1.2.21)**, a comprehensive JavaScript runtime, bundler, test runner, and package manager.3 This combination represents a significant competitive advantage for modern web-based game development, offering radical simplification, unparalleled speed, and a unified workflow that translates directly into faster iteration and more performant end products.2  
This document serves as an expert-level guide for establishing a production-ready development environment tailored specifically for building a 2D platformer game in TypeScript. It provides not just configuration snippets, but a deep analysis of the rationale and trade-offs behind each recommendation. The analysis proceeds from foundational project setup with Bun, through advanced code quality enforcement with Biome, to the final stage of bundling the game for production, including the critical integration of a WebAssembly-based physics engine.

## **Section 1: Foundational Project Architecture with Bun**

The first step in building a robust and scalable game is to establish a solid project foundation. Bun serves as the core engine for this entire process, acting as a complete toolkit that replaces multiple legacy tools and simplifies the development lifecycle.3 Its role encompasses dependency management, script execution, and providing a high-performance local development environment.

### **1.1 Project Initialization and TypeScript Configuration**

The project scaffolding process begins with a single command. By running bun init, Bun generates the essential package.json and tsconfig.json files, creating a ready-to-use TypeScript environment.6 While the default configuration is a strong starting point, optimizing the  
tsconfig.json is crucial for leveraging the full power of the Bun and Biome toolchain.  
A key philosophical underpinning of this stack is the separation of concerns between code transpilation and type validation. Both Bun and Biome are engineered for maximum speed, which they achieve by decoupling their operations from the TypeScript compiler (tsc). Bun's runtime transpiles TypeScript on-the-fly for execution but does not perform type-checking.7 Similarly, Biome's innovative "type-aware" linting rules use a custom, high-performance implementation that avoids invoking the slower  
tsc process.8  
This design choice has a profound implication for the development workflow: while it provides near-instantaneous feedback during coding and execution, it offloads the responsibility of rigorous type safety. Consequently, it is imperative to establish a dedicated and explicit step for comprehensive type validation. The optimal tsconfig.json must be configured not only for Bun's runtime and bundler but also to empower tsc to act as the ultimate arbiter of type correctness.  
The following tsconfig.json represents a production-ready blueprint, with each option chosen to align with this modern, high-velocity workflow:

Code snippet

{  
  "compilerOptions": {  
    // Environment & Modern Features  
    "target": "ESNext",  
    "lib":,  
    "module": "ESNext",  
    "jsx": "react-jsx", // Or "preserve" if using another framework  
    "allowJs": true,

    // Module Resolution Strategy  
    "moduleResolution": "bundler",  
    "allowImportingTsExtensions": true,  
    "resolveJsonModule": true,  
    "isolatedModules": true,  
    "noEmit": true,

    // Path Aliases  
    "baseUrl": "./src",  
    "paths": {  
      "@/\*": \["\*"\]  
    },

    // Strictness & Best Practices  
    "strict": true,  
    "skipLibCheck": true,  
    "noUnusedLocals": true,  
    "noUnusedParameters": true,  
    "noFallthroughCasesInSwitch": true,  
    "forceConsistentCasingInFileNames": true  
  },  
  "include": \["src"\]  
}

**Analysis of Key tsconfig.json Options:**

* **"target": "ESNext" and "lib":**: When Bun is both the development runtime and the production bundler, targeting the latest ECMAScript standard is ideal. This minimizes unnecessary down-level transpilation, ensuring that the executed code is as close as possible to the modern syntax written by the developer.6  
* **"moduleResolution": "bundler"**: This is the modern standard for module resolution that mirrors how bundlers like Bun actually work. It provides a more accurate and robust model than the older "node" strategy and is essential for a seamless development experience.6  
* **"allowImportingTsExtensions": true and "noEmit": true**: These two settings are critical for a workflow where Bun executes TypeScript source files directly. "allowImportingTsExtensions": true permits imports like import { Player } from './player.ts';, which Bun handles natively. "noEmit": true signals that tsc's role is purely for type-checking; it will not generate any JavaScript output files, as that responsibility is delegated to Bun's bundler.6  
* **"paths"**: This feature allows for the configuration of import aliases, such as mapping @/components/\* to src/components/\*. Bun's runtime is unique in its native support for this tsconfig.json setting, which eliminates the need for additional plugins or configuration to achieve cleaner, more maintainable import paths.7

### **1.2 Mastering the Bun Toolkit**

With the TypeScript environment configured, the focus shifts to leveraging Bun's integrated tools for day-to-day development tasks.  
High-Velocity Package Management:  
Bun's npm-compatible package manager is exceptionally fast, often outperforming legacy managers like npm and Yarn by an order of magnitude.4 This speed is achieved through the use of a global cache and optimized system calls. Beyond performance, Bun introduces a crucial security enhancement: by default, it does not execute  
postinstall lifecycle scripts from dependencies. This prevents potentially malicious code from running automatically during installation. For packages that legitimately require setup scripts (e.g., @sentry/cli), they must be explicitly trusted by adding them to the trustedDependencies array in package.json.10  
Streamlined package.json Scripts:  
An integrated toolchain allows for a radically simplified set of package.json scripts. The goal is to create clear, concise commands that map directly to distinct development activities.

| Script Name | Command | Purpose & Workflow Integration |
| :---- | :---- | :---- |
| dev | bun \--watch src/main.ts | Starts the game in a live development server with hot reloading. |
| build | bun run build.ts | Executes the production build script to generate optimized game bundles. |
| lint | biome lint. | Runs Biome's linter to check for code quality and potential errors. |
| lint:fix | biome check \--write. | Formats all files and applies all of Biome's safe-fixes automatically. |
| typecheck | tsc \--noEmit | Performs a comprehensive, project-wide TypeScript type check. |

The Live Development Environment:  
Bun's native \--watch flag is a transformative feature for game development. Unlike older tools such as nodemon that perform a full process restart on every file change, Bun's watcher enables state-preserving hot reloading.4 In the context of a 2D platformer, this means a developer can modify game logic, adjust physics parameters, or tweak entity behavior and see the changes reflected instantly  
*without* losing the current game state. The player remains at their current position, the score is preserved, and the level does not reset. This capability dramatically accelerates the iterative process of game design and debugging.

## **Section 2: Enforcing Code Quality and Style with Biome v2.2.2**

With a robust project foundation, the next priority is ensuring the codebase remains clean, consistent, and free of common errors. Biome provides a single, cohesive solution for both code formatting and static analysis (linting), replacing the traditional combination of Prettier and ESLint with a faster, more integrated alternative.2  
A pragmatic, multi-layered approach to code quality is most effective. Biome, with its high-speed analysis and editor integration, forms the "inner loop" of this strategy. It provides instantaneous feedback on every save, catching the vast majority of stylistic and programmatic issues without introducing any noticeable delay.14 This allows developers to maintain a high velocity. The slower, more comprehensive  
tsc \--noEmit command serves as the "gatekeeper" check, run before committing code to guarantee absolute type correctness. This hybrid workflow provides the best of both worlds: the rapid iteration enabled by Biome and the rigorous safety guaranteed by the TypeScript compiler.

### **2.1 The biome.json Deep Dive**

Configuration begins by initializing Biome within the project using bunx @biomejs/biome init. This command generates a biome.jsonc file, which serves as the central control panel for all of Biome's tools.15  
The first step is to define the scope of Biome's operations. The files.ignore property should be configured to exclude directories like node\_modules, build outputs (e.g., dist), and game asset folders. This prevents the tool from analyzing irrelevant files, which improves performance and avoids spurious warnings.1

Code snippet

{  
  "$schema": "https://biomejs.dev/schemas/1.7.3/schema.json",  
  "files": {  
    "ignore": \["node\_modules", "dist", "assets"\]  
  },  
  //... formatter and linter configuration  
}

Biome also supports an overrides block, which allows for applying different rule sets to specific file patterns. While less critical for a game project focused primarily on TypeScript, this can be useful for enforcing different standards on configuration files (e.g., \*.json) or level data files if they are stored in a specific format.16

### **2.2 Optimal Formatter Configuration**

Biome is an opinionated formatter with a philosophy similar to Prettier's: to eliminate debates over code style by providing a consistent format with minimal configuration options.19 It is highly compatible with Prettier's output, making migration straightforward.13 For a TypeScript game project, the following configuration provides a modern, readable, and maintainable code style.

Code snippet

{  
  "formatter": {  
    "enabled": true,  
    "indentStyle": "space",  
    "indentWidth": 2,  
    "lineWidth": 100  
  },  
  "javascript": {  
    "formatter": {  
      "semicolons": "always",  
      "trailingCommas": "all",  
      "quoteStyle": "single"  
    }  
  }  
}

**Analysis of Formatter Options:**

* "indentStyle": "space", "indentWidth": 2: This is a widely adopted standard in the JavaScript/TypeScript community that promotes readability.  
* "lineWidth": 100: A line width of 100 characters is a practical choice for modern widescreen displays. It provides more horizontal space than the traditional 80-character limit, which can be beneficial for complex game logic or nested structures, without sacrificing readability.  
* "javascript.formatter.semicolons": "always": Enforcing the presence of semicolons eliminates ambiguity and prevents potential issues with Automatic Semicolon Insertion (ASI).  
* "javascript.formatter.trailingCommas": "all": Using trailing commas in multi-line arrays, objects, and parameter lists is a best practice. It simplifies adding, removing, or reordering items and results in cleaner version control diffs.19

### **2.3 Advanced Linter Strategy for Robust Game Logic**

Biome's linter comes with a set of recommended rules that are enabled by default and provide a strong baseline for catching common errors.20 The configuration allows for enabling this recommended set and then selectively overriding individual rules or disabling entire groups that are not relevant to the project. For instance, the  
a11y (accessibility) group can typically be disabled for game logic code.20  
For a 2D platformer, it is beneficial to augment the recommended rules with a curated set that specifically targets performance, correctness in complex state management, and the prevention of subtle bugs common in game development.

| Rule Name | Group | Recommended Severity | Rationale for Game Development |
| :---- | :---- | :---- | :---- |
| noExcessiveCognitiveComplexity | style | warn | Game loops, physics updates, and entity state machines can become very complex. This rule flags functions that are becoming difficult to understand and maintain, encouraging refactoring into smaller, more manageable units.21 |
| noAccumulatingSpread | performance | error | Disallows using the spread syntax (...) on an accumulator inside a reduce call. This pattern can lead to quadratic time complexity, causing significant performance degradation in loops that update game state, such as processing player inputs or updating entity positions.21 |
| noDelete | suspicious | error | The delete keyword in JavaScript can de-optimize object shapes in JavaScript engines. In performance-critical game code where object property access speed is paramount (e.g., accessing an entity's position vector every frame), avoiding delete is crucial for maintaining stable performance. |
| noVoidTypeReturn | correctness | error | In an event-driven game architecture, many functions (e.g., event handlers) are intended to be "fire-and-forget" and have a void return type. This rule prevents such functions from accidentally returning a value, which can mask logic errors where a return value is expected but ignored.21 |
| useWhile | style | error | Enforces the use of a while loop instead of a for loop when the initializer and update expressions are not needed. This leads to cleaner and more readable code, especially in simple game loops or polling mechanisms.21 |
| noUselessThisAlias | correctness | error | In class-based entity systems, creating aliases for this (e.g., const self \= this;) can lead to confusing and error-prone code. This rule enforces direct use of this, improving clarity.21 |
| noGlobalIsNan | correctness | error | Enforces the use of the modern, more reliable Number.isNaN() over the global isNaN(). The global version has confusing behavior with non-numeric types, which can lead to subtle bugs in game logic that involves parsing or user input.21 |

This tailored linter configuration, combined with Biome's real-time feedback, creates a powerful safety net that helps developers write more performant, maintainable, and correct game code from the very first line.

## **Section 3: Bundling the Game for Production with WebAssembly Physics**

The final stage of the development process is to bundle the game's TypeScript code, assets, and dependencies into a highly optimized package for deployment. Bun's built-in bundler is exceptionally fast and capable, designed to handle full-stack applications and modern features like WebAssembly out of the box.22 This section details the creation of a production build process, with a specific focus on the correct integration of a WebAssembly-based physics engine, Rapier.js.

### **3.1 Integrating Rapier.js Physics via WebAssembly**

Modern game physics engines like Rapier.js are often compiled from high-performance languages like Rust to WebAssembly (.wasm) for near-native speed in the browser. Integrating these .wasm modules correctly is critical and depends heavily on the capabilities of the chosen bundler.24  
The Rapier.js project provides two main sets of NPM packages: the standard packages (@dimforge/rapier2d) and the compatibility packages (@dimforge/rapier2d-compat).24 The compatibility packages embed the  
.wasm file as a large Base64 string directly within the JavaScript file, making them easier to use with older bundlers that struggle with WebAssembly. However, this comes at the cost of a significantly larger bundle size.  
A synthesis of the documentation for Bun and Rapier.js reveals the optimal integration strategy. Bun's bundler has a built-in loader for .wasm files. When it encounters an import of a .wasm module, it treats it as an asset: the .wasm file is copied as-is into the output directory, and the import statement is resolved to a string path pointing to that file.23 This behavior aligns perfectly with the requirements of the standard, more efficient  
@dimforge/rapier2d package. Therefore, the larger \-compat package is not only unnecessary but is an anti-pattern in a Bun-based project.  
Because the .wasm file must be fetched and instantiated, the initialization of Rapier.js must be handled asynchronously. The correct pattern involves using a dynamic import() to load the Rapier module, which returns a promise that resolves once the WebAssembly module is ready for use.24  
The following TypeScript snippet demonstrates the robust pattern for initializing Rapier.js within the game's main entry point:

TypeScript

// src/physics.ts  
import type { World } from '@dimforge/rapier2d';

let RAPIER: typeof import('@dimforge/rapier2d') | null \= null;

// This function must be called and awaited before any physics code is run.  
export async function initPhysics(): Promise\<void\> {  
  RAPIER \= await import('@dimforge/rapier2d');  
}

export function createWorld(): World {  
  if (\!RAPIER) {  
    throw new Error('Physics engine not initialized. Call initPhysics() first.');  
  }  
  const gravity \= { x: 0.0, y: \-9.81 };  
  return new RAPIER.World(gravity);  
}

This module can then be used in the main game file:

TypeScript

// src/main.ts  
import { initPhysics, createWorld } from './physics';

async function startGame() {  
  await initPhysics();  
  const world \= createWorld();  
    
  //... rest of the game initialization and main loop  
  console.log('Game started with physics world:', world);  
}

startGame();

### **3.2 Crafting the Production Build Script (build.ts)**

While Bun's bundler can be invoked via CLI flags, using its JavaScript API within a dedicated build script (build.ts) offers superior flexibility, readability, and maintainability.22 This approach allows for programmatic configuration and keeps the build logic version-controlled alongside the application code.  
The following build.ts script is optimized for producing a production-ready game bundle:

TypeScript

// build.ts  
import { bun } from 'bun';

console.log('Starting production build...');

const result \= await bun.build({  
  entrypoints: \['./src/main.ts'\],  
  outdir: './dist',  
  target: 'browser',  
  splitting: false,  
  minify: true,  
  sourcemap: 'external',  
  naming: {  
    entry: '\[name\]-\[hash\].js',  
    chunk: '\[name\]-\[hash\].js',  
    asset: '\[name\]-\[hash\].\[ext\]'  
  }  
});

if (\!result.success) {  
  console.error('Build failed:');  
  for (const message of result.logs) {  
    console.error(message);  
  }  
  process.exit(1);  
}

console.log('Build successful\!');  
console.log('Output files:', result.outputs.map(o \=\> o.path));

**Analysis of Build Options:**

* target: 'browser': This is the most critical setting. It instructs Bun to produce a bundle that is compatible with web browsers, correctly handling web APIs and module resolution.23  
* splitting: false: For most single-player 2D games, a single JavaScript bundle is preferable. Disabling code splitting avoids the network overhead of fetching multiple small chunks, which can lead to faster initial load times.  
* minify: true: Enables minification of whitespace, identifiers, and syntax, which is essential for reducing the final bundle size and improving load performance.23  
* sourcemap: 'external': Generates a separate sourcemap file. This is the recommended approach for production, as it allows for debugging errors in the original source code without bloating the main JavaScript bundle that is delivered to users.23  
* naming: Configures the output filenames to include a content hash (\[hash\]). This is a best practice for cache busting, ensuring that users always receive the latest version of the game when it is updated.

### **3.3 Managing Game Assets**

A game consists of more than just code; it includes assets like sprite sheets, sound effects, and background music. Bun's bundler provides a streamlined process for managing these assets. When it encounters an import of a non-code file (e.g., .png, .mp3), it uses its asset loader. This loader copies the asset file to the output directory (respecting the naming configuration) and replaces the import in the code with a string containing the path to the final asset file.23  
This mechanism allows for a natural and type-safe way to reference assets in code:

TypeScript

// src/player.ts  
import playerSpriteUrl from './assets/sprites/player.png';  
import jumpSoundUrl from './assets/sfx/jump.mp3';

export class Player {  
  private sprite: HTMLImageElement;  
  private jumpSound: HTMLAudioElement;

  constructor() {  
    this.sprite \= new Image();  
    this.sprite.src \= playerSpriteUrl; // playerSpriteUrl is a string like "/player-a1b2c3d4.png"

    this.jumpSound \= new Audio();  
    this.jumpSound.src \= jumpSoundUrl; // jumpSoundUrl is a string like "/jump-e5f6g7h8.mp3"  
  }

  jump() {  
    this.jumpSound.play();  
    //... jump logic  
  }

  draw(context: CanvasRenderingContext2D) {  
    context.drawImage(this.sprite, 0, 0);  
  }  
}

This integrated approach ensures that all necessary assets are automatically included in the production build and that the code always references them correctly, simplifying asset management and preventing broken links.

## **Section 4: The Complete Configuration Blueprint**

This section consolidates all the preceding analysis and recommendations into a set of complete, production-ready configuration files. These files serve as a practical, copy-pasteable blueprint for initiating a new 2D TypeScript game project with Bun and Biome.

### **4.1 The Unified package.json**

This file defines the project's dependencies, development dependencies, and the core script suite that drives the entire workflow.

JSON

{  
  "name": "ts-platformer-game",  
  "module": "src/main.ts",  
  "type": "module",  
  "scripts": {  
    "dev": "bun \--watch src/main.ts",  
    "build": "bun run build.ts",  
    "lint": "biome lint.",  
    "lint:fix": "biome check \--write.",  
    "typecheck": "tsc \--noEmit"  
  },  
  "dependencies": {  
    "@dimforge/rapier2d": "^0.13.1"  
  },  
  "devDependencies": {  
    "@biomejs/biome": "1.8.3",  
    "@types/bun": "latest",  
    "typescript": "^5.5.3"  
  }  
}

### **4.2 The Definitive biome.json**

This file centralizes all code style and quality rules, ensuring a consistent and maintainable codebase.

Code snippet

{  
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",  
  "organizeImports": {  
    "enabled": true  
  },  
  "files": {  
    "ignore": \["node\_modules", "dist", "assets"\]  
  },  
  "formatter": {  
    "enabled": true,  
    "indentStyle": "space",  
    "indentWidth": 2,  
    "lineWidth": 100  
  },  
  "javascript": {  
    "formatter": {  
      "semicolons": "always",  
      "trailingCommas": "all",  
      "quoteStyle": "single"  
    }  
  },  
  "linter": {  
    "enabled": true,  
    "rules": {  
      "recommended": true,  
      "a11y": "off",  
      "style": {  
        "noExcessiveCognitiveComplexity": "warn",  
        "useWhile": "error"  
      },  
      "performance": {  
        "noAccumulatingSpread": "error"  
      },  
      "suspicious": {  
        "noDelete": "error"  
      },  
      "correctness": {  
        "noVoidTypeReturn": "error",  
        "noUselessThisAlias": "error",  
        "noGlobalIsNan": "error"  
      }  
    }  
  }  
}

### **4.3 The Production-Ready tsconfig.json**

This file configures the TypeScript compiler for both development-time type-checking and compatibility with Bun's runtime and bundler.

Code snippet

{  
  "compilerOptions": {  
    // Environment & Modern Features  
    "target": "ESNext",  
    "lib":,  
    "module": "ESNext",  
    "jsx": "react-jsx",  
    "allowJs": true,

    // Module Resolution Strategy  
    "moduleResolution": "bundler",  
    "allowImportingTsExtensions": true,  
    "resolveJsonModule": true,  
    "isolatedModules": true,  
    "noEmit": true,

    // Path Aliases  
    "baseUrl": "./src",  
    "paths": {  
      "@/\*": \["\*"\]  
    },

    // Strictness & Best Practices  
    "strict": true,  
    "skipLibCheck": true,  
    "noUnusedLocals": true,  
    "noUnusedParameters": true,  
    "noFallthroughCasesInSwitch": true,  
    "forceConsistentCasingInFileNames": true  
  },  
  "include": \["src"\]  
}

### **4.4 The Complete Game Build Script (build.ts)**

This script provides a self-documenting and powerful way to create optimized production builds of the game.

TypeScript

// build.ts  
import { bun } from 'bun';

console.log('Starting production build...');

const result \= await bun.build({  
  entrypoints: \['./src/main.ts'\],  
  outdir: './dist',  
  target: 'browser',  
  splitting: false,  
  minify: true,  
  sourcemap: 'external',  
  naming: {  
    entry: '\[name\]-\[hash\].js',  
    chunk: '\[name\]-\[hash\].js',  
    asset: '\[name\]-\[hash\].\[ext\]'  
  }  
});

if (\!result.success) {  
  console.error('Build failed:');  
  for (const message of result.logs) {  
    console.error(message);  
  }  
  process.exit(1);  
}

console.log('Build successful\!');  
console.log('Output files:', result.outputs.map(o \=\> o.path));

### **4.5 A Recommended Daily Developer Workflow**

To ensure the benefits of this stack are fully realized, team members should follow a consistent daily workflow:

1. **Initial Setup**: Run bun install after cloning the repository to install all dependencies at high speed.  
2. **Development**: Start the live development server using bun dev. This enables state-preserving hot reloading for rapid iteration.  
3. **Real-time Quality**: Code with the official Biome editor extension (e.g., for VS Code) installed and enabled. This provides on-save formatting and real-time linting diagnostics.  
4. **Pre-Commit Checks**: Before committing any code, run the quality gatekeeper scripts:  
   * bun run lint:fix to format the code and apply all safe fixes.  
   * bun run typecheck to perform a full, rigorous type check of the entire project.  
5. **Production Validation**: Periodically, use bun run build to create a production build and test it to ensure there are no bundling-specific issues.

## **Conclusion: The Future of JavaScript Game Development**

The combination of Biome and Bun, configured as detailed in this report, represents more than just an alternative toolchain; it is a fundamental shift in how high-performance web applications and games are built. By replacing a fragmented collection of single-purpose tools with a cohesive, integrated, and exceptionally fast toolkit, this stack addresses the primary pain points of modern web development: complexity and speed.  
The core benefits are clear and impactful. The unprecedented performance of Bun's runtime, package manager, and bundler dramatically shortens feedback loops, from installing dependencies to seeing code changes reflected in a running game. The radical simplification of the toolchain, with one primary dependency and a handful of configuration files, lowers the cognitive overhead for developers and makes projects easier to maintain. Finally, the highly ergonomic developer experience—characterized by features like state-preserving hot reloading, native TypeScript support, and unified code quality tooling—empowers developers to focus their creative energy on what truly matters: designing and building compelling gameplay experiences.  
This integrated approach is not merely a matter of convenience. It is the emerging standard for ambitious development teams who seek to push the boundaries of what is possible on the web platform. By adopting this stack, developers can build more complex, more performant, and more polished games, faster than ever before.

#### **Works cited**

1. Getting Started with BiomeJS | Better Stack Community, accessed August 28, 2025, [https://betterstack.com/community/guides/scaling-nodejs/biomejs-explained/](https://betterstack.com/community/guides/scaling-nodejs/biomejs-explained/)  
2. Biome adoption guide: Overview, examples, and alternatives \- LogRocket Blog, accessed August 28, 2025, [https://blog.logrocket.com/biome-adoption-guide/](https://blog.logrocket.com/biome-adoption-guide/)  
3. Bun download | SourceForge.net, accessed August 28, 2025, [https://sourceforge.net/projects/bun.mirror/](https://sourceforge.net/projects/bun.mirror/)  
4. Bun — A fast all-in-one JavaScript runtime, accessed August 28, 2025, [https://bun.com/](https://bun.com/)  
5. oven-sh/bun: Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one \- GitHub, accessed August 28, 2025, [https://github.com/oven-sh/bun](https://github.com/oven-sh/bun)  
6. TypeScript | Bun Docs, accessed August 28, 2025, [https://bun.com/docs/typescript](https://bun.com/docs/typescript)  
7. TypeScript – Runtime | Bun Docs, accessed August 28, 2025, [https://bun.com/docs/runtime/typescript](https://bun.com/docs/runtime/typescript)  
8. Biome v2: type-aware rules, monorepo support, plugins and more\! : r/javascript \- Reddit, accessed August 28, 2025, [https://www.reddit.com/r/javascript/comments/1led1rl/biome\_v2\_typeaware\_rules\_monorepo\_support\_plugins/](https://www.reddit.com/r/javascript/comments/1led1rl/biome_v2_typeaware_rules_monorepo_support_plugins/)  
9. Biome is an awesome linter : r/reactjs \- Reddit, accessed August 28, 2025, [https://www.reddit.com/r/reactjs/comments/1kh56da/biome\_is\_an\_awesome\_linter/](https://www.reddit.com/r/reactjs/comments/1kh56da/biome_is_an_awesome_linter/)  
10. bun install — A superfast Node.js-compatible package manager, accessed August 28, 2025, [https://bun.com/package-manager](https://bun.com/package-manager)  
11. Using Bun \- Expo Documentation, accessed August 28, 2025, [https://docs.expo.dev/guides/using-bun/](https://docs.expo.dev/guides/using-bun/)  
12. Bun vs ts-node | Better Stack Community, accessed August 28, 2025, [https://betterstack.com/community/guides/scaling-nodejs/bun-vs-ts-node-typescript/](https://betterstack.com/community/guides/scaling-nodejs/bun-vs-ts-node-typescript/)  
13. Biome, toolchain of the web, accessed August 28, 2025, [https://biomejs.dev/](https://biomejs.dev/)  
14. Biome v2 ships type-aware rules without the TS compiler : r/typescript \- Reddit, accessed August 28, 2025, [https://www.reddit.com/r/typescript/comments/1ldwrxr/biome\_v2\_ships\_typeaware\_rules\_without\_the\_ts/](https://www.reddit.com/r/typescript/comments/1ldwrxr/biome_v2_ships_typeaware_rules_without_the_ts/)  
15. Lint & Format JavaScript with Biome \- Space Jelly, accessed August 28, 2025, [https://spacejelly.dev/posts/lint-format-javascript-with-biome](https://spacejelly.dev/posts/lint-format-javascript-with-biome)  
16. Setting up Biome | Astro Tips, accessed August 28, 2025, [https://astro-tips.dev/tips/biome/](https://astro-tips.dev/tips/biome/)  
17. Configure Biome | Biome, accessed August 28, 2025, [https://biomejs.dev/guides/configure-biome/](https://biomejs.dev/guides/configure-biome/)  
18. Getting Started with Biome: A Modern Web Development Toolchain | by Frontend Highlights | Devmap | Medium, accessed August 28, 2025, [https://medium.com/devmap/getting-started-with-biome-a-modern-web-development-toolchain-7c9046cebbfc](https://medium.com/devmap/getting-started-with-biome-a-modern-web-development-toolchain-7c9046cebbfc)  
19. Formatter | Biome, accessed August 28, 2025, [https://biomejs.dev/formatter/](https://biomejs.dev/formatter/)  
20. Linter | Biome, accessed August 28, 2025, [https://biomejs.dev/linter/](https://biomejs.dev/linter/)  
21. Linter rules from other sources · biomejs biome · Discussion \#3 \- GitHub, accessed August 28, 2025, [https://github.com/biomejs/biome/discussions/3](https://github.com/biomejs/biome/discussions/3)  
22. bun.com, accessed August 28, 2025, [https://bun.com/docs/bundler\#:\~:text=Bun's%20bundler%20can%20handle%20both,into%20a%20single%20deployable%20unit.](https://bun.com/docs/bundler#:~:text=Bun's%20bundler%20can%20handle%20both,into%20a%20single%20deployable%20unit.)  
23. Bun.build – Bundler | Bun Docs, accessed August 28, 2025, [https://bun.com/docs/bundler](https://bun.com/docs/bundler)  
24. Getting started | Rapier, accessed August 28, 2025, [https://rapier.rs/docs/user\_guides/javascript/getting\_started\_js/](https://rapier.rs/docs/user_guides/javascript/getting_started_js/)  
25. dimforge/rapier.js: Official JavaScript bindings for the Rapier physics engine. \- GitHub, accessed August 28, 2025, [https://github.com/dimforge/rapier.js/](https://github.com/dimforge/rapier.js/)  
26. Loading and running WebAssembly code \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Loading\_and\_running](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Loading_and_running)
