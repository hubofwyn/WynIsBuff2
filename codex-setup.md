## 1  Purpose

Provide Codex CLI with project‑specific context so it can:

1. Load the right long‑lived knowledge (`baseline/`).
2. Work under the correct **role** (see §3) without manual prompting.
3. Keep tasks small, traceable, and aligned with active sprints.
4. Prevent accidental divergence from established architecture or design goals.

---

## 2  Required Startup Sequence

Codex must follow these steps on every new session:

1. `source .codex/run-codex.sh <role>` — loads env vars and helpers.
2. Read `baseline/current-foundation.md` (core architecture).
3. Read **only** the _goal_ files listed in `.codex/goals/active-goals.txt`.
4. Open all files in `.codex/tasks/` with the label `READY`.
5. Display a **concise session plan** (≤ 8 bullets) and wait for approval.

---

## 3  Role Mapping & Defaults

| Role slug        | Human owner      | Default groups                | Notes                                      |
| ---------------- | ---------------- | ----------------------------- | ------------------------------------------ |
| `game-architect` | Jeffrey (lead)   | read edit browser command mcp | Use for high‑level refactors & new systems |
| `phaser-coder`   | Wyn (with dad)   | read edit browser command mcp | Day‑to‑day feature coding                  |
| `game-designer`  | Jeffrey (design) | read edit browser command mcp | Gameplay iterations                        |
| `physics-expert` | Jeffrey          | read edit command mcp         | Physics tuning & performance               |

_Default role_ when none is specified: **`phaser-coder`**.

---

## 4  Task File Lifecycle

```
.codex/tasks/<id>-<slug>.md
```

| Field       | Meaning                                       |
| ----------- | --------------------------------------------- |
| `Status:`   | `READY` → `IN‑PROG` → `AWAIT‑REVIEW` → `DONE` |
| `Owner:`    | one role slug                                 |
| `Scope:`    | "feature", "bugfix", "chore", "research"      |
| `Estimate:` | hours (whole numbers)                         |

> Codex may **only** pick up tasks marked `READY`. When finishing, it **must** update `Status:` and append a brief change‑log.

---

## 5  Coding & Commit Rules

- Follow **global standards** (§4 in home instructions) **plus**:
    - **Namespace prefix** all new JS files under `src/scenes/` with the sprint id, e.g., `s04_LevelBuilder.js`.
    - Keep PRs ≤ 400 LOC unless architect role signs off.
    - Include a **`Test Plan:`** block in the commit body.

---

## 6  Safety Checks Before `git push`

1. `npm run lint && npm run test` – must pass.
2. Bundled size delta < +1 % unless justified.
3. No new warnings in browser console.

Codex should abort the push and request human review if any check fails.

---

## 7  Extending This File

Add new sections as needed; keep numbering stable. Use the table below to track changes.
