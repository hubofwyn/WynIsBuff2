# Jump Audio Testing Guide - Bug #4 Verification

**Status**: Ready for Testing
**Dev Server**: http://localhost:8080/
**Bug**: #4 - Missing Jump SFX
**Implementation**: Complete - 12 jump sounds integrated

---

## 🎯 Test Objectives

1. Verify all 12 jump sounds play correctly
2. Confirm different sounds for Jump 1, Jump 2, Jump 3
3. Validate random variant selection (4 variants per jump type)
4. Monitor system health during audio playback
5. Ensure no console errors or warnings

---

## 🔍 Pre-Test Setup (Observability)

### 1. Open Browser Developer Console
- **Chrome/Edge**: F12 or Cmd+Option+I (Mac)
- **Firefox**: F12 or Cmd+Option+K (Mac)

### 2. Navigate to Game
```
http://localhost:8080/
```

### 3. Initialize Observability API
Open browser console and run:
```javascript
// Get system health summary
window.debugAPI.getSummary()

// Expected initial output:
{
  overallHealth: 100,
  status: "healthy",
  stats: {
    totalLogs: ~50-100,
    recentErrors: 0,
    droppedLogs: 0
  },
  subsystemErrors: {},
  topErrors: []
}
```

---

## 🎮 Audio Testing Procedure

### Phase 1: Basic Jump Sounds (Jump 1)

**Actions**:
1. Start game from main menu
2. Load Level 1
3. Press **Space** or **Up Arrow** to jump (single jump only)
4. Jump **5 times** consecutively

**Expected Audio**:
- ✅ Clean, punchy basic jump sound
- ✅ Slight whoosh/spring effect
- ✅ Bright, crisp attack with quick decay
- ✅ **Different variants** should play (4 total variants)
  - Variant A: Standard tone
  - Variant B: Warmer tone
  - Variant C: Higher pitch
  - Variant D: Lower pitch

**Observability Check**:
```javascript
// Check for jump events in logs
window.debugAPI.getLogs({ code: 'GAME_PLAYER_JUMP', limit: 10 })

// Expected output shows jumpNumber: 1
[
  {
    code: 'GAME_PLAYER_JUMP',
    level: 'DEV',
    subsystem: 'scene',
    data: { jumpNumber: 1, ... }
  }
]

// Verify no audio errors
window.debugAPI.getLogs({ subsystem: 'audio', level: 'ERROR' })
// Should return: []
```

---

### Phase 2: Enhanced Jump Sounds (Jump 2)

**Actions**:
1. Jump once (basic jump)
2. While in air, press **Space** again for double jump
3. Repeat **5 times** to hear variants

**Expected Audio**:
- ✅ Enhanced double jump with magical sparkle energy
- ✅ Medium energy burst with bright shimmer
- ✅ Frequency range includes high-end sparkle harmonics (8000-13000 Hz)
- ✅ **Different magical variants** should play:
  - Variant A: Standard magical sparkle
  - Variant B: Brighter sparkle harmonics
  - Variant C: Warmer magical with bell-like quality
  - Variant D: Crystalline glass-like sparkle

**Observability Check**:
```javascript
// Check for Jump 2 events
window.debugAPI.getLogs({ code: 'GAME_PLAYER_JUMP', limit: 5 })

// Expected output shows jumpNumber: 2
// Verify audio system is healthy
window.debugAPI.getSummary().subsystems.audio
// Should show: { health: 100, status: "healthy", ... }
```

---

### Phase 3: MEGA BUFF Jump Sounds (Jump 3)

**Actions**:
1. Jump once (basic jump)
2. Double jump (enhanced jump)
3. While in air, press **Space** third time for triple jump
4. Repeat **5 times** to hear all EPIC variants

**Expected Audio**:
- ✅ **EPIC EXPLOSIVE** triple jump with MASSIVE cinematic impact
- ✅ Combines: rocket boost + super smash explosion + energy charge-up
- ✅ Full spectrum:
  - Deep sub-bass rumble (40-100 Hz) - **feel the BUFF**
  - Punchy midrange impact (200-2000 Hz)
  - Brilliant high-frequency sparkles (8000-16000 Hz)
- ✅ Ascending pitch sweep for power-up feel
- ✅ Dramatic reverb tail (hero moment)
- ✅ **Different BUFF variants**:
  - Variant A: Balanced explosive burst
  - Variant B: More explosive emphasis
  - Variant C: Energy beam focus (laser-like)
  - Variant D: **MAXIMUM BASS POWER** (earth-shaking)

**Observability Check**:
```javascript
// Check for Jump 3 events (THE BUFF MOMENTS)
window.debugAPI.getLogs({ code: 'GAME_PLAYER_JUMP', limit: 5 })

// Expected output shows jumpNumber: 3
// Monitor for any warnings or errors
window.debugAPI.getSummary()
// overallHealth should still be 100
```

---

## 📊 Post-Test Observability Analysis

### 1. System Health Check
```javascript
// Get comprehensive system status
const summary = window.debugAPI.getSummary()

console.log('Overall Health:', summary.overallHealth)      // Should be: 100
console.log('Status:', summary.status)                     // Should be: "healthy"
console.log('Recent Errors:', summary.stats.recentErrors)  // Should be: 0
console.log('Audio Subsystem:', summary.subsystems.audio)  // Should be: healthy
```

### 2. Audio Event Verification
```javascript
// Count jump events by type
const jump1Events = window.debugAPI.getLogs({
  code: 'GAME_PLAYER_JUMP',
  limit: 100
}).filter(log => log.data?.jumpNumber === 1).length

const jump2Events = window.debugAPI.getLogs({
  code: 'GAME_PLAYER_JUMP',
  limit: 100
}).filter(log => log.data?.jumpNumber === 2).length

const jump3Events = window.debugAPI.getLogs({
  code: 'GAME_PLAYER_JUMP',
  limit: 100
}).filter(log => log.data?.jumpNumber === 3).length

console.log(`Jump 1 events: ${jump1Events}`)
console.log(`Jump 2 events: ${jump2Events}`)
console.log(`Jump 3 events: ${jump3Events}`)
```

### 3. Error Pattern Detection
```javascript
// Check for any repeating errors
window.debugAPI.getSummary().topErrors
// Should return: [] (empty - no errors)

// Check for audio warnings
window.debugAPI.getLogs({
  subsystem: 'audio',
  level: 'WARN'
})
// Should NOT contain: "No SFX found for key 'jump'"
```

### 4. Export Test Results
```javascript
// Export full observability report for documentation
const report = window.debugAPI.exportJSON()
console.log('Test Report Generated:', report)

// Can also copy to clipboard:
copy(JSON.stringify(window.debugAPI.getSummary(), null, 2))
```

---

## ✅ Success Criteria

### Audio Quality
- [ ] All jump sounds play without clipping or distortion
- [ ] Volume levels are consistent across all variants
- [ ] No audio dropouts or glitches
- [ ] Sounds match their descriptions (basic, magical, EPIC)

### Variant Randomization
- [ ] Jump 1: Heard at least 3 of 4 variants in 5 jumps
- [ ] Jump 2: Heard at least 3 of 4 variants in 5 jumps
- [ ] Jump 3: Heard at least 3 of 4 variants in 5 jumps

### Technical Integration
- [ ] No console errors related to audio
- [ ] No "SFX not found" warnings
- [ ] `overallHealth: 100` maintained throughout testing
- [ ] Audio subsystem status: "healthy"
- [ ] GAME_PLAYER_JUMP events logged with correct jumpNumber

### Game Feel
- [ ] Jump 1 feels responsive and satisfying
- [ ] Jump 2 feels enhanced/magical compared to Jump 1
- [ ] Jump 3 feels **EPIC and BUFF** - a true power moment
- [ ] Audio feedback enhances player experience

---

## 🐛 Troubleshooting

### No Sound Playing

**Check 1: Browser Audio**
```javascript
// Verify AudioManager initialized
AudioManager.getInstance()
// Should return: AudioManager instance with settings
```

**Check 2: Asset Loading**
```javascript
// Check if jump sounds loaded
window.debugAPI.getLogs({ code: 'AUDIO_LOADING_SFX', subsystem: 'audio' })
// Should show logs for sfx_jump1_01 through sfx_jump3_04
```

**Check 3: Browser Console**
- Look for red errors related to audio file loading
- Check Network tab for failed OGG file requests
- Verify files exist: `assets/audio/sfx/player/sfx_player_jump*.ogg`

### Wrong Sound Playing

**Check jumpNumber in events**:
```javascript
window.debugAPI.getLogs({ code: 'GAME_PLAYER_JUMP', limit: 10 })
// Verify jumpNumber matches expected jump level (1, 2, or 3)
```

### Audio Warnings Still Appear

**Check for old "jump" key warning**:
```javascript
window.debugAPI.getLogs({
  subsystem: 'audio',
  level: 'WARN'
})
// If still seeing "No SFX found for key 'jump'", clear browser cache
```

---

## 📝 Test Report Template

After completing testing, document results:

```markdown
## Jump Audio Test Results

**Date**: 2025-10-31
**Tester**: [Your Name]
**Build**: main branch (commit 6ba5efc)

### Audio Playback
- Jump 1 (basic): ✅ / ❌
- Jump 2 (enhanced): ✅ / ❌
- Jump 3 (MEGA BUFF): ✅ / ❌

### Variant Randomization
- Variants detected: [list which variants heard]

### Observability Metrics
- Overall Health: [value]
- Audio Subsystem Status: [status]
- Total Errors: [count]
- Jump Events Logged: [count]

### Issues Found
[Describe any issues or unexpected behavior]

### Notes
[Any additional observations]
```

---

## 🎉 Expected Final State

After successful testing, you should observe:

1. **Audio System**: 12 jump sounds playing correctly
2. **Observability**: Health score 100, no errors
3. **Game Feel**: Enhanced player experience with audio feedback
4. **Bug #4**: ✅ **RESOLVED** - Jump SFX fully implemented

---

**Ready to Test!** 🎮🔊

Open http://localhost:8080/ and follow the testing procedure above.
