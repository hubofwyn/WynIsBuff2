# Get More Buff – Orchestration Guide

This guide explains how to coordinate the high‑impact fixes and integrations to complete the Run → Rewards → Forge → Factory production loop with determinism and robust tests.

## Overview

- Workflow config: `.claude-orchestration.json` → workflow `get-more-buff`
- Task list: `tasks/get-more-buff.json`
- Orchestration script: `scripts/orchestrate-get-more-buff.cjs`
- NPM scripts:
  - `npm run get-more-buff:plan` – print workflow steps
  - `npm run get-more-buff:verify` – run verifications + tests
  - `npm run get-more-buff` – alias to `verify`

## Workflow Phases

1. events-wiring – add missing constants, normalize EventBus usage, consistent forge events
2. boss-rewards – instantiate reward system, full boss defeat payloads, unify resource schema
3. determinism – clamp gaussian, add RNG tests
4. factory-integration – power Factory from EnhancedCloneManager lanes with decay visualization
5. tests – BossRewardSystem and Factory/lane integration tests wired into runner
6. save-load – centralize persistence and offline production
7. polish – reduce logs in prod, consistent imports/indentation

## Running Orchestration

```
npm run get-more-buff:plan   # preview phases
npm run get-more-buff:verify # verifications + full tests (fails until tasks are completed)
```

The verification script checks for:
- `BOSS_FIRST_CLEAR` event constant
- PulsarController ESM import fix and full boss defeat payload emission (heuristic)
- BossRewardSystem first‑clear event emission
- DeterministicRNG.gaussian log(0) guard
- FactoryScene uses EventBus (heuristic)

## Task Acceptance

See `tasks/get-more-buff.json` for acceptance criteria and owners per task. Keep commits atomic and follow the suggested order in `get-more-buff.md`.

## Notes

- The verify script intentionally fails until changes land; use it to gate merges.
- Extend verifications as needed for new sub‑workstreams.

