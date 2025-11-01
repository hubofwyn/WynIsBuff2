# WynIsBuff2 Architectural Improvement Plan

**Status**: Planning Phase
**Branch**: `refactor/architectural-improvements`
**Target Date**: Q1 2025
**Last Updated**: 2025-01-31

## Executive Summary

This plan outlines incremental architectural improvements to WynIsBuff2, leveraging our current stack (Vite 7.1.12, Rapier 0.19.2, Phaser 3.90.0, ESLint 9.14.0) to establish machine-validated architecture boundaries, enhanced determinism, and build performance optimization.

**Key Objectives**:
1. Formalize layer boundaries with automated enforcement
2. Optimize build performance with Rolldown bundler (4-16x faster builds)
3. Enhance deterministic testing capabilities for replay systems
4. Create machine-readable architecture specification (A-Spec)

## Current State Analysis

### Stack Inventory ✅
- **Build Tool**: Vite 7.1.12 with Bun runtime
- **Physics**: Rapier 0.19.2 (already integrated, event queue configured)
- **Game Engine**: Phaser 3.90.0
- **Linting**: ESLint 9.14.0 (flat config already in place)
- **Audio**: Howler 2.2.4
- **Package Manager**: Bun

### Architecture Strengths ✅
- **Feature-based organization** with barrel exports already implemented
- **Event-driven communication** via EventBus with namespaced events
- **Singleton managers** extending BaseManager with proper lifecycle
- **Generated constants** for assets, scenes, events (no magic strings)
- **Observability system** with structured logging (LOG system)
- **DeterministicRNG** already exists in `src/core/`
- **PhysicsManager** using Rapier 0.19 with event queue

### Identified Gaps 🎯
1. **No formal layer boundary enforcement** - ESLint boundaries plugin not configured
2. **No dependency validation** - No dependency-cruiser or similar tool
3. **Build optimization opportunities** - Rolldown bundler not yet tested
4. **Incomplete determinism** - Physics determinism available but not fully leveraged
5. **No architecture validation** - No JSON spec or schema validation
6. **Manual architecture drift detection** - No CI gates for architectural compliance

## Proposed Layer Architecture

### Layer Mapping Strategy

**Current Structure** → **Enhanced Structure** (Minimal Disruption)

```
Current State (Keep):
src/
├── core/              # ✅ Infrastructure managers (keep as-is)
├── modules/           # ✅ Implementation layer (keep as-is)
├── features/          # ✅ Barrel exports (keep as-is)
├── scenes/            # ✅ Phaser scenes (keep as-is)
├── constants/         # ✅ Generated + manual constants (keep as-is)
├── observability/     # ✅ Logging system (keep as-is)
└── utils/             # ✅ Utilities (keep as-is)

Enhancement (Layer Semantics):
├── core/              → engine-infrastructure (singleton managers)
├── modules/*/         → Feature-specific implementations
│   ├── player/        → gameplay-agent (player behavior)
│   ├── enemy/         → gameplay-agent (enemy behavior)
│   ├── effects/       → Intentional FX (split rendering to scenes)
│   ├── level/         → gameplay-systems (level logic)
│   └── [phaser|audio|physics]/ → engine-wrappers (vendor facades)
├── features/          → Public API (no change)
├── scenes/            → engine-presentation (Phaser lifecycle)
└── observability/     → Cross-cutting (infrastructure)
```

**Key Decision**: We keep the file structure intact and add semantic layer enforcement through ESLint rules and tooling, avoiding expensive file moves.

### Layer Dependency Rules

```javascript
// Proposed eslint.config.mjs additions
{
  name: 'architecture-boundaries',
  settings: {
    'boundaries/elements': [
      {
        type: 'engine-infrastructure',
        pattern: 'src/core/**',
        mode: 'file'
      },
      {
        type: 'engine-presentation',
        pattern: 'src/scenes/**',
        mode: 'file'
      },
      {
        type: 'gameplay-agents',
        pattern: 'src/modules/{player,enemy}/**',
        mode: 'file'
      },
      {
        type: 'gameplay-systems',
        pattern: 'src/modules/{level,effects,idle,boss}/**',
        mode: 'file'
      },
      {
        type: 'public-api',
        pattern: 'src/features/**',
        mode: 'file'
      },
      {
        type: 'observability',
        pattern: 'src/observability/**',
        mode: 'file'
      }
    ]
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        // Engine can only import from itself and vendors
        {
          from: 'engine-infrastructure',
          allow: ['engine-infrastructure', 'observability']
        },
        // Scenes can import from core and features (public API)
        {
          from: 'engine-presentation',
          allow: ['public-api', 'engine-infrastructure', 'observability']
        },
        // Gameplay agents can use engine infrastructure
        {
          from: 'gameplay-agents',
          allow: ['engine-infrastructure', 'observability']
        },
        // Gameplay systems can use agents and infrastructure
        {
          from: 'gameplay-systems',
          allow: ['engine-infrastructure', 'gameplay-agents', 'observability']
        },
        // Public API exports everything (barrel pattern)
        {
          from: 'public-api',
          allow: ['engine-infrastructure', 'gameplay-agents', 'gameplay-systems']
        },
        // Observability is cross-cutting
        {
          from: 'observability',
          allow: ['observability']
        }
      ]
    }],
    // Prevent direct vendor imports in gameplay code
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['phaser', '@dimforge/*', 'howler'],
        message: 'Import vendors through manager facades (PhysicsManager, AudioManager)',
        from: 'src/modules/{player,enemy,level,effects}/**'
      }]
    }]
  }
}
```

## A-Spec: Architecture Specification

### JSON Schema Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WynIsBuff2 Architecture Specification",
  "type": "object",
  "required": ["version", "meta", "layers", "boundaries", "determinism"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version of this A-Spec"
    },
    "meta": {
      "type": "object",
      "required": ["vite", "runtime", "esm"],
      "properties": {
        "vite": { "type": "string" },
        "phaser": { "type": "string" },
        "rapier": { "type": "string" },
        "runtime": { "enum": ["bun", "node"] },
        "esm": { "type": "boolean" },
        "target": { "type": "string" }
      }
    },
    "layers": {
      "type": "object",
      "description": "Layer definitions with import rules",
      "additionalProperties": {
        "type": "object",
        "required": ["pattern", "canImport"],
        "properties": {
          "pattern": { "type": "string" },
          "canImport": {
            "type": "array",
            "items": { "type": "string" }
          },
          "vendors": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "boundaries": {
      "type": "object",
      "required": ["enforcement", "exceptions"],
      "properties": {
        "enforcement": { "enum": ["error", "warn", "off"] },
        "exceptions": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["from", "to", "reason"],
            "properties": {
              "from": { "type": "string" },
              "to": { "type": "string" },
              "reason": { "type": "string" }
            }
          }
        }
      }
    },
    "determinism": {
      "type": "object",
      "required": ["enabled", "physics", "rng"],
      "properties": {
        "enabled": { "type": "boolean" },
        "physics": {
          "type": "object",
          "properties": {
            "timestep": { "type": "string" },
            "maxSteps": { "type": "integer" },
            "deterministicBuild": { "type": "boolean" }
          }
        },
        "rng": {
          "type": "object",
          "properties": {
            "service": { "type": "string" },
            "enforceMathRandom": { "type": "boolean" }
          }
        }
      }
    },
    "performance": {
      "type": "object",
      "properties": {
        "bundler": { "enum": ["rollup", "rolldown"] },
        "target": { "type": "string" },
        "minify": { "type": "boolean" }
      }
    }
  }
}
```

### Initial A-Spec Instance

```json
{
  "version": "1.0.0",
  "meta": {
    "vite": "7.1.12",
    "phaser": "3.90.0",
    "rapier": "0.19.2",
    "runtime": "bun",
    "esm": true,
    "target": "baseline-widely-available"
  },
  "layers": {
    "engine-infrastructure": {
      "pattern": "src/core/**",
      "canImport": ["engine-infrastructure", "observability"],
      "vendors": ["@dimforge/rapier2d-compat", "howler"]
    },
    "engine-presentation": {
      "pattern": "src/scenes/**",
      "canImport": ["public-api", "engine-infrastructure", "observability"],
      "vendors": ["phaser"]
    },
    "gameplay-agents": {
      "pattern": "src/modules/{player,enemy}/**",
      "canImport": ["engine-infrastructure", "observability"],
      "vendors": []
    },
    "gameplay-systems": {
      "pattern": "src/modules/{level,effects,idle,boss}/**",
      "canImport": ["engine-infrastructure", "gameplay-agents", "observability"],
      "vendors": []
    },
    "public-api": {
      "pattern": "src/features/**",
      "canImport": ["engine-infrastructure", "gameplay-agents", "gameplay-systems"],
      "vendors": []
    },
    "observability": {
      "pattern": "src/observability/**",
      "canImport": ["observability"],
      "vendors": []
    }
  },
  "boundaries": {
    "enforcement": "error",
    "exceptions": []
  },
  "determinism": {
    "enabled": true,
    "physics": {
      "timestep": "1/120",
      "maxSteps": 4,
      "deterministicBuild": false
    },
    "rng": {
      "service": "DeterministicRNG",
      "enforceMathRandom": true
    }
  },
  "performance": {
    "bundler": "rollup",
    "target": "baseline-widely-available",
    "minify": true
  }
}
```

## Deterministic Systems Enhancement

### Current State
✅ **Already Implemented**:
- `src/core/DeterministicRNG.js` - Seeded RNG with state management
- `src/core/GoldenSeedTester.js` - Recording and replay framework
- `src/core/PhysicsManager.js` - Rapier 0.19 with fixed timestep accumulator

### Enhancement Opportunities

#### 1. Physics Determinism Configuration
```javascript
// Enhanced PhysicsManager.js additions
export class PhysicsManager extends BaseManager {
  async init(scene, eventSystem, options = {}) {
    const {
      gravityX = PhysicsConfig.gravityX,
      gravityY = PhysicsConfig.gravityY,
      deterministic = false
    } = options;

    await RAPIER.init();
    this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));

    // Configure for deterministic mode if requested
    if (deterministic) {
      this.world.maxVelocityIterations = 4;
      this.world.maxPositionIterations = 1;
      this.timestep = 1/120; // Fixed 120Hz
      LOG.info('PHYSICS_DETERMINISTIC', {
        subsystem: 'physics',
        message: 'Physics determinism enabled',
        timestep: this.timestep
      });
    }

    // ... rest of init
  }

  step(deltaTime) {
    this.accumulator += deltaTime;
    let stepsRun = 0;

    while (this.accumulator >= this.timestep && stepsRun < this.maxSteps) {
      this.world.step();
      this.accumulator -= this.timestep;
      stepsRun++;
    }

    // Track physics step metrics
    this.eventSystem?.emit(EventNames.PHYSICS_STEP, {
      stepsRun,
      accumulator: this.accumulator
    });
  }
}
```

#### 2. Replay System JSONL Format
```javascript
// Enhanced GoldenSeedTester with JSONL export
export class GoldenSeedTester extends BaseManager {
  exportReplay(filename = 'replay.jsonl') {
    const lines = this.frames.map(frame =>
      JSON.stringify({
        frame: frame.frameNumber,
        input: frame.input,
        physics: {
          playerPos: frame.playerPosition,
          velocity: frame.playerVelocity
        },
        rng: frame.rngState,
        events: frame.events
      })
    );

    const blob = new Blob([lines.join('\n')], { type: 'application/x-ndjson' });
    // Export via download or save to file system
  }

  async replayFromJSONL(fileContent) {
    const frames = fileContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    for (const frame of frames) {
      await this.replayFrame(frame);
    }
  }
}
```

#### 3. Math.random() Prevention
```javascript
// ESLint rule addition
{
  'no-restricted-properties': ['error', {
    object: 'Math',
    property: 'random',
    message: 'Use DeterministicRNG.getInstance() instead of Math.random() for deterministic gameplay'
  }]
}
```

## Build Performance Optimization

### Rolldown Bundler Integration

**Expected Gains**:
- Build time: 4-16x faster (GitLab: 2.5min → 40s)
- Memory usage: Up to 100x reduction
- HMR: Faster dev server updates

#### Configuration Strategy

```javascript
// vite/config.dev.mjs enhancement
import { defineConfig } from 'vite';

const USE_ROLLDOWN = process.env.VITE_BUNDLER === 'rolldown';

export default defineConfig({
  // Experimental Rolldown support
  ...(USE_ROLLDOWN && {
    experimental: {
      rolldown: {
        // Rolldown-specific optimizations
        treeshake: 'recommended',
        minify: false // Keep false for dev
      }
    }
  }),

  build: {
    target: 'baseline-widely-available', // Vite 7 default
    sourcemap: true
  },

  optimizeDeps: {
    include: [
      'phaser',
      '@dimforge/rapier2d-compat',
      'howler'
    ],
    // Pre-bundle large dependencies
    force: false
  },

  // Bun-specific optimizations
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true
    }
  }
});
```

#### Rolldown Testing Plan
1. **Phase 1**: Test on dev build (`bun run dev:rolldown`)
2. **Phase 2**: Measure build time baseline vs Rolldown
3. **Phase 3**: Test production build reliability
4. **Phase 4**: Enable for CI/CD if stable

## Tooling Integration

### Required Dependencies

```json
{
  "devDependencies": {
    // Architecture validation
    "eslint-plugin-boundaries": "^5.0.0",
    "dependency-cruiser": "^16.0.0",

    // A-Spec validation
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.0",

    // Testing
    "vitest": "^2.0.0",
    "fast-check": "^3.15.0",

    // Documentation
    "typedoc": "^0.26.0" // For API documentation generation
  }
}
```

### Package.json Script Additions

```json
{
  "scripts": {
    // Architecture enforcement
    "arch:validate": "bun scripts/validate-architecture.js",
    "arch:check-boundaries": "bunx --bun eslint . --rule 'boundaries/element-types: error'",
    "arch:check-deps": "bunx --bun depcruise src --config .dependency-cruiser.cjs --output-type err",
    "arch:snapshot": "bun scripts/generate-architecture-snapshot.js",

    // Build optimization
    "dev:rolldown": "VITE_BUNDLER=rolldown bun run dev",
    "build:rolldown": "VITE_BUNDLER=rolldown bun run build",
    "build:benchmark": "bun scripts/benchmark-build.js",

    // Deterministic testing
    "test:replay": "bun scripts/run-replay-tests.js",
    "test:determinism": "bun test tests/determinism/",

    // CI helpers
    "ci:arch": "bun run arch:validate && bun run arch:check-boundaries && bun run arch:check-deps"
  }
}
```

## Migration Timeline

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up tooling without breaking existing code

- [ ] Install eslint-plugin-boundaries, dependency-cruiser
- [ ] Create A-Spec JSON schema and initial instance
- [ ] Configure ESLint boundaries rules (warn mode initially)
- [ ] Create architecture validation scripts
- [ ] Add CI workflow for architecture checks (non-blocking)
- [ ] Document layer semantics in ARCHITECTURE.md

**Success Criteria**:
- All tools installed and configured
- Architecture validation runs in CI (warnings only)
- Zero false positives in boundary checks

### Phase 2: Boundary Enforcement (Week 3-4)
**Goal**: Fix boundary violations and enable strict mode

- [ ] Audit and fix any layer boundary violations
- [ ] Move eslint-plugin-boundaries from warn → error
- [ ] Add dependency-cruiser as CI gate
- [ ] Create architecture snapshot as baseline
- [ ] Make CI checks blocking
- [ ] Update CONTRIBUTING.md with boundary rules

**Success Criteria**:
- Zero boundary violations
- CI fails on new violations
- Architecture snapshot committed

### Phase 3: Build Optimization (Week 5-6)
**Goal**: Test and potentially enable Rolldown

- [ ] Benchmark baseline build performance
- [ ] Test Rolldown in dev mode
- [ ] Test Rolldown production builds
- [ ] Measure performance gains
- [ ] Update build documentation
- [ ] Enable Rolldown if stable (optional)

**Success Criteria**:
- Build time benchmarks documented
- Rolldown stability tested
- Decision made on adoption

### Phase 4: Determinism Enhancement (Week 7-8)
**Goal**: Enhance replay and testing capabilities

- [ ] Add deterministic physics configuration
- [ ] Implement JSONL replay format
- [ ] Create replay test suite
- [ ] Add Math.random() linting rule
- [ ] Document deterministic testing guide
- [ ] Create example replay test cases

**Success Criteria**:
- Replay system exports/imports JSONL
- Test suite uses deterministic mode
- Math.random() usage blocked in gameplay code

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/architecture.yml
name: Architecture Enforcement

on:
  push:
    branches: [main, develop, refactor/*]
  pull_request:
    branches: [main, develop]

jobs:
  validate-architecture:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Validate A-Spec
        run: bun run arch:validate

      - name: Check layer boundaries
        run: bun run arch:check-boundaries

      - name: Check dependencies
        run: bun run arch:check-deps

      - name: Generate architecture snapshot
        run: bun run arch:snapshot

      - name: Check for architecture drift
        run: |
          if ! git diff --exit-code docs/architecture/snapshot.json; then
            echo "::error::Architecture snapshot has drifted. Run 'bun run arch:snapshot' and commit changes."
            exit 1
          fi

      - name: Run determinism tests
        run: bun run test:determinism
```

## Success Metrics

### Quantitative Goals
- **Build Time**: Reduce by 50%+ if Rolldown adopted
- **CI Time**: Reduce overall CI time by 20%
- **Boundary Violations**: Zero violations in CI
- **Test Coverage**: 80%+ coverage for deterministic systems
- **Architecture Drift**: Automated detection in every PR

### Qualitative Goals
- **Developer Experience**: Clearer architecture boundaries reduce confusion
- **Maintainability**: Automated enforcement prevents architectural decay
- **Debugging**: Replay system enables reproducible bug investigation
- **Onboarding**: New developers understand layer rules from tooling

## Risk Mitigation

### Risk: Build Tool Instability
**Mitigation**: Rolldown is optional and experimental. Keep Rollup as fallback.

### Risk: False Positives in Boundary Checks
**Mitigation**: Start with warn mode, iterate on rules, use exceptions sparingly.

### Risk: Performance Regression
**Mitigation**: Benchmark before/after, keep detailed metrics.

### Risk: Team Friction with New Rules
**Mitigation**: Document clearly, provide examples, enforce gradually.

## Documentation Updates Required

1. **docs/ARCHITECTURE.md**
   - Add "Layer Boundaries" section referencing this plan
   - Update "Extension Points" with boundary rules

2. **docs/guides/DEBUGGING.md**
   - Add section on deterministic replay debugging

3. **CONTRIBUTING.md**
   - Add architecture compliance requirements
   - Link to layer boundary documentation

4. **README.md**
   - Update commands with new architecture scripts

5. **CLAUDE.md**
   - Add architecture enforcement to core principles
   - Update agent routing for architecture validation

## Open Questions for Team Discussion

1. **Rolldown Adoption Timeline**: Test immediately or wait for Vite official support?
2. **Determinism by Default**: Should deterministic mode be default in tests?
3. **Architecture Snapshot Frequency**: Commit on every change or weekly snapshots?
4. **CI Strictness**: Block PRs on architecture warnings or just errors?
5. **Exception Process**: How do we approve boundary exceptions?

## References

- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7)
- [Rolldown-Vite Integration](https://voidzero.dev/posts/announcing-rolldown-vite)
- [Rapier 0.19 Changelog](https://github.com/dimforge/rapier/blob/master/CHANGELOG.md)
- [ESLint 9 Flat Config](https://eslint.org/docs/latest/use/configure/)
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)

---

**Next Steps**: Review this plan with the team, get consensus on Phase 1 scope, and begin tooling setup.
