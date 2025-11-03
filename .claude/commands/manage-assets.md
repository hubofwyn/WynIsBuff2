# Manage Assets

Automated asset management workflow for WynIsBuff2.

## Usage
`/manage-assets "Asset operation description"`

## Workflow
1. **Analysis Phase** (architecture-guardian)
   - Scan asset directory structure
   - Validate manifest.json entries
   - Check for missing or unused assets
   - Analyze asset organization

2. **Processing Phase**
   - **asset-optimizer**: Compress and optimize images
   - **manifest-updater**: Update manifest.json automatically
   - **constant-generator**: Run `bun run generate-assets`
   - **validator**: Verify all assets load correctly

3. **Integration Phase** (architecture-guardian)
   - Update imports to use new constants
   - Remove hardcoded asset paths
   - Verify barrel exports are correct
   - Check scene asset loading

4. **Validation Phase**
   - Test asset loading in all scenes
   - Verify performance impact
   - Check memory usage
   - Validate mobile compatibility

## Asset Operations Supported
- Adding new assets to manifest.json
- Optimizing existing assets
- Reorganizing asset directory structure
- Generating asset constants
- Cleaning up unused assets
- Validating asset references

## Quality Gates
- ✅ All assets referenced through constants
- ✅ No magic strings in asset loading
- ✅ Manifest.json properly structured
- ✅ Asset optimization completed
- ✅ Mobile-friendly file sizes
- ✅ Proper asset categorization

## Example Usage
```
/manage-assets "Add new enemy spritesheet and generate animation constants"
/manage-assets "Optimize all background images for mobile performance"  
/manage-assets "Clean up unused particle effect assets"
```

This command automatically maintains the asset management system according to WynIsBuff2's architecture.