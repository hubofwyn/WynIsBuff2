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
  `6a5f91cd54ec1bd6798b468ed36f15f24575c925`
- **Verified:** 2026-07-14
- **GitHub queue:** no issues; PR #11 open and mergeable but five months stale
- **Deployment:** no GitHub Pages configuration or verified deployment; latest
  default-branch deploy failed at Setup Pages
- **Release:** no tags or releases
- **Tests:** 15 test files pass; expected-recovery cases emit noisy stack traces
- **Structural checks:** one direct-Phaser warning in
  `src/scenes/SettingsScene.js`; one orphan warning for
  `src/constants/PerformanceConfig.js`
- **Security:** `bun audit --audit-level=high` reports 14 high advisories on
  current `main`; old green CI does not clear this current finding

## Next-Agent Work Order

Work on a fresh topic branch. Preserve existing topic branches and PR commits.
Do not deploy merely to change inventory or portfolio wording.

### L-001: Refresh dependency/security work

- **Status:** ready
- **Priority:** P0
- **Starting point:** inspect and rebase or supersede PR #11; do not merge its
  February 2026 result unchanged
- **Compatible lane:** update Vite within 7.x beyond the affected `<=7.3.4`
  range and refresh affected transitive lock entries; re-run audit and all gates
- **Major lane:** review ESLint, dependency-cruiser, knip, lint-staged, and other
  majors separately
- **Invariant:** Phaser 4.2.1 is not an update target here; Phaser 4 belongs to
  the separate rebuild
- **Acceptance:** zero high audit findings or a documented upstream-only
  exception, reproducible Bun pin policy, tests/lint/dependency/build gates
  green, and a current PR description

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
- **Evidence:** `main` has no protection; description/topics are empty; two
  historical workflow records exist remotely without default-branch files
- **Acceptance:** required checks and main protection match actual CI; stale
  workflow records and public-safe repository metadata have an owner-approved
  disposition

## Session Closeout

Update this file with commands, warnings, exact branch/PR state, and the next
bounded action. Do not mark the project active or deployed based on a local
branch, old CI, a workflow file, or documentation alone.
