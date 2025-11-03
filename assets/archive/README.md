# Assets Archive

This directory stores assets that are not currently part of the active game build.

Use this folder to keep the working set lean while preserving files that may be used later.

## Policy

- Keep (in use soon)
  - Add to `assets/manifest.json`
  - Run `bun run generate-assets`
  - Reference via generated constants (no raw paths)

- Archive (not in use)
  - Move files under `assets/archive/`
  - Preserve structure where useful
  - Optionally add a short note here with context

- Remove (accidental/temporary)
  - Delete if confirmed unused

See also: ASSET_MANAGEMENT.md (Orphaned Assets Policy)

