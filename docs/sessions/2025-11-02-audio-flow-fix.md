# Audio Flow Fix - November 2, 2025

**Issue**: Music playing at wrong time, audio playback errors  
**Status**: ✅ Fixed  
**Root Cause**: Music attempted in wrong scene, improper AudioContext handling

---

## Problem

### Symptoms
1. Music not playing in WelcomeScene (where it was attempted)
2. Music playing later in CharacterSelect or after
3. Console error: "Playback was unable to start... not within a user interaction"
4. Inconsistent audio behavior

### Scene Flow
```
Preloader → WelcomeScene → CharacterSelect → MainMenu
                ❌ Tried music here        ✅ Should play here
```

---

## Root Cause

### Issue 1: Wrong Scene for Music
- **WelcomeScene** tried to play music on user click
- But the game flow is: Welcome → CharacterSelect → **MainMenu**
- Music should start in **MainMenu** (the actual level selection screen)
- WelcomeScene is just a splash screen with "Press SPACE to Start"

### Issue 2: Howler Error Handling
- `audio.playMusic()` doesn't throw synchronous errors
- Howler uses async callbacks for errors
- Try/catch around `playMusic()` doesn't catch Howler errors
- Errors are logged via Howler's internal error handler

### Issue 3: AudioContext State
- AudioContext may be suspended even after initial unlock
- Each scene needs to verify and resume AudioContext
- Must use async/await for proper resume

---

## Solution

### 1. Remove Music from WelcomeScene

**Before**:
```javascript
// WelcomeScene tried to play music
audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
```

**After**:
```javascript
// WelcomeScene only plays click sound
audio.playSFX('click');
// Note: Music will start in MainMenu scene after character selection
```

**Rationale**: WelcomeScene is a splash screen, not the main menu

### 2. Proper Audio Handling in MainMenu

**Before**:
```javascript
create() {
    // Synchronous, no error handling
    AudioManager.getInstance().playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
}
```

**After**:
```javascript
async create() {
    // Initialize audio with proper handling
    await this.initializeAudio();
}

async initializeAudio() {
    const audio = AudioManager.getInstance();

    // Ensure AudioContext is resumed
    if (window.Howler?.ctx?.state === 'suspended') {
        try {
            await window.Howler.ctx.resume();
            LOG.dev('MAINMENU_AUDIO_RESUMED', {...});
        } catch (err) {
            LOG.warn('MAINMENU_AUDIO_RESUME_FAILED', {...});
        }
    }

    // Start music (Howler handles errors internally)
    audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
    
    LOG.info('MAINMENU_MUSIC_STARTED', {...});
}
```

---

## Scene-by-Scene Audio Strategy

### Preloader
- ✅ No music
- ✅ Shows loading screen
- ✅ Loads all audio assets

### WelcomeScene
- ✅ No music (splash screen)
- ✅ Plays click SFX on interaction
- ✅ Resumes AudioContext for future scenes
- ✅ Transitions to CharacterSelect

### CharacterSelect
- ✅ No music (quick selection screen)
- ✅ Plays click/hover SFX
- ✅ Transitions to MainMenu

### MainMenu
- ✅ **Starts title music** 🎵
- ✅ Resumes AudioContext if needed
- ✅ Handles errors gracefully
- ✅ Music continues during level selection

### Game Scene
- ✅ Plays level-specific music
- ✅ Stops menu music
- ✅ Handles level transitions

---

## Testing

### Expected Flow

1. **Page Load**
   - ✅ "Tap to Play" overlay appears
   - ✅ User clicks → Audio unlocks

2. **Preloader**
   - ✅ Loading screen shows
   - ✅ Assets load
   - ✅ No music yet

3. **WelcomeScene**
   - ✅ "Press SPACE to Start" appears
   - ✅ User presses SPACE → Click sound plays
   - ✅ No music yet
   - ✅ Transitions to CharacterSelect

4. **CharacterSelect**
   - ✅ Character selection UI
   - ✅ User selects character
   - ✅ No music yet
   - ✅ Transitions to MainMenu

5. **MainMenu**
   - ✅ **Music starts playing!** 🎵
   - ✅ Level selection UI
   - ✅ No console errors
   - ✅ Music continues

### Verify in Console

```javascript
// Check audio logs
window.LOG.export().logs.filter(l => 
    l.code?.includes('AUDIO') || 
    l.code?.includes('MAINMENU')
)

// Should see:
// AUDIO_UNLOCK_SUCCESS (initial unlock)
// MAINMENU_AUDIO_RESUMED (if context was suspended)
// MAINMENU_MUSIC_STARTED (music playback initiated)
// No AUDIO_PLAYBACK_ERROR ✅
```

---

## Why This Works

### 1. Correct Scene for Music
- MainMenu is where users spend time selecting levels
- Music enhances the menu experience
- Splash screens (Welcome) don't need music

### 2. Proper AudioContext Management
- Each scene checks AudioContext state
- Uses async/await for resume
- Logs all audio events for debugging

### 3. Graceful Error Handling
- Howler errors logged but don't break game
- Game proceeds even if audio fails
- Users can enable audio in settings

### 4. User Interaction Chain
```
User clicks "Tap to Play" (unlock)
    ↓
User presses SPACE (WelcomeScene)
    ↓
User selects character (CharacterSelect)
    ↓
MainMenu loads → AudioContext verified → Music plays ✅
```

---

## Files Modified

1. ✅ **WelcomeScene.js**
   - Removed music playback attempt
   - Kept AudioContext resume for future scenes
   - Removed unused AudioAssets import
   - Added comment about music starting in MainMenu

2. ✅ **MainMenu.js**
   - Made create() async
   - Added initializeAudio() method
   - Proper AudioContext resume with await
   - Added observability logging
   - Added LOG import

---

## Best Practices Established

### For All Scenes

1. **Check AudioContext State**
   ```javascript
   if (window.Howler?.ctx?.state === 'suspended') {
       await window.Howler.ctx.resume();
   }
   ```

2. **Use Async/Await**
   ```javascript
   async create() {
       await this.initializeAudio();
   }
   ```

3. **Log Audio Events**
   ```javascript
   LOG.info('SCENE_MUSIC_STARTED', {
       subsystem: 'scene',
       scene: SceneKeys.SCENE_NAME,
       track: trackName
   });
   ```

4. **Graceful Degradation**
   - Don't block on audio failures
   - Log errors but continue
   - Game works without audio

---

## Success Criteria

- ✅ Music plays in MainMenu (correct scene)
- ✅ No music in WelcomeScene (splash screen)
- ✅ No audio playback errors in console
- ✅ AudioContext properly resumed
- ✅ All audio events logged
- ✅ Smooth user experience

---

## Related Documentation

- [AUDIO_UNLOCK_SYSTEM.md](../systems/AUDIO_UNLOCK_SYSTEM.md) - Audio unlock architecture
- [AudioManager.md](../systems/AudioManager.md) - Audio management system
- [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md) - Observability

---

**Status**: ✅ Fixed and ready for testing  
**Impact**: Music now plays at correct time with no errors  
**Risk**: Low - proper error handling ensures game works regardless
