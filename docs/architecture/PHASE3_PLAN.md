# Phase 3: Architecture Enforcement Enhancement Plan

**Version:** 1.0.0
**Status:** Planning
**Date:** 2025-11-02
**Estimated Duration:** 12-16 hours
**Risk Level:** MEDIUM

## Executive Summary

Phase 3 focuses on **completing the architecture enforcement system** by addressing the 37 remaining warnings, enhancing developer experience, and establishing governance processes. Unlike the originally planned "directory restructure," this phase implements **vendor abstraction patterns** and **developer tooling** to ensure long-term architectural compliance.

## Context & Current State

### Achievements (Phases 1-2)
✅ Architecture tooling installed and configured
✅ ESLint boundaries enforcement active
✅ Dependency-cruiser validation working
✅ CI/CD integration complete
✅ All 31 critical violations fixed
✅ Math.random() replaced with DeterministicRNG
✅ Observability layer dependencies cleaned up

### Remaining Issues
⚠️ **33 vendor import warnings** - Scenes and modules directly importing phaser/rapier/howler
⚠️ **1 console.log warning** - EventNames.js has debug logging
⚠️ **3 import order warnings** - Minor formatting in AudioManager/InputManager
⚠️ **No pre-commit validation** - Violations only caught in CI
⚠️ **Limited developer feedback** - Architecture errors not visible during development

### Why Vendor Imports Matter

**The Problem:**
```javascript
// ❌ Current pattern (violates architecture)
import { Scene } from 'phaser';                    // scenes/Game.js
import RAPIER from '@dimforge/rapier2d-compat';   // modules/player/PlayerController.js
```

**Why This Violates Architecture:**
1. **Tight Coupling** - Gameplay code directly depends on vendor libraries
2. **Testing Difficulty** - Can't mock or stub vendor dependencies
3. **Version Lock-in** - Hard to upgrade or swap libraries
4. **Architecture Erosion** - Core layer abstraction bypassed

**The Solution (Phase 3):**
```javascript
// ✅ Correct pattern (enforces architecture)
import { BaseScene } from '@features/core';       // Core abstracts Phaser.Scene
import { PhysicsManager } from '@features/core';  // Core abstracts Rapier
```

## Phase 3 Objectives

### Primary Objectives
1. **Eliminate all 37 warnings** - Achieve 0 architecture violations
2. **Vendor abstraction layer** - Only core layer touches vendor libraries
3. **Developer experience** - Pre-commit hooks, instant feedback, better errors
4. **Documentation** - Architecture Decision Records (ADRs), updated guides

### Secondary Objectives
1. **Architecture governance** - Establish processes for architectural changes
2. **Metrics & monitoring** - Track architecture health over time
3. **Team enablement** - Training materials, onboarding guides

## Implementation Plan

### Track 1: Vendor Abstraction Layer (8-10 hours)

**Goal:** Eliminate 33 vendor import warnings by creating proper abstractions.

#### 1.1 Create Base Scene Abstraction (2 hours)
**Priority:** CRITICAL

**Problem:** All 12 scenes import `phaser` directly to extend `Phaser.Scene`.

**Solution:**
```javascript
// src/core/BaseScene.js (NEW FILE)
import { Scene } from 'phaser';
import { EventBus } from './EventBus.js';
import { LOG } from '@observability';

export class BaseScene extends Scene {
    constructor(key) {
        super(key);
        this.eventSystem = new EventBus();
        this.setupObservability();
    }

    setupObservability() {
        LOG.info('SCENE_INIT', {
            subsystem: 'scenes',
            sceneKey: this.scene.key,
            message: 'Scene initialized'
        });
    }

    // Lifecycle hooks with observability
    create() {}
    update(time, delta) {}
    shutdown() {
        LOG.dev('SCENE_SHUTDOWN', {
            subsystem: 'scenes',
            sceneKey: this.scene.key
        });
    }
}
```

**Migration:**
```javascript
// BEFORE
import { Scene } from 'phaser';
export class GameScene extends Scene { ... }

// AFTER
import { BaseScene } from '@features/core';
export class GameScene extends BaseScene { ... }
```

**Files to Update (12 total):**
- src/scenes/Boot.js
- src/scenes/Preloader.js
- src/scenes/Game.js
- src/scenes/MainMenu.js
- src/scenes/PauseScene.js
- src/scenes/GameOver.js
- src/scenes/CharacterSelect.js
- src/scenes/HubScene.js
- src/scenes/BirthdayMinigame.js
- src/scenes/FactoryScene.js
- src/scenes/RunScene.js
- src/scenes/TestScene.js
- src/scenes/SettingsScene.js
- src/scenes/SubtitleExample.js
- src/scenes/WelcomeScene.js
- src/scenes/ResultsScene.js

**Testing:** All scenes must load and function identically.

#### 1.2 Create Rapier Type Exports (2 hours)
**Priority:** CRITICAL

**Problem:** 14 modules import `@dimforge/rapier2d-compat` directly for types.

**Solution:**
```javascript
// src/core/PhysicsTypes.js (NEW FILE)
import RAPIER from '@dimforge/rapier2d-compat';

// Re-export commonly used types
export const RigidBodyType = RAPIER.RigidBodyType;
export const ColliderDesc = RAPIER.ColliderDesc;
export const RigidBodyDesc = RAPIER.RigidBodyDesc;
export const Vector2 = RAPIER.Vector2;

// Type helper functions
export function createKinematicBody(world, x, y) {
    const desc = RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
    return world.createRigidBody(desc);
}

export function createDynamicBody(world, x, y) {
    const desc = RigidBodyDesc.dynamic().setTranslation(x, y);
    return world.createRigidBody(desc);
}

export function createBoxCollider(width, height) {
    return ColliderDesc.cuboid(width / 2, height / 2);
}
```

**Migration:**
```javascript
// BEFORE
import RAPIER from '@dimforge/rapier2d-compat';
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()...);

// AFTER
import { createDynamicBody } from '@features/core';
const body = createDynamicBody(world, x, y);
```

**Files to Update (14 total):**
- src/modules/player/PlayerController.js
- src/modules/player/WallDashController.js
- src/modules/enemy/EnemyController.js
- src/modules/enemy/PulsatingBoss.js
- src/modules/boss/PulsarController.js
- src/modules/level/GroundFactory.js
- src/modules/level/PlatformFactory.js
- src/modules/level/CollectibleManager.js
- src/modules/level/LevelCompletionManager.js
- src/modules/level/MovingPlatformController.js

**Testing:** All physics behaviors must remain identical.

#### 1.3 Update Howler Abstraction (1 hour)
**Priority:** HIGH

**Problem:** AudioManager imports `howler` directly (acceptable in core, but should use abstraction).

**Solution:** AudioManager already exists - just need to document pattern and add to features barrel.

**Action:**
1. Verify AudioManager properly abstracts Howler
2. Add to @features/core export
3. Document usage pattern

#### 1.4 Update Feature Barrels (1 hour)
**Priority:** HIGH

**Solution:**
```javascript
// src/features/core/index.js
export { BaseScene } from '../../core/BaseScene.js';
export { PhysicsTypes, createDynamicBody, createKinematicBody } from '../../core/PhysicsTypes.js';
// ... existing exports
```

#### 1.5 Fix Minor Warnings (30 min)
**Priority:** LOW

- Remove console.log from EventNames.js (1 file)
- Fix import order in AudioManager.js (1 file)
- Fix import order in InputManager.js (1 file)

#### 1.6 Update ESLint Rules (30 min)
**Priority:** HIGH

Change vendor import rules from 'warn' to 'error' once all files are migrated:

```javascript
// eslint.config.mjs
'no-restricted-imports': [
    'error', // Changed from 'warn'
    {
        patterns: [{
            group: ['phaser', 'howler', '@dimforge/rapier2d-compat'],
            message: 'Direct vendor imports are forbidden. Use abstractions from @features/core.'
        }]
    }
]
```

**Exception:** Core layer is allowed vendor imports (already configured).

#### 1.7 Validation & Testing (2 hours)
**Priority:** CRITICAL

**Test Suite:**
1. ✅ `npm run lint:boundaries` - 0 errors, 0 warnings
2. ✅ `npm run deps:check` - 0 violations
3. ✅ `npm test` - All tests pass
4. ✅ `npm run build` - Clean build
5. ✅ Manual gameplay test - All features work

### Track 2: Developer Experience (3-4 hours)

#### 2.1 Pre-commit Hooks (1 hour)
**Priority:** HIGH

**Goal:** Catch architecture violations before commit.

**Solution:** Use husky + lint-staged (already installed).

```javascript
// .husky/pre-commit (UPDATE)
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for formatting
bun run lint-staged

# Architecture validation
echo "🏗️  Validating architecture..."
bun run arch:validate || {
    echo "❌ Architecture validation failed. Run 'bun run arch:check' for details."
    exit 1
}

# Boundary checks
echo "🚧 Checking layer boundaries..."
bun run lint:boundaries --max-warnings=0 || {
    echo "❌ Layer boundary violations detected."
    exit 1
}

echo "✅ Pre-commit checks passed!"
```

**Testing:** Try committing a file with vendor import violation.

#### 2.2 Better Error Messages (1 hour)
**Priority:** MEDIUM

**Goal:** Make architecture errors easier to understand and fix.

**Solution:** Create custom ESLint formatter.

```javascript
// architecture/tools/architecture-formatter.js (NEW FILE)
export default function(results) {
    const violations = results.filter(r => r.errorCount > 0);

    if (violations.length === 0) {
        return '✅ No architecture violations detected.\n';
    }

    let output = '\n❌ Architecture Violations Detected:\n\n';

    violations.forEach(result => {
        const messages = result.messages.filter(m =>
            m.ruleId === 'boundaries/element-types' ||
            m.ruleId === 'no-restricted-imports'
        );

        if (messages.length > 0) {
            output += `📁 ${result.filePath}\n`;
            messages.forEach(msg => {
                output += `   Line ${msg.line}: ${msg.message}\n`;
                output += `   💡 Use abstractions from @features/core instead.\n`;
            });
            output += '\n';
        }
    });

    output += '📚 See docs/architecture/PHASE3_PLAN.md for migration guide.\n';
    return output;
}
```

**Usage:**
```json
// package.json
{
    "scripts": {
        "arch:check:pretty": "eslint src --format ./architecture/tools/architecture-formatter.js"
    }
}
```

#### 2.3 VS Code Integration (1 hour)
**Priority:** MEDIUM

**Goal:** Real-time architecture feedback in editor.

**Solution:**
```json
// .vscode/settings.json (NEW FILE)
{
    "eslint.enable": true,
    "eslint.validate": ["javascript"],
    "eslint.run": "onType",
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.associations": {
        "*.js": "javascript"
    },

    // Architecture-specific warnings
    "eslint.rules.customizations": [
        {
            "rule": "boundaries/element-types",
            "severity": "error"
        },
        {
            "rule": "no-restricted-imports",
            "severity": "error"
        }
    ]
}
```

```json
// .vscode/extensions.json (NEW FILE)
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
    ]
}
```

#### 2.4 Architecture Health Dashboard (1 hour)
**Priority:** LOW

**Goal:** Quick visibility into architecture state.

**Solution:**
```javascript
// scripts/architecture-health.js (NEW FILE)
import { execSync } from 'child_process';

console.log('🏗️  WynIsBuff2 Architecture Health Report\n');

// Run validations
const checks = [
    { name: 'A-Spec Validation', cmd: 'bun run arch:validate' },
    { name: 'Layer Boundaries', cmd: 'bun run lint:boundaries --max-warnings=0' },
    { name: 'Dependency Graph', cmd: 'bun run deps:check' },
    { name: 'Test Suite', cmd: 'bun test' }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    try {
        execSync(check.cmd, { stdio: 'ignore' });
        console.log(`✅ ${check.name}`);
        passed++;
    } catch {
        console.log(`❌ ${check.name}`);
        failed++;
    }
});

console.log(`\n📊 Health Score: ${passed}/${checks.length} (${Math.round(passed/checks.length*100)}%)\n`);

if (failed > 0) {
    console.log('💡 Run individual checks for details:\n');
    checks.forEach(c => console.log(`   ${c.cmd}`));
}
```

**Usage:**
```json
// package.json
{
    "scripts": {
        "arch:health": "bun scripts/architecture-health.js"
    }
}
```

### Track 3: Documentation & Governance (2-3 hours)

#### 3.1 Architecture Decision Records (1 hour)
**Priority:** HIGH

**Goal:** Document architectural decisions for future reference.

**Solution:** Create ADR template and initial ADRs.

```markdown
// docs/architecture/adrs/ADR-001-vendor-abstraction-layer.md (NEW FILE)
# ADR-001: Vendor Abstraction Layer

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Architecture Team

## Context
Direct vendor imports (phaser, rapier, howler) scattered across codebase violate layered architecture. This creates tight coupling, testing difficulties, and makes library upgrades risky.

## Decision
Only the `core` layer may import vendor libraries directly. All other layers must use abstractions exported via `@features/core`.

## Consequences
**Positive:**
- Clean architectural boundaries
- Easier testing (mock core abstractions)
- Simplified library upgrades
- Better separation of concerns

**Negative:**
- Initial migration effort (16 files)
- Additional abstraction layer
- Slight learning curve for new contributors

## Implementation
See docs/architecture/PHASE3_PLAN.md Track 1.
```

**Additional ADRs:**
- ADR-002: Deterministic RNG for gameplay
- ADR-003: Observability layer independence
- ADR-004: Generated constants pattern

#### 3.2 Update ARCHITECTURE.md (30 min)
**Priority:** HIGH

**Updates:**
1. Add section on vendor abstraction pattern
2. Reference A-Spec v2.0.0
3. Update layer dependency diagram
4. Add "Adding New Features" section with architecture checks

#### 3.3 Update CLAUDE.md (30 min)
**Priority:** MEDIUM

**Updates:**
1. Add vendor abstraction rules to "Critical Rules"
2. Update import pattern examples
3. Add architecture validation to development workflow
4. Update "Common Development Tasks"

#### 3.4 Migration Guide (30 min)
**Priority:** MEDIUM

```markdown
// docs/guides/VENDOR_MIGRATION.md (NEW FILE)
# Migrating from Direct Vendor Imports

## Quick Reference

### Phaser (Scenes)
```javascript
// BEFORE
import { Scene } from 'phaser';
export class MyScene extends Scene { ... }

// AFTER
import { BaseScene } from '@features/core';
export class MyScene extends BaseScene { ... }
```

### Rapier (Physics)
```javascript
// BEFORE
import RAPIER from '@dimforge/rapier2d-compat';
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()...);

// AFTER
import { createDynamicBody } from '@features/core';
const body = createDynamicBody(world, x, y);
```

### Howler (Audio)
```javascript
// BEFORE
import { Howl } from 'howler';
const sound = new Howl({ src: ['sound.mp3'] });

// AFTER
import { AudioManager } from '@features/core';
const audio = new AudioManager();
audio.playSFX('sound');
```

## Step-by-Step Migration

1. Identify vendor imports in your file
2. Replace with appropriate abstraction
3. Run `bun run lint:boundaries` to verify
4. Test functionality
5. Commit changes

## Common Issues

**Q: Why can't I import Phaser directly?**
A: Only the core layer should touch vendor libraries. This keeps architecture clean and testable.

**Q: What if I need a Phaser feature not in BaseScene?**
A: Add it to BaseScene or PhysicsManager as a proper abstraction. Don't bypass the architecture.

**Q: How do I test code that uses abstractions?**
A: Much easier! Mock the abstraction instead of the vendor library.
```

### Track 4: Monitoring & Metrics (1-2 hours)

#### 4.1 Architecture Snapshot Enhancements (1 hour)
**Priority:** LOW

**Goal:** Track architecture metrics over time.

**Solution:** Enhance `scripts/validate-architecture.js` to include trends.

```javascript
// Add to snapshot.json
{
    "metrics": {
        "totalViolations": 0,
        "violationsByType": {
            "boundaries": 0,
            "vendors": 0,
            "dependencies": 0
        },
        "healthScore": 100,
        "trend": "improving" // compare to previous snapshot
    },
    "history": [
        { "date": "2025-11-01", "violations": 31, "score": 75 },
        { "date": "2025-11-02", "violations": 0, "score": 100 }
    ]
}
```

#### 4.2 CI Enhancements (1 hour)
**Priority:** LOW

**Goal:** Better CI reporting for architecture state.

**Solution:**
```yaml
# .github/workflows/ci.yml
- name: Architecture Health Report
  run: |
    bun run arch:health > architecture-report.txt
    cat architecture-report.txt

- name: Comment PR with Architecture Report
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('architecture-report.txt', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## 🏗️ Architecture Health Report\n\n\`\`\`\n${report}\n\`\`\``
      });
```

## Risks & Mitigation

### Risk 1: Breaking Changes (HIGH)
**Risk:** Vendor abstraction migration touches 30+ files, could break functionality.

**Mitigation:**
- Create feature branch: `feat/phase3-vendor-abstraction`
- Incremental commits by module
- Test after each migration batch
- Keep main branch stable

### Risk 2: Developer Resistance (MEDIUM)
**Risk:** Team might resist architectural constraints.

**Mitigation:**
- Clear documentation with examples
- Explain benefits (testing, maintainability)
- Good error messages with fix suggestions
- Training session if needed

### Risk 3: Performance Impact (LOW)
**Risk:** Additional abstraction layer could affect performance.

**Mitigation:**
- Abstractions are thin wrappers (minimal overhead)
- Modern JS engines optimize well
- Profile if concerns arise

### Risk 4: Incomplete Migration (MEDIUM)
**Risk:** Some edge cases might be missed in migration.

**Mitigation:**
- Comprehensive grep for vendor imports
- Strict ESLint rules catch violations
- Manual testing of all features
- CI blocks violations

## Success Criteria

### Must Have (Phase 3 Complete)
- [ ] All 37 warnings eliminated (0 violations)
- [ ] BaseScene abstraction created and migrated
- [ ] PhysicsTypes abstraction created and migrated
- [ ] All tests passing
- [ ] Clean build (no warnings)
- [ ] Pre-commit hooks active
- [ ] Documentation updated
- [ ] ADRs created

### Should Have (Phase 3 Complete)
- [ ] VS Code integration
- [ ] Better error messages
- [ ] Architecture health dashboard
- [ ] CI enhancements

### Nice to Have (Post Phase 3)
- [ ] Architecture metrics trending
- [ ] Team training completed
- [ ] Performance profiling done

## Timeline

### Week 1 (8-10 hours)
**Focus:** Vendor Abstraction Layer

- Day 1-2: Create BaseScene, migrate scenes (4 hours)
- Day 3-4: Create PhysicsTypes, migrate modules (4 hours)
- Day 5: Testing and validation (2 hours)

### Week 2 (4-6 hours)
**Focus:** Developer Experience & Documentation

- Day 1: Pre-commit hooks, error messages (2 hours)
- Day 2: VS Code integration, health dashboard (2 hours)
- Day 3: Documentation and ADRs (2 hours)

### Total: 12-16 hours

## Next Steps

1. **Get Approval** - Review this plan with team
2. **Create Feature Branch** - `feat/phase3-vendor-abstraction`
3. **Start Track 1.1** - BaseScene abstraction
4. **Incremental PRs** - Small, testable changes
5. **Celebrate** - 0 violations! 🎉

## Questions for Review

1. Do we agree vendor abstraction is the right approach?
2. Should we migrate all at once or incrementally?
3. Any additional abstractions needed?
4. Are the timeline estimates reasonable?
5. Any missing risks or concerns?

## References

- [A-Spec v2.0.0](../../architecture/a-spec.json)
- [STATUS-ARCHITECTURE.json](../../STATUS-ARCHITECTURE.json)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [ESLint Config](../../eslint.config.mjs)
