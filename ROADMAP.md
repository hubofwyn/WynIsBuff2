# WynIsBuff2 Development Roadmap

*Last Updated: 2025-07-08*

This document provides a health report and clearly prioritized backlog for moving WynIsBuff2 from "works on my machine" to a solid, scalable game project.

## A. ✅ Recently Completed Items

### Birthday Minigame Fix
- ✅ Fixed data manager vs. plain property bug (unified setData/getData)
- ✅ Added scene init() + safe restart logic (R = replay)
- ✅ Added replay/menu prompt, physics resume, listener cleanup

### Asset Mapping Fix
- ✅ Generic BACKGROUND and parallax keys now point to real landscape image
- ✅ Boot/Level 1 backdrops load correctly

### Infrastructure Improvements
- ✅ **ESLint + Prettier** configured with pre-commit hooks via Husky
- ✅ **GitHub Actions CI** pipeline running tests, linting, and builds
- ✅ **Logger System** created to replace console.log with level-based logging
- ✅ **Test Migration** - All tests converted from CommonJS to ESM (.mjs files)
- ✅ **Telemetry Gating** - log.js already respects CI=true and DISABLE_TELEMETRY=true

## B. 🔍 Current Gaps & Risks

### High Impact (★)
1. ~~No automated lint/style enforcement~~ ✅ FIXED
2. ★ **Unit tests cover only helpers**; gameplay, physics, scenes and LevelLoader remain untested
3. ~~Test suite dual *.js/*.cjs~~ ✅ FIXED - All tests now ESM
4. ~~No CI~~ ✅ FIXED - GitHub Actions implemented
5. ~~Telemetry fires in every env~~ ✅ FIXED - Properly gated
6. **Duplicate namespaces**: src/modules vs. generated src/features barrels
7. ~~Console spam in production~~ ✅ FIXED - Logger system with levels
8. **Assets folder large** & some placeholders duplicated
9. **LocalStorage quota errors** silently drop saves (caught but ignored)
10. **No TypeScript types**; public APIs un-typed
11. **No automated asset-manifest validation**; missing/wrong paths surface only at runtime
12. **No performance budget checks** (bundle size, FPS regressions)

## C. 📋 Development Backlog

### P0 - Foundation (✅ COMPLETED)
1. ✅ ESLint + Prettier configuration
2. ✅ Husky + lint-staged pre-commit hooks
3. ✅ GitHub Actions CI workflow
4. ✅ Telemetry flagging (already gated)

### P1 - Test & Quality Expansion (NEXT SPRINT)
5. ~~Convert test files to pure ESM~~ ✅ DONE
6. **Add high-value integration tests:**
   - [ ] PlayerController movement + collision (use headless-Phaser WebGL stub)
   - [ ] LevelLoader background config loads existing textures
   - [ ] Birthday minigame full gameplay loop (mock timers)
7. **Wire NYC/c8 for coverage**; fail CI under 80%
8. ~~Introduce Logger~~ ✅ DONE
9. **Normalize src/features** – generate single features/index.js barrel at build-time

### P1 - Developer DX & Architecture
10. **Auto-generate src/constants/Assets.js** from assets/manifest.json
11. **Guard GameStateManager**: if localStorage throws, surface toast + fallback to in-memory
12. **Add performance watchdog** (FPS overlay in dev; CI budget check on dist/ size)

### P2 - Refinement (STRETCH GOALS)
13. **Migrate to TypeScript** (keep .js until stable)
14. **Replace EventBus** with tiny-emitter + typed payloads
15. **Automated asset optimization** (imagemin/squoosh) in build pipeline
16. **E2E smoke tests** with Playwright
17. **Internationalization stub** (i18n-next) if global release planned

## D. 📝 Next Action Items

### Immediate Tasks
- [x] ~~Set up ESLint + Prettier~~ ✅
- [x] ~~Configure pre-commit hooks~~ ✅
- [x] ~~Create GitHub Actions CI~~ ✅
- [x] ~~Implement Logger system~~ ✅
- [ ] Run `npm run format` to fix existing formatting issues
- [ ] Clean up src/features barrel exports

### Next Sprint Focus
1. **Expand Test Coverage**
   ```bash
   # Add gameplay tests for:
   - PlayerController (movement, jumping, collision)
   - LevelLoader (asset loading, level initialization)
   - BirthdayMinigame (full game loop)
   ```

2. **Clean Up Module Structure**
   ```bash
   # Remove duplicate barrel exports
   - Consolidate src/features into single index
   - Remove redundant re-exports
   ```

3. **Improve Error Handling**
   ```javascript
   // GameStateManager localStorage fallback
   try {
     localStorage.setItem(key, value);
   } catch (e) {
     this.logger.warn('LocalStorage unavailable, using memory store');
     this.memoryFallback[key] = value;
   }
   ```

4. **Asset Validation Script**
   ```bash
   npm run validate-assets  # Check manifest.json paths exist
   ```

## E. 📊 Success Metrics

- ✅ All commits pass linting and tests
- ✅ CI pipeline runs on every PR
- ✅ Production builds have no console.log statements
- ⏳ Test coverage > 80% for core modules
- ⏳ Bundle size < 5MB (excluding assets)
- ⏳ 60 FPS maintained on target devices

## F. 🎯 Current Status Summary

**Infrastructure**: ✅ SOLID
- Linting, formatting, and CI are all in place
- Logger system implemented
- Tests migrated to ESM

**Next Priority**: TEST COVERAGE
- Focus on gameplay and integration tests
- Add coverage reporting to CI

**Technical Debt**: MANAGEABLE
- Feature barrel cleanup needed
- Some asset optimization opportunities
- LocalStorage error handling improvement

---

*This roadmap is a living document. Update it as tasks are completed and new priorities emerge.*