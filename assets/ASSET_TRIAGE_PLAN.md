# Asset Triage Plan

Purpose: reduce orphaned assets and keep the working set focused without losing history.

## Process

1) Inventory orphans
   - Run: `bun run validate-assets`
   - Export list to a working note (copy from console)

2) Decide for each path
   - Keep (in use soon): add to `assets/manifest.json`, then `bun run generate-assets`
   - Archive (not in use): move to `assets/archive/` preserving subfolders
   - Remove (accidental/temporary): delete

3) Verify
   - Re-run: `bun run validate-assets`
   - Ensure orphans drop; no new missing assets

## Initial Candidates (from latest validation)

These look unused and suitable to archive unless slated for near-term use:

- `spritesheets/animations/characters/enemies/skeleton1/**`
- `spritesheets/animations/characters/enemies/skeleton2/**`
- `spritesheets/animations/characters/enemies/skeleton3/**`

Rationale: Not referenced by `assets/manifest.json` and not used by current scenes. If gameplay plans include enemies soon, consider adding to manifest instead of archiving.

## Guidelines

- Prefer manifest entries when the asset is on the roadmap for the next milestone.
- Prefer archiving if the timeline is uncertain; reversal is trivial.
- Never reference raw asset paths in code; always use generated constants.

## Next Steps

- Confirm near-term enemy animation needs with design
- If unused, move skeleton animation folders to `assets/archive/` in one batch
- Re-run validation and update this plan
