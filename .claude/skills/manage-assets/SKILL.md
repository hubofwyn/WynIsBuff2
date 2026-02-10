# Manage Assets

Automated asset management workflow for WynIsBuff2.

## Usage

`/manage-assets "Asset operation description"`

## Workflow

1. **Analysis Phase** (architecture-guardian)
   - Scan asset directory structure
   - Validate manifest.json entries
   - Check for missing or unused assets

2. **Processing Phase**
   - Update `/assets/manifest.json` as needed
   - Run `bun run generate-assets` to regenerate constants
   - Run `bun run validate-assets` to verify

3. **Integration Phase** (architecture-guardian)
   - Update imports to use new constants
   - Remove any hardcoded asset paths
   - Verify barrel exports are correct

4. **Validation Phase**
   - Run `bun test`
   - Verify all assets referenced through `ImageAssets.*` / `AudioAssets.*` constants

## Supported Operations

- Adding new assets to manifest.json
- Reorganizing asset directory structure
- Generating asset constants
- Cleaning up unused assets
- Validating asset references

## Rules

- All assets referenced through generated constants only
- No magic strings in asset loading
- Assets.js is auto-generated - never edit manually
- Asset files use kebab-case naming
