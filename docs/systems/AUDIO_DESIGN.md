# WynIsBuff2 Audio Design Specification

**Date**: 2025-10-30
**Version**: 1.0
**Status**: 🎵 Ready for Production

---

## Executive Summary

WynIsBuff2 requires a comprehensive audio library to support its high-energy, skill-to-automation platformer gameplay. This document specifies all sound effects (SFX) and music needed, with expert-level descriptions optimized for AI generation via ElevenLabs and other audio generation services.

**Audio Philosophy**:

- **Energy Escalation**: Sounds should intensify as player skill increases (single → double → triple jump)
- **Buff Aesthetic**: All audio should feel powerful, satisfying, and rewarding
- **Clarity**: Sounds must be distinct enough to provide gameplay feedback
- **Cohesion**: Audio should feel like a unified sonic world

---

## Table of Contents

1. [SFX Categories](#sfx-categories)
2. [Music Categories](#music-categories)
3. [Technical Specifications](#technical-specifications)
4. [ElevenLabs Generation Guide](#elevenlabs-generation-guide)
5. [Priority Implementation](#priority-implementation)

---

## SFX Categories

### 1. Player Movement SFX ⭐ **PRIORITY 1** (Bug #4 Fix)

#### 1.1 Jump Sounds (Triple Jump Mechanic)

The game features a triple jump system where each jump should feel progressively more powerful and rewarding.

##### Jump 1: Standard Jump (Grounded → Air)

**Description**: A clean, punchy jump sound with a slight whoosh. This is the most frequently heard sound in the game, so it must be satisfying but not fatiguing. Think of a soft "puff" of air combined with a light fabric/clothing flutter.

**Audio Characteristics**:

- **Duration**: 0.2-0.3 seconds
- **Frequency Profile**: Mid-range (300-800 Hz base), slight high-frequency whoosh (2-4 kHz)
- **Attack**: Very fast (< 10ms) for instant feedback
- **Decay**: Medium (100-150ms)
- **Sustain**: None
- **Release**: Quick tail (50-100ms)
- **Dynamics**: Medium impact, not overpowering
- **Tone**: Slightly muffled, organic, grounded

**ElevenLabs Prompt**:

```text
A short, punchy platform game jump sound. Soft fabric whoosh with a quick puff of air,
like a character pushing off the ground. Clean, not harsh. Mid-range frequencies,
slightly muffled, organic feel. 0.3 seconds maximum. No echo or reverb.
```

**Variations Needed**: 4 variants (subtle pitch/timbre differences to avoid repetition)

##### Jump 2: Double Jump (Air → Air)

**Description**: An enhanced version of Jump 1 with more energy and a distinct "magical" or "power-up" quality. This should signal to the player that they've activated a special ability. Add a subtle "charge" or "energy" layer to the base jump sound.

**Audio Characteristics**:

- **Duration**: 0.3-0.4 seconds
- **Frequency Profile**: Broader range (300-1200 Hz base), prominent high-frequency sparkle (4-8 kHz)
- **Attack**: Fast (< 15ms) with a slight pre-attack "charge" (tiny reverse whoosh)
- **Decay**: Medium-slow (150-200ms)
- **Sustain**: Minimal
- **Release**: Airy tail with slight shimmer (100-150ms)
- **Dynamics**: Noticeably louder than Jump 1 (+3dB)
- **Tone**: More "synthetic" energy, less organic, hint of electricity or magic

**ElevenLabs Prompt**:

```text
A medium-energy platform game double jump sound. Enhanced whoosh with magical sparkle,
like activating a special ability mid-air. Include subtle energy charge-up (tiny reverse
whoosh), then explosive release. Brighter and more energetic than a regular jump.
High-frequency shimmer. 0.4 seconds. Light airy tail.
```

**Variations Needed**: 4 variants

##### Jump 3: MEGA BUFF Jump (Ultimate Air Jump)

**Description**: The most powerful, satisfying sound in the game. This is the player's ultimate movement ability and should feel MASSIVE. Think explosive, cinematic, hero-moment impact. Combine elements of:

- Rocket boost ignition
- Super Smash Bros. "HOME RUN BAT" hit
- Street Fighter EX sound effect
- Explosive energy burst

**Audio Characteristics**:

- **Duration**: 0.5-0.7 seconds
- **Frequency Profile**: Full spectrum (50 Hz sub-bass rumble to 10+ kHz brilliance)
- **Attack**: Instant explosive impact (< 5ms) with strong transient
- **Decay**: Long dramatic tail (300-400ms)
- **Sustain**: Sustained energy hum (100-200ms)
- **Release**: Long reverberant tail with sparkles (200-300ms)
- **Dynamics**: LOUD (+6-8dB over Jump 1), compressed for maximum impact
- **Tone**: Epic, heroic, explosive, cinematic
- **Layering**: Multiple elements:
  - Sub-bass rumble (explosion)
  - Mid punch (impact)
  - High shimmer (magic/energy)
  - Ascending pitch sweep (power-up feeling)

**ElevenLabs Prompt**:

```text
An EPIC, explosive triple jump sound for a platform game - the ultimate movement ability.
MASSIVE energy burst with cinematic impact. Combine: rocket boost ignition, super smash
explosion, energy beam charge-up. Full frequency spectrum - deep sub-bass rumble, punchy
midrange impact, brilliant high-frequency sparkles. Include ascending pitch sweep for
power-up feel. Dramatic long tail with reverb. 0.7 seconds. Hero moment. BUFF.
```

**Variations Needed**: 4 variants (each should feel slightly different but equally epic)

#### 1.2 Landing Sounds

##### Soft Landing (Low Velocity)

**Description**: Subtle impact sound when landing from a low height. Should feel gentle and natural, like soft shoes touching ground.

**Audio Characteristics**:

- **Duration**: 0.1-0.15 seconds
- **Frequency Profile**: Low-mid range (100-600 Hz)
- **Attack**: Soft (20-30ms)
- **Dynamics**: Quiet, subtle
- **Tone**: Muffled thump, organic

**ElevenLabs Prompt**:

```text
A soft landing sound for a platform game. Gentle footstep impact, like soft shoes touching
ground from a small jump. Muffled thump, low-mid frequencies, organic feel. Very short,
0.15 seconds. No harshness.
```

**Variations Needed**: 3 variants

##### Medium Landing (Medium Velocity)

**Description**: More pronounced impact with a slight dust cloud effect. Player landed from a moderate height.

**Audio Characteristics**:

- **Duration**: 0.15-0.2 seconds
- **Frequency Profile**: Full mid-range (200-1000 Hz) with dust puff high-end (2-4 kHz)
- **Attack**: Medium (15ms)
- **Dynamics**: Medium volume
- **Tone**: Satisfying thump + dusty whoosh

**ElevenLabs Prompt**:

```text
A medium impact landing sound for a platform game. Solid footstep with dust cloud puff.
Mid-range thump with airy high-frequency dust sound. Satisfying but not harsh. 0.2 seconds.
```

**Variations Needed**: 3 variants

##### Hard Landing (High Velocity)

**Description**: Heavy impact with screen shake quality. Player fell from a significant height. Should feel weighty and slightly dangerous.

**Audio Characteristics**:

- **Duration**: 0.25-0.35 seconds
- **Frequency Profile**: Strong low-end (50-300 Hz) with sharp mid transient (500-1500 Hz)
- **Attack**: Very fast (< 10ms) for sharp transient
- **Dynamics**: Loud, impactful
- **Tone**: Heavy, rumbling, with slight metallic ring

**ElevenLabs Prompt**:

```text
A HEAVY impact landing sound for a platform game. Player fell from great height.
Strong low-end rumble with sharp metallic transient. Screen shake quality - deep,
weighty, slightly dangerous. 0.3 seconds with rumbling tail.
```

**Variations Needed**: 3 variants

#### 1.3 Movement Sounds

##### Footstep (Running)

**Description**: Light, quick footsteps for when character is running on ground. Should loop seamlessly and not be fatiguing.

**Audio Characteristics**:

- **Duration**: 0.08-0.12 seconds per step
- **Frequency Profile**: Mid-range (400-1200 Hz)
- **Dynamics**: Quiet, background
- **Tone**: Soft taps, slightly synthetic (not realistic footsteps)

**ElevenLabs Prompt**:

```text
Quick, light footstep sound for platform game running. Soft tap, slightly synthetic
and cartoony (not realistic). Very short, 0.1 seconds. Can loop seamlessly.
Quiet and non-fatiguing.
```

**Variations Needed**: 4 variants (for left/right alternation and variety)

##### Dash/Slide Sound

**Description**: Fast horizontal movement sound, whooshing through air with slight friction/static quality.

**Audio Characteristics**:

- **Duration**: 0.3-0.5 seconds
- **Frequency Profile**: Broad spectrum whoosh
- **Dynamics**: Medium-loud
- **Tone**: Airy with slight static/friction

**ElevenLabs Prompt**:

```text
Fast dash/slide sound for platform game. Quick horizontal whoosh through air with
slight friction or static quality. Speedy, energetic. 0.4 seconds.
```

**Variations Needed**: 2 variants

---

### 2. Collectible SFX

#### 2.1 Small Collectible (Coins/Seeds)

**Description**: Pleasant, light pickup sound. Should be rewarding but not overwhelming since player collects many of these.

**Audio Characteristics**:

- **Duration**: 0.15-0.25 seconds
- **Frequency Profile**: Bright, bell-like (1-4 kHz)
- **Attack**: Instant (< 5ms)
- **Decay**: Fast with pleasant ring
- **Tone**: Crystalline, bell-like, xylophone quality

**ElevenLabs Prompt**:

```text
A pleasant coin/collectible pickup sound for a platform game. Light bell or xylophone
tone, bright and crystalline. Quick, rewarding but not overwhelming. 0.2 seconds with
short ringing tail. Positive, happy feeling.
```

**Variations Needed**: 5 variants (high collection frequency)

#### 2.2 Power-Up Collectible

**Description**: More substantial power-up sound. Should feel like gaining a significant ability or bonus.

**Audio Characteristics**:

- **Duration**: 0.5-0.8 seconds
- **Frequency Profile**: Full spectrum, ascending pitch
- **Attack**: Medium with charge-up (50ms pre-attack)
- **Tone**: Magical, powerful, ascending arpeggio or chord

**ElevenLabs Prompt**:

```text
A significant power-up collection sound for a platform game. Magical energy absorption
with ascending pitch (arpeggio or chord). Full spectrum, bright and powerful. Charge-up
feel, like gaining a new ability. 0.7 seconds with sparkly tail.
```

**Variations Needed**: 3 variants

#### 2.3 Golden Seed (Rare Collectible)

**Description**: Extra special, rare item pickup. Should feel like finding treasure. More elaborate and celebratory than regular collectibles.

**Audio Characteristics**:

- **Duration**: 0.8-1.2 seconds
- **Frequency Profile**: Rich, full spectrum with emphasis on highs (3-10 kHz)
- **Attack**: Slow build (100ms) with sparkle
- **Tone**: Majestic, celebratory, treasure chest opening quality

**ElevenLabs Prompt**:

```text
A rare treasure item pickup sound for a platform game. SPECIAL golden seed collection.
Majestic, celebratory, like opening a treasure chest. Rich full spectrum with sparkly
highs. Slow magical build-up, then satisfying payoff. 1 second. Makes player feel lucky.
```

**Variations Needed**: 2 variants

---

### 3. Combat/Enemy SFX

#### 3.1 Enemy Hit (Player Damages Enemy)

**Description**: Satisfying impact feedback when player successfully hits enemy.

**Audio Characteristics**:

- **Duration**: 0.1-0.2 seconds
- **Frequency Profile**: Mid-range punch (400-1500 Hz) with slight crunch
- **Attack**: Instant
- **Tone**: Punchy, crunchy, satisfying

**ElevenLabs Prompt**:

```text
A satisfying enemy hit sound for a platform game. Punchy impact when player damages enemy.
Mid-range crunch with slight "squish" quality. Quick, 0.15 seconds. Feels rewarding.
```

**Variations Needed**: 4 variants

#### 3.2 Player Hit (Player Takes Damage)

**Description**: Negative feedback sound indicating damage taken. Should be immediately recognizable as "bad" but not annoying.

**Audio Characteristics**:

- **Duration**: 0.2-0.3 seconds
- **Frequency Profile**: Harsh mid-range (600-2000 Hz) with slight downward pitch bend
- **Attack**: Fast
- **Tone**: Painful, negative, slightly metallic

**ElevenLabs Prompt**:

```text
A player damage sound for a platform game. Negative feedback - player got hit. Harsh
mid-range with downward pitch bend, slightly metallic or synthetic. Quick, 0.25 seconds.
Clear "danger" feeling but not annoying. "Oof" or "ouch" quality without voice.
```

**Variations Needed**: 3 variants

#### 3.3 Enemy Defeat

**Description**: Enemy destroyed/defeated sound. Should feel victorious and final.

**Audio Characteristics**:

- **Duration**: 0.3-0.5 seconds
- **Frequency Profile**: Full spectrum with explosion-like quality
- **Attack**: Fast transient then decay
- **Tone**: Explosive, victorious, "poof" or small explosion

**ElevenLabs Prompt**:

```text
An enemy defeat sound for a platform game. Small explosion or "poof" when enemy is destroyed.
Full spectrum, victorious feeling. Quick explosive transient then fadeout. 0.4 seconds.
Satisfying finality.
```

**Variations Needed**: 3 variants

---

### 4. Boss/Special Enemy SFX

#### 4.1 Boss Appearance

**Description**: Dramatic, intimidating sound when boss enters the arena. Should create tension and excitement.

**Audio Characteristics**:

- **Duration**: 2-3 seconds
- **Frequency Profile**: Deep sub-bass (40-100 Hz) with menacing mid-range
- **Attack**: Slow build with crescendo
- **Tone**: Ominous, dramatic, epic

**ElevenLabs Prompt**:

```text
A dramatic boss entrance sound for a platform game. EPIC, intimidating arrival. Deep
sub-bass rumble building to menacing crescendo. Cinematic, creates tension and excitement.
2.5 seconds. Makes player go "oh no..." then "let's do this!"
```

**Variations Needed**: 1 per boss type

#### 4.2 Boss Attack Charge

**Description**: Warning sound that boss is about to unleash a powerful attack. Gives player time to react.

**Audio Characteristics**:

- **Duration**: 0.8-1.5 seconds
- **Frequency Profile**: Rising pitch (200 Hz to 2000 Hz)
- **Attack**: Gradual build
- **Tone**: Rising tension, energy building, danger imminent

**ElevenLabs Prompt**:

```text
A boss attack charge-up sound for a platform game. Rising tension, energy building,
danger warning. Ascending pitch from low to high over 1.2 seconds. Gives player time
to react. Synthesized energy beam charge quality.
```

**Variations Needed**: 2 variants

#### 4.3 Boss Defeat

**Description**: Massive, satisfying conclusion sound when boss is defeated. Should feel like a major accomplishment.

**Audio Characteristics**:

- **Duration**: 3-5 seconds
- **Frequency Profile**: Full spectrum, explosive
- **Attack**: Huge transient
- **Tone**: EPIC explosion, victorious, celebratory, heroic

**ElevenLabs Prompt**:

```text
A MASSIVE boss defeat sound for a platform game. EPIC victory moment. Huge explosion
followed by triumphant energy dissipation. Full spectrum, cinematic, heroic. Player
just achieved something major. 4 seconds. Includes sub-bass rumble, explosive midrange,
and sparkly high-frequency celebration.
```

**Variations Needed**: 1 per boss type

---

### 5. UI/Menu SFX

#### 5.1 Menu Navigate

**Description**: Subtle sound when hovering over or moving between menu options.

**Audio Characteristics**:

- **Duration**: 0.05-0.1 seconds
- **Frequency Profile**: High-frequency tick (2-6 kHz)
- **Dynamics**: Quiet
- **Tone**: Clean, precise, digital

**ElevenLabs Prompt**:

```text
A subtle menu navigation sound for a game UI. Quick, clean tick when hovering over menu
items. High-frequency, precise, digital. Very short, 0.08 seconds. Not annoying with
rapid selection changes.
```

**Variations Needed**: 2 variants

#### 5.2 Menu Select/Confirm

**Description**: Positive confirmation sound when player makes a selection.

**Audio Characteristics**:

- **Duration**: 0.15-0.25 seconds
- **Frequency Profile**: Bright, pleasant (1-4 kHz)
- **Tone**: Affirming, positive, bell-like

**ElevenLabs Prompt**:

```text
A menu selection confirmation sound for a game UI. Positive, affirming tone when player
confirms a choice. Bright, bell-like quality. 0.2 seconds. Makes player feel good about
their decision.
```

**Variations Needed**: 2 variants

#### 5.3 Menu Cancel/Back

**Description**: Neutral sound when backing out or canceling an action.

**Audio Characteristics**:

- **Duration**: 0.1-0.15 seconds
- **Frequency Profile**: Mid-range, slightly descending
- **Tone**: Neutral, not negative, just "going back"

**ElevenLabs Prompt**:

```text
A menu cancel/back sound for a game UI. Neutral tone when backing out of menus.
Slightly descending pitch, mid-range. Quick, 0.12 seconds. Not negative, just indicates
returning to previous screen.
```

**Variations Needed**: 1 variant

#### 5.4 Error/Invalid Action

**Description**: Gentle negative feedback when player tries invalid action.

**Audio Characteristics**:

- **Duration**: 0.2-0.3 seconds
- **Frequency Profile**: Low buzz or dull thud (150-500 Hz)
- **Tone**: Negative but not harsh, "buzzer" quality

**ElevenLabs Prompt**:

```text
An error/invalid action sound for a game UI. Gentle negative feedback, like a soft buzzer.
Low frequency dull buzz. Communicates "can't do that" without being annoying. 0.25 seconds.
```

**Variations Needed**: 1 variant

---

### 6. Environmental/Ambient SFX

#### 6.1 Checkpoint Activation

**Description**: Rewarding, reassuring sound when player reaches a save point.

**Audio Characteristics**:

- **Duration**: 1-1.5 seconds
- **Frequency Profile**: Warm, full spectrum with emphasis on mids (400-2000 Hz)
- **Tone**: Healing, restorative, safe, checkpoint "ping"

**ElevenLabs Prompt**:

```text
A checkpoint activation sound for a platform game. Rewarding, reassuring save point reached.
Warm healing tone with magical sparkle. Progress saved, player is safe. 1.2 seconds.
Restorative, calming quality. Makes player feel accomplished.
```

**Variations Needed**: 2 variants

#### 6.2 Door/Gate Open

**Description**: Mechanical opening sound for unlocking new areas.

**Audio Characteristics**:

- **Duration**: 1-2 seconds
- **Frequency Profile**: Full spectrum with mechanical elements (200-3000 Hz)
- **Tone**: Satisfying mechanical movement, progress unlocking

**ElevenLabs Prompt**:

```text
A door or gate opening sound for a platform game. Satisfying mechanical unlocking and
opening. New area access unlocked. Can include: lock click, mechanism turning, heavy
door sliding open. 1.5 seconds. Feels like progress.
```

**Variations Needed**: 2 variants

#### 6.3 Platform Activate/Move

**Description**: Moving platform or mechanical element activation sound.

**Audio Characteristics**:

- **Duration**: 0.5-1 second (can loop for continuous movement)
- **Frequency Profile**: Mid-range mechanical (300-1500 Hz)
- **Tone**: Smooth mechanical hum, gears, machinery

**ElevenLabs Prompt**:

```text
A moving platform activation sound for a platform game. Mechanical mechanism starting up.
Smooth hum or gear sound, loopable. Mid-range frequencies. 0.8 seconds. Not harsh,
can play continuously without fatigue.
```

**Variations Needed**: 2 variants

---

## Music Categories

### 1. Main Menu Theme

**Style**: Ambient/Electronic, Upbeat but not frantic

**Description**: The first music players hear. Should immediately establish the game's tone: energetic, fun, slightly futuristic. Think of a blend between:

- Celeste's menu music (ambient, welcoming)
- Splatoon's menu music (energetic, stylized)
- Synth-wave aesthetic with organic elements

**Musical Characteristics**:

- **Tempo**: 100-120 BPM (Medium energy, not rushed)
- **Key**: Major key (C major, G major, or D major for positive, uplifting feel)
- **Instrumentation**:
  - Synth pad foundation (warm, inviting)
  - Melodic lead (bell-like synth or electric piano)
  - Subtle bass (not overpowering)
  - Light percussion (optional, can be absent for calmer feel)
- **Structure**: Loopable 32-64 bar phrase, no jarring transitions
- **Mood**: Welcoming, optimistic, slightly mysterious
- **Duration**: 2-3 minute loop

**ElevenLabs/MusicGen Prompt**:

```text
Upbeat electronic game menu music. Medium tempo (110 BPM), major key. Ambient synth pads
with melodic bell-like lead. Welcoming and optimistic. Loopable, no jarring transitions.
Blend of Celeste ambient style and Splatoon energy. Slightly futuristic, fun. 2 minutes.
```

---

### 2. Level Music (Biome-Specific)

#### 2.1 Protein Plant Biome

**Style**: Organic Electronic, Bioluminescent, Growth Theme

**Description**: The first level environment. Players navigate through a luminous greenhouse/bio-facility where protein is grown. Music should feel:

- Alive and growing (organic pulsing)
- Slightly mysterious (scientific facility)
- Energetic but not aggressive
- Natural + technological fusion

**Musical Characteristics**:

- **Tempo**: 128-140 BPM (Energetic platforming pace)
- **Key**: E major or A major (bright, natural feeling)
- **Instrumentation**:
  - Plucky synth arpeggios (representing growth/DNA)
  - Organic percussion (wood blocks, shakers)
  - Pulsing sub-bass (heartbeat of the facility)
  - Bell-like melody (bioluminescence)
  - Breath-like pads (life, growth)
- **Structure**: Loopable with occasional build-ups and breakdowns
- **Mood**: Curious, alive, hopeful, slightly futuristic
- **Duration**: 3-4 minute loop with variation

**ElevenLabs/MusicGen Prompt**:

```text
Organic electronic platformer level music. 135 BPM, E major. Bioluminescent greenhouse theme -
alive and growing. Plucky synth arpeggios, organic wood percussion, pulsing sub-bass like a
heartbeat. Bell-like melody, breath-like pads. Natural + technological fusion. Energetic but
mysterious. Loopable with build-ups. 3 minutes.
```

#### 2.2 Factory Zone (Future)

**Style**: Industrial Electronic, Mechanical, High Energy

**Musical Characteristics**:

- **Tempo**: 140-160 BPM (Fast, intense)
- **Key**: Minor key (D minor, E minor) for industrial feel
- **Instrumentation**: Heavy mechanical percussion, driving bassline, metallic leads
- **Mood**: Intense, dangerous, mechanical

**ElevenLabs/MusicGen Prompt**:

```text
Industrial electronic platformer music. 150 BPM, D minor. Heavy mechanical factory theme.
Metallic percussion, driving bassline, mechanical rhythms. Intense and dangerous.
Loopable. 3 minutes.
```

#### 2.3 Crystal Cavern (Future)

**Style**: Ambient Electronic, Ethereal, Echo-Heavy

**Musical Characteristics**:

- **Tempo**: 100-120 BPM (Slower, more atmospheric)
- **Key**: Major or modal (Lydian mode for magical quality)
- **Instrumentation**: Crystalline bells, deep echoing pads, sparse percussion
- **Mood**: Mysterious, magical, vast

**ElevenLabs/MusicGen Prompt**:

```text
Ethereal ambient platformer music. 110 BPM, Lydian mode. Crystal cavern theme with
bell-like tones and deep echoing pads. Mysterious and magical. Sparse percussion.
Vast, spacious. Loopable. 3 minutes.
```

---

### 3. Boss Battle Music

**Style**: Epic Electronic, Intense, Progressive

**Description**: Boss encounters are climactic moments. Music should:

- Build tension and excitement
- Feel dangerous but empowering
- Have clear phases (intro → battle → victory)
- Make player feel heroic when they win

**Musical Characteristics**:

- **Tempo**: 140-170 BPM (High energy, heart-pumping)
- **Key**: Minor key (A minor, E minor) for tension, can shift to relative major for victory
- **Instrumentation**:
  - Driving, aggressive bassline (ominous, powerful)
  - Epic orchestral-style synth hits (brass stabs, string swells)
  - Complex drum patterns (urgency)
  - Heroic melody (player is the hero facing the challenge)
- **Structure**:
  - Intro (0-10 seconds): Dramatic build-up
  - Battle Phase 1 (30-60 seconds): Intense combat loop
  - Battle Phase 2 (30-60 seconds): Higher intensity (higher pitch, more layers)
  - Victory transition (optional 10-second triumphant ending)
- **Mood**: Epic, intense, dangerous, heroic, "final showdown"
- **Duration**: 2-3 minute loop

**ElevenLabs/MusicGen Prompt**:

```text
Epic boss battle music for a platform game. 160 BPM, A minor. INTENSE electronic combat theme.
Driving aggressive bassline, epic synth brass hits, complex drums. Heroic melody over dangerous
rhythm. Two-phase structure with intensity escalation. Final showdown energy. Makes player
feel like a hero facing a legendary foe. 2.5 minutes loopable.
```

---

### 4. Victory/Success Jingles

#### 4.1 Level Complete Jingle

**Description**: Short, triumphant celebration when player completes a level.

**Musical Characteristics**:

- **Duration**: 5-8 seconds (short, not skippable, must be satisfying every time)
- **Key**: Major key (C major for universally happy feeling)
- **Structure**: Rising triumphant melody → satisfying resolution
- **Instrumentation**: Bright synth lead, fanfare-style
- **Mood**: Victorious, accomplished, "you did it!"

**ElevenLabs/MusicGen Prompt**:

```text
A short level complete victory jingle for a platform game. 6 seconds. C major.
Triumphant rising melody with satisfying resolution. Bright synth fanfare style.
Makes player feel accomplished. Happy and victorious.
```

#### 4.2 Boss Defeated Jingle

**Description**: More elaborate victory music for defeating a boss.

**Musical Characteristics**:

- **Duration**: 8-12 seconds
- **Key**: Major key
- **Structure**: Epic triumphant phrase with final punctuation
- **Mood**: EPIC victory, major accomplishment

**ElevenLabs/MusicGen Prompt**:

```text
An EPIC boss defeat victory jingle for a platform game. 10 seconds. Major key.
Elaborate triumphant fanfare with heroic melody. Player defeated a major foe.
Cinematic, celebratory, makes player feel like a champion.
```

---

### 5. Ambient/Transitional Music

#### 5.1 Hub World Music

**Description**: Calm, exploratory music for the hub area where players select levels and upgrades.

**Musical Characteristics**:

- **Tempo**: 80-100 BPM (Relaxed)
- **Key**: Major key (warm, safe)
- **Instrumentation**: Soft pads, gentle melody, minimal percussion
- **Mood**: Safe, contemplative, "home base"
- **Duration**: 2-3 minute loop

**ElevenLabs/MusicGen Prompt**:

```text
Calm hub world music for a platform game. 90 BPM, major key. Relaxed and safe home base
theme. Soft pads, gentle melody, minimal percussion. Contemplative and peaceful.
Player can take their time here. 2.5 minutes loopable.
```

#### 5.2 Game Over Music

**Description**: Sad but not discouraging. Player failed but should want to try again.

**Musical Characteristics**:

- **Duration**: 10-15 seconds
- **Key**: Minor key
- **Structure**: Descending melody → gentle resolution (not harsh)
- **Mood**: Disappointed but hopeful, "try again"

**ElevenLabs/MusicGen Prompt**:

```text
A gentle game over theme for a platform game. 12 seconds. Minor key. Sad but not harsh.
Descending melody with hopeful resolution. Player failed but music says "you can do this,
try again." Not discouraging.
```

---

## Technical Specifications

### Audio Format Standards

**For In-Game Use**:

- **Format**: OGG Vorbis (best compression for web games)
- **Sample Rate**: 44.1 kHz (CD quality)
- **Bit Depth**: 16-bit
- **Bitrate**:
  - SFX: 128-192 kbps (high quality, small files)
  - Music: 192-256 kbps (higher quality for music)
- **Channels**: Stereo for music, Mono acceptable for short SFX

**Fallback Formats** (for broader compatibility):

- MP3 (if OGG not supported)
- WAV (for editing, not for deployment)

### File Naming Convention

Follow manifest.json structure:

**SFX**:

```text
sfx_[category]_[action]_[variant].ogg

Examples:
sfx_player_jump1_01.ogg
sfx_player_jump2_03.ogg
sfx_player_land_soft_02.ogg
sfx_collectible_coin_01.ogg
sfx_boss_defeat_pulsar.ogg
```

**Music**:

```text
music_[context]_[location/type].ogg

Examples:
music_menu_main.ogg
music_level_protein_plant.ogg
music_boss_battle_01.ogg
music_victory_level_complete.ogg
```

### Audio Processing Standards

**Normalization**:

- Peak normalize SFX to -3 dBFS (leaves headroom)
- RMS normalize music to -16 LUFS (for consistent perceived loudness)

**Limiting/Compression**:

- Use gentle limiting on music to prevent clipping (max -0.5 dBFS)
- Use moderate compression on SFX for consistent impact

**EQ/Filtering**:

- High-pass filter at 40 Hz (remove sub-rumble that can cause distortion)
- Gentle low-pass filter at 18 kHz (remove unnecessary ultra-highs)

**Fade In/Out**:

- All looping music should have 0.5-1 second crossfade for seamless loops
- SFX should have natural decay, no artificial fade unless artistically necessary

---

## ElevenLabs Generation Guide

### Service Overview

**ElevenLabs Audio Generation** provides:

- High-quality SFX generation from text prompts
- Music generation capabilities
- Multiple model options for different needs
- Commercial licensing for generated audio

### API Integration Specifications

**Endpoint**: `/text-to-sound-effects` (for SFX) or `/text-to-music` (for music)

**Key Parameters**:

```json
{
  "text": "[Prompt from this document]",
  "duration_seconds": [Specified in prompt],
  "prompt_influence": 0.3,  // How much to follow prompt vs. AI creativity
  "model_id": "eleven_turbo_v2.5"  // Recommended model
}
```

### Recommended Generation Workflow

1. **Prototype Pass**:
    - Generate 2-3 variants of each sound rapidly
    - Use lower quality settings for speed
    - Review and select best candidates

2. **Refinement Pass**:
    - Regenerate selected candidates with refined prompts
    - Use highest quality settings
    - Generate additional variations of winners

3. **Post-Processing**:
    - Normalize audio levels
    - Trim silence from start/end
    - Apply EQ/compression if needed
    - Convert to OGG Vorbis format
    - Rename per naming convention

### Cost Estimation

**ElevenLabs Pricing** (as of 2024):

- Starter: $5/month (~10 minutes of audio)
- Creator: $22/month (~60 minutes of audio)
- Pro: $99/month (~360 minutes of audio)

**Estimated Project Cost**:

- Total SFX needed: ~150-200 individual sounds × 0.5 seconds avg = ~1.5 minutes total
- Total Music needed: ~8 tracks × 3 minutes avg = ~24 minutes total
- **Total**: ~25-30 minutes of audio
- **Recommended Plan**: Creator ($22/month) should be sufficient for 2-3 generation passes

**Budget Tracking**:

- Implement BudgetGuard pattern from asset generation framework
- Track generation cost per asset category
- Set soft cap at $20/day, $50/month as per ASSET_GENERATION_MIGRATION_PLAN.md

---

## Priority Implementation

### Phase 1: Critical Path (Bug #4 Fix) ⭐

**Goal**: Fix Bug #4 - Add missing jump sounds

**Audio Needed**:

1. Jump 1 sound (4 variants) - CRITICAL
2. Jump 2 sound (4 variants) - CRITICAL
3. Jump 3 sound (4 variants) - CRITICAL
4. Landing sounds (soft, medium, hard - 3 variants each) - HIGH

**Timeline**: 1-2 days
**Cost**: ~$2-3 (12 SFX sounds × ~0.3 seconds each)

**Implementation Steps**:

1. Generate jump sounds using ElevenLabs with prompts from Section 1.1
2. Post-process and normalize
3. Add to manifest.json:

    ```json
    {
        "type": "audio",
        "key": "sfxJump1A",
        "path": "audio/sfx/sfx_player_jump1_01.ogg"
    }
    ```

4. Update ParticleManager.js to play sounds alongside particle effects
5. Test in-game and adjust volumes
6. Generate remaining landing sounds

---

### Phase 2: Core Gameplay SFX

**Goal**: Complete all player interaction sounds

**Audio Needed**:

1. Collectible sounds (small, power-up, golden seed)
2. Combat sounds (enemy hit, player hit, enemy defeat)
3. Footstep/movement sounds

**Timeline**: 3-5 days
**Cost**: ~$3-5

---

### Phase 3: Enemy & Boss SFX

**Goal**: Add enemy and boss audio

**Audio Needed**:

1. Boss appearance, attack charge, defeat
2. Special enemy sounds
3. Environmental sounds

**Timeline**: 3-5 days
**Cost**: ~$3-5

---

### Phase 4: UI & Menu SFX

**Goal**: Complete UI audio

**Audio Needed**:

1. Menu navigation sounds
2. Confirmation/cancel sounds
3. Error/feedback sounds

**Timeline**: 1-2 days
**Cost**: ~$1-2

---

### Phase 5: Music (Foundation)

**Goal**: Add main menu and first level music

**Audio Needed**:

1. Main Menu theme
2. Protein Plant level music
3. Level complete jingle

**Timeline**: 5-7 days
**Cost**: ~$5-8

---

### Phase 6: Music (Complete)

**Goal**: Finish all music tracks

**Audio Needed**:

1. Boss battle music
2. Hub world music
3. Additional level themes
4. Game over music

**Timeline**: 7-10 days
**Cost**: ~$8-12

---

## Total Project Estimates

### Audio Asset Count

- **SFX**: ~150-200 individual sounds
- **Music**: ~8-10 tracks
- **Total**: ~160-210 audio assets

### Total Cost

- **Phase 1** (Critical): $2-3
- **Phases 2-4** (Gameplay): $7-12
- **Phases 5-6** (Music): $13-20
- **Total**: $22-35 (fits within Creator plan at $22/month for 2 months)

### Total Timeline

- **Phase 1** (Bug #4): 1-2 days
- **Complete SFX**: 2-3 weeks
- **Complete Music**: 3-4 weeks
- **Total**: 5-7 weeks for full audio implementation

---

## Quality Assurance

### Testing Checklist

For each audio asset:

- [ ] Correct duration (not too long or short)
- [ ] Proper format (OGG Vorbis, 44.1 kHz, 16-bit)
- [ ] Normalized to specified loudness (-3 dBFS for SFX, -16 LUFS for music)
- [ ] No clipping or distortion
- [ ] Clean start and end (no pops or clicks)
- [ ] Loops seamlessly (for looping music)
- [ ] Named correctly per convention
- [ ] Added to manifest.json
- [ ] Tested in-game at various volume levels
- [ ] Sounds good on both headphones and speakers
- [ ] Fits the game's aesthetic and mood

### In-Game Audio Mixing

**Volume Hierarchy** (relative levels):

- Music: 100% (adjustable by player)
- SFX: 120% (slightly louder than music for clarity)
- UI sounds: 80% (quieter, less intrusive)

**Ducking** (optional):

- Reduce music volume by 20% during intense gameplay moments
- Reduce music volume by 30% during boss battles for SFX clarity

---

## Related Documentation

- **ASSET_GENERATION_MIGRATION_PLAN.md**: Framework for AI asset generation
- **AI_ASSET_GENERATION_FRAMEWORK_REPORT.md**: Analysis of asset generation capabilities
- **BUG_INVESTIGATION_REPORT.md**: Bug #4 details (missing jump sounds/particles)
- **docs/systems/EffectsSystem.md**: ParticleManager integration for sound + visuals

---

## Appendix A: Alternative Services

If ElevenLabs is insufficient for certain needs:

### For SFX

**Bark (Suno AI)**:

- **Pros**: Free, local generation, good for voice-like sounds
- **Cons**: Limited quality compared to ElevenLabs
- **Use Case**: Simple SFX, prototyping

**Sonogen (Stability AI)**:

- **Pros**: High quality, good for realistic sounds
- **Cons**: API access limited
- **Use Case**: Realistic environmental sounds

### For Music

**MusicGen (Meta)**:

- **Pros**: Free, local generation, good quality
- **Cons**: Requires local setup, slower generation
- **Use Case**: Background music, ambient tracks

**AIVA**:

- **Pros**: Specifically designed for game music
- **Cons**: Subscription required, less flexibility
- **Use Case**: Orchestral or cinematic music

**Recommendation**: Start with ElevenLabs for consistency, use alternatives only if specific needs arise.

---

## Appendix B: Prompt Engineering Tips

### For Best ElevenLabs Results

1. **Be Specific About Duration**: Always specify exact seconds
2. **Use Comparative References**: "Like [famous game/song]" helps AI understand
3. **Describe Feeling, Not Just Sound**: "Makes player feel accomplished" guides emotion
4. **Technical Terms**: Use "sub-bass", "transient", "attack", "decay" for precision
5. **Iterate**: Generate multiple versions, refine prompts based on results
6. **Layer Descriptions**: Describe multiple elements ("rumble + impact + sparkle")

### Common Pitfalls

- **Too Vague**: "Jump sound" → Too generic
- **Too Complex**: Describing 10 different elements → AI gets confused
- **Wrong Context**: Forgetting to mention "for a platform game" → Gets wrong style
- **No Duration**: AI chooses random length → Inconsistent results

---

**Status**: ✅ Complete and Ready for Implementation
**Last Updated**: 2025-10-30
**Version**: 1.0
**Maintainer**: Claude Code AI Assistant

---

**Next Steps**:

1. Review and approve this specification
2. Set up ElevenLabs API access
3. Begin Phase 1: Generate jump sounds (Bug #4 fix)
4. Integrate audio playback into ParticleManager
5. Continue through phases 2-6 as resources allow
