# WynIsBuff2 Project Status

- **Last updated:** 2026-07-14
- **Status:** current-work authority

**Current wording:** Working prototype; current development activity
unverified.

This file is the sole authority for selecting work in this repository. Code and
live Git/GitHub evidence outrank historical documents. Older plans, generated
JSON status snapshots, and observability reports remain evidence of their time;
they are not current roadmap or deployment proof.

## Repository Boundary

WynIsBuff2 is the original independent JavaScript and Phaser 3 game at
`hubofwyn/WynIsBuff2`. Wyn der Schrank is a separate TypeScript and Phaser 4
rebuild with its own history, remote, issues, roadmap, releases, and deployment
state. It is not a rename, in-place migration, replacement remote, shared
branch, or shared status authority. Keep Phaser 3.90 in this repository unless
the owner independently approves an engine migration here.

## Verified Baseline

- **Remote/default:** `hubofwyn/WynIsBuff2`, `main`
- **Clean remote-default SHA:**
  `c091fd7fbc76f0cda1f741d22f118330265cc6a4`
- **Verified:** 2026-07-14
- **GitHub queue:** no issues; PR #12 merged the independent-project boundary
  and compatible dependency refresh; stale PR #11 is closed and superseded
- **Deployment:** no GitHub Pages configuration or verified deployment; latest
  default-branch deploy failed at Setup Pages
- **Release:** no tags or releases
- **Tests:** 15 test files pass; expected-recovery cases emit noisy stack traces
- **Structural checks:** one direct-Phaser warning in
  `src/scenes/SettingsScene.js`; one orphan warning for
  `src/constants/PerformanceConfig.js`
- **Dependencies:** Vite 7.3.6, Rapier 0.19.3, and compatible tooling floors are
  recorded in `package.json`; Phaser remains 3.90.0
- **Security:** `bun audit --audit-level=high` reports zero findings against the
  regenerated lockfile; Handlebars 4.7.9 is the sole transitive override
- **Toolchain:** Bun 1.3.14 is pinned once in `packageManager`; Mise and all
  workflows use that pin through `oven-sh/setup-bun@v2`; checkout uses v7

## Next-Agent Work Order

Work on a fresh topic branch. Preserve existing topic branches and PR commits.
Do not deploy merely to change inventory or portfolio wording.

### L-001: Refresh dependency/security work

- **Status:** completed 2026-07-14
- **Priority:** P0
- **Result:** refreshed all compatible direct dependencies, regenerated
  `bun.lock`, and raised Vite beyond the affected `<=7.3.4` range
- **Transitives:** the fresh resolution selects patched LinkifyIt, Minimatch,
  fast-uri, flatted, Rollup, and Picomatch releases; the exact Handlebars pin in
  `@boundaries/elements` requires the explicit 4.7.9 override
- **Toolchain:** Bun 1.3.14 is the reproducible package and workflow pin;
  `actions/checkout@v7` removes the Node 20 action-runtime warning
- **Verification:** frozen install, audit, tests, lint, architecture health,
  dependency structure, formatting, and production build pass; the two known
  structural warnings remain owned by L-003
- **Deferred majors:** Phaser 4, Vite 8, ESLint 10, dependency-cruiser 18, and
  other cross-major upgrades remain separate work, not part of this refresh

### L-002: Make architecture validation pure and blocking

- **Status:** ready after L-001
- **Priority:** P0
- **Problem:** `arch:validate` rewrites `architecture/snapshot.json` and exits
  successfully even when it detects violations; CI warning steps use
  `continue-on-error`
- **Acceptance:** validation is read-only, snapshot generation is a separate
  explicit command, violations fail locally and in CI, and a validation run
  leaves `git status` clean

### L-003: Resolve known structural warnings

- **Status:** ready after L-002
- **Priority:** P1
- **Work:** replace the `SettingsScene` Phaser-only clamp with pure math or an
  approved abstraction; decide whether `PerformanceConfig` should be wired or
  removed
- **Approval:** changes to constants or core still require owner approval under
  `AGENTS.md`
- **Acceptance:** lint, boundary lint, and dependency-cruiser report no warnings

### L-004: Repair documentation currentness

- **Status:** ready
- **Priority:** P1
- **Work:** repair the 30 broken local links in `docs/INDEX.md`; mark or archive
  obsolete ACTIVE_DEVELOPMENT, deployed, old-version, and expired launch-date
  claims without deleting useful historical evidence
- **Acceptance:** Markdown link validation passes and every status surface
  points back to this file for current truth

### L-005: Decide deploy and release posture

- **Status:** pending-owner
- **Priority:** P1
- **Evidence:** Pages is unconfigured; all inspected deploy runs failed or were
  cancelled; CI/CD docs incorrectly describe automatic deployment; the
  tag-triggered release workflow has never had a tag
- **Decision:** either disable/manual-gate deployment and release workflows, or
  separately approve a deployment/release project with first-tag handling
- **Acceptance:** workflows and docs agree; no deployment is claimed without a
  successful run and direct readback

### L-006: Quiet expected-error test output

- **Status:** ready
- **Priority:** P2
- **Work:** capture and assert expected recovery logging so passing tests do not
  resemble failures
- **Acceptance:** all 15 test files pass with legible, intentional output

### L-007: Disposition preserved legacy WIP

- **Status:** pending-owner
- **Priority:** P2
- **Evidence:** remote `get-more-buff` has no PR and is 19 commits ahead/128
  behind `main`; it is internal WIP in this legacy repository, not Wyn der
  Schrank
- **Acceptance:** inventory unique behavior, then record keep/salvage/retire;
  never wholesale merge or delete before review

### L-008: Add repository enforcement

- **Status:** pending-owner
- **Priority:** P2
- **Evidence:** `main` has no protection; public-safe description and topics are
  now populated; two historical workflow records exist remotely without
  default-branch files
- **Acceptance:** required checks and main protection match actual CI; stale
  workflow records have an owner-approved disposition

## Session Closeout

Update this file with commands, warnings, exact branch/PR state, and the next
bounded action. Do not mark the project active or deployed based on a local
branch, old CI, a workflow file, or documentation alone.

### 2026-07-14 manifest alignment

- **Branch/PR:** `fix/meta-inventory-manifest`; PR #13 is the publication record
- **Change:** added the root `project.yaml` v0.1 interop manifest with the
  case-sensitive remote join key, registered owner entity, independent
  canonical role, current status wording, and this file as status authority
- **Manifest validation:** meta-inventory's parser and enum validator report no
  record or graph errors; the standalone producer self-check reports `OK`
- **Repository validation:** tests, lint, boundary lint, architecture health,
  dependency analysis, and production build pass
- **Known warnings:** the existing `SettingsScene` direct-Phaser import and
  orphaned `PerformanceConfig` remain owned by L-003
- **Next bounded action after publication:** hand the accepted default-branch
  SHA to the meta-inventory operator for source-lock reintegration
