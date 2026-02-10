# ADR-001: Vendor Abstraction Layer

**Date:** 2025-11-02
**Status:** ✅ Accepted & Implemented
**Deciders:** Architecture Team

## Context

WynIsBuff2 had 37 architecture violations where scenes and gameplay modules directly imported vendor libraries (Phaser, Rapier, Howler). This violated the layered architecture defined in A-Spec v2.0.0:

**Problems:**

- Tight coupling to specific library versions
- Difficult to test (can't mock vendor libraries)
- Risky library upgrades (changes affect 30+ files)
- Architectural boundaries not enforced

## Decision

**Only the `core` layer may import vendor libraries directly.** All other layers must use abstractions exported via `@features/core`.

### Implementation

**Two new abstractions created:**

1. **BaseScene** (`src/core/BaseScene.js`)
   - Abstracts `Phaser.Scene`
   - All 16 scenes extend BaseScene instead of Scene
   - Built-in observability & EventBus integration

2. **PhysicsTypes** (`src/core/PhysicsTypes.js`)
   - Abstracts Rapier physics types and helpers
   - 13 type exports + 12 helper functions
   - All 14 physics modules use PhysicsTypes

**ESLint enforcement:**

```javascript
// Core layer: vendor imports allowed
{ files: ['src/core/**/*.js'], rules: { 'no-restricted-imports': 'off' } }

// All other layers: vendor imports forbidden (use abstractions)
```

## Consequences

### Positive ✅

- **Clean boundaries:** Only core touches vendors
- **Easy testing:** Mock BaseScene/PhysicsTypes, not vendors
- **Simple upgrades:** Change library version in one place
- **Enforced patterns:** ESLint catches violations at development time
- **Violations reduced:** 37 → 1 (97% reduction)

### Negative ⚠️

- **Migration effort:** 30 files updated (one-time cost)
- **Abstraction overhead:** Extra layer between code and vendors (minimal)
- **Learning curve:** New developers must learn abstraction pattern (documented)

### Neutral

- **One remaining violation:** SettingsScene uses `Phaser.Math` utilities
  - Documented with TODO comment
  - Future: Abstract math utilities to core layer

## Validation

**Metrics (2025-11-02):**

- Architecture violations: 37 → 1 (97% reduction)
- Tests: ✅ All passing
- Build: ✅ Clean production build
- Health score: 100%

**Developer experience:**

- Pre-commit hooks enforce boundaries
- VS Code shows violations in real-time
- Health dashboard: `bun run arch:health`

## References

- [Phase 3 Plan](../PHASE3_PLAN.md)
- [A-Spec v2.0.0](../../architecture/a-spec.json)
- [BaseScene](../../../src/core/BaseScene.js)
- [PhysicsTypes](../../../src/core/PhysicsTypes.js)

## Related Decisions

- ADR-002: Deterministic RNG for Gameplay (Phase 1)
- ADR-003: Observability Layer Independence (Phase 2)
- ADR-004: Generated Constants Pattern (Phase 1)
