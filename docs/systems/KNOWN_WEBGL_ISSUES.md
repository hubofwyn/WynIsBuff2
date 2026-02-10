# Known WebGL Issues - WynIsBuff2

**Last Updated**: November 2, 2025  
**Status**: Documented - Non-Critical

---

## WebGL Texture Upload Warnings

### Issue Description

During asset loading in the Preloader scene, you may see WebGL warnings in the browser console:

```text
WebGL: INVALID_VALUE: texImage2D: bad image data
```

### Root Cause

These warnings occur during Phaser's internal texture processing (`_processTexture`) when:

1. WebP images are being uploaded to WebGL
2. Images may not have an alpha channel
3. Phaser's texture processing pipeline encounters format mismatches

### Impact

**✅ NON-CRITICAL** - These are warnings, not errors:

- Game loads and runs correctly
- All textures display properly
- No performance impact
- No gameplay impact

### Technical Details

**Stack Trace Pattern:**

```text
_processTexture @ phaser.js
createResource @ phaser.js
WebGLTextureWrapper2 @ phaser.js
createTexture2D @ phaser.js
createTextureFromSource @ phaser.js
```

**Affected Assets:**

- WebP images (especially logo files)
- Non-power-of-two textures
- Images without alpha channels

### Why This Happens

1. **WebP Format**: WebP images can have different internal formats (RGB vs RGBA)
2. **Phaser Processing**: Phaser tries to determine the best WebGL format automatically
3. **Format Mismatch**: Temporary mismatch during upload causes warning
4. **Recovery**: Phaser recovers and uploads successfully on retry

### Attempted Fixes

We've tried several approaches:

1. ❌ **Mipmap Disabling** - Doesn't affect `texImage2D` errors
2. ❌ **Texture Filter Override** - Applied after upload
3. ❌ **WebGL Context Patching** - Can't intercept Phaser's internal calls
4. ✅ **Error Tracking** - Added observability to monitor (non-intrusive)

### Current Approach

**Accept and Monitor:**

- These are browser warnings, not application errors
- Phaser handles the recovery internally
- We track via observability system for monitoring
- No user-facing impact

### Monitoring

Use the observability system to track if these become problematic:

```javascript
// Check for WebGL-related warnings
window.LOG.export().logs.filter(l => 
    l.subsystem === 'assets' && 
    l.code === 'PRELOADER_WEBGL_ERROR'
)

// Get statistics
window.getLogStats()
```

### When to Investigate Further

Investigate if you see:

- ❌ Textures not displaying correctly
- ❌ Game crashes during asset loading
- ❌ Performance degradation
- ❌ Errors (not warnings) in console
- ❌ WebGL context loss

### Workarounds (If Needed)

If these warnings become problematic:

1. **Convert WebP to PNG** - More compatible but larger files
2. **Ensure Power-of-Two Dimensions** - 512x512, 1024x1024, etc.
3. **Add Alpha Channel** - Convert RGB to RGBA format
4. **Use Texture Atlas** - Combine multiple images

### Related Issues

- AudioContext autoplay warnings (expected browser behavior)
- Howler.js HTML5 Audio pool warnings (expected with many sounds)

### References

- [Phaser WebGL Renderer](https://newdocs.phaser.io/docs/3.90.0/Phaser.Renderer.WebGL)
- [WebGL texImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D)
- [WebP Format Specification](https://developers.google.com/speed/webp)

---

## Other Known WebGL Issues

### None Currently

All other WebGL issues have been resolved or documented above.

---

**Maintained by**: Development team  
**Review frequency**: When WebGL errors change or increase
