## 1  Project Context & Targets

| Item                            | Answer                                                                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine / Framework**          | ✓ Phaser 3.88.0 + Rapier 0.14.0, built with Vite 5.3.1                                                                                                                                                                              |
| **Plug‑ins / middleware**       | Build‑time: `vite-plugin-pwa`, `vite-plugin-compression`, `vite-plugin-inspect` • Runtime: phaser3‑rex‑plugins (UI + virtual joystick), phaser‑pathfinding (A\*), **Howler.js** (central AudioManager), **XState** (state machines) |
| **Primary Platforms**           | Desktop Chrome / Firefox / Edge (latest)                                                                                                                                                                                            |
| **Mobile browser support**      | ✅ Yes – tested on iOS 16+ & Android 12+, with virtual buttons & touch menus                                                                                                                                                         |
| **PWA goals**                   | ✅ Full installable offline experience (see PWA section)                                                                                                                                                                             |
| **Typical player bandwidth**    | ≥ 20 Mbps (no hard cap)                                                                                                                                                                                                             |
| **Performance / bundle budget** | Core JS/CSS ≤ 3 MB gzipped (≈ 8–9 MB raw) • First render < 2 s desktop / < 4 s mid‑phone • Runtime 60 FPS desktop / 30 FPS mobile • Cached assets < 35 MB                                                                           |

---

## 2  Audio & Music Requirements

### 2.1 Asset Inventory

| Asset type            | File name                  | Length          | Loop | Notes / mood              |
| --------------------- | -------------------------- | --------------- | ---- | ------------------------- |
| Background – Title    | `protein‑pixel‑anthem.mp3` | 60 s            | Yes  | Pump‑up gym intro         |
| Background – In‑Level | `hyper‑buff‑blitz.mp3`     | 180 s           | Yes  | Up‑tempo chiptune‑metal   |
| Jump SFX              | `jump.ogg`                 | 0.18 s          | No   | Square‑wave lift‑off blip |
| **Land SFX**          | `land.ogg`                 | 0.22 s          | No   | Weighty thud              |
| **Pickup SFX**        | `pickup.ogg`               | 0.25 s          | No   | Sparkle ding              |
| **UI Click / Hover**  | `click.ogg`, `hover.ogg`   | 0.12 s / 0.14 s | No   | Dry tick / soft plink     |

*All derived audio (MP3/OGG) are stored under `assets/sounds/`. Original WAV sources (48 kHz, 24-bit) may be kept in `assets/audio_src/` (tracked via Git LFS).*

### 2.2 Technical Preferences

| Prompt           | Answer                                   |
| ---------------- | ---------------------------------------- |
| Audio formats    | Ship **OGG + MP3 fallback** (Safari/iOS) |
| Decode strategy  | Stream BGM; decode‑on‑load SFX           |
| Spatial audio    | 2‑D stereo pan only                      |
| Dynamic layering | **No** (fixed stems)                     |

### 2.3 Volume & Mixing

| Channel       | Default                               | Slider step |
| ------------- | ------------------------------------- | ----------- |
| Master        | 0.8                                   | 0.05        |
| Music         | 0.7                                   | 0.05        |
| SFX           | 0.9                                   | 0.05        |
| Mute shortcut | **Yes – “M” key toggles master mute** |             |

---

## 3  Pause / Settings / Keybindings

### 3.1 Pause Flow

| Prompt        | Answer                              |
| ------------- | ----------------------------------- |
| Hotkey(s)     | `ESC` (primary), `START` on gamepad |
| Halt on pause | Physics, tweens, timers, AI         |
| Keep running  | Music fades to 50 % but continues   |

### 3.2 Pause Overlay Design

| Prompt       | Answer                                        |
| ------------ | --------------------------------------------- |
| Layout style | Blurred BG + centered card                    |
| Navigation   | **Keyboard, mouse, gamepad D‑pad, and touch** |

### 3.3 Settings to Expose

| Setting                     | UI       | Persist? | Notes                                                  |            |     |
| --------------------------- | -------- | -------- | ------------------------------------------------------ | ---------- | --- |
| Master / Music / SFX volume | Slider   | Yes      | 0–100 %                                                |            |     |
| Keybinding – Jump           | Rebind   | Yes      | Default `Space` / `A` button                           |            |     |
| Keybinding – Move L / R     | Rebind   | Yes      | Defaults `A`                                           | `D` or `←` | `→` |
| Keybinding – Pause          | Rebind   | Yes      | Default `ESC`                                          |            |     |
| **Graphics quality**        | Dropdown | Yes      | **Low / Medium / High** affects particle count & bloom |            |     |
| Color‑blind palette         | Toggle   | Yes      | High‑contrast palette swap                             |            |     |
| High‑contrast UI            | Toggle   | Yes      | Enlarged fonts + bold outlines                         |            |     |

---

## 4  Persistence (GameStateManager)

| Item              | Answer                                                     |
| ----------------- | ---------------------------------------------------------- |
| Storage backend   | Browser **`localStorage`** (JSON blob per slot)            |
| Save versioning   | **Semantic “schemaVersion”; migrate or reset on mismatch** |
| Reset‑to‑defaults | Yes – button in settings                                   |

---

## 5  Accessibility & UX

| Feature            | Default                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Minimum font size  | 18 px                                                                       |
| Color‑blind mode   | **Yes – three alternative palettes (Deuteranopia, Protanopia, Tritanopia)** |
| High‑contrast mode | **Yes – toggle in settings**                                                |
| Subtitle captions  | **Yes – optional on‑screen text for key SFX (explosions, checkpoints)**     |

---

## 6  Development & Asset Pipeline

| Prompt                     | Answer                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| Preferred DAW              | **Reaper** + chipsynth & 8‑bit plug‑ins                                     |
| Binary assets in Git LFS   | **Yes** – WAV, RPP, PSD/ASE, spritesheets                                   |
| Bundler                    | Vite 5.3.1 (ESBuild)                                                        |
| Audio compression at build | FFmpeg script (320 kbps MP3 + OGG q=5)                                      |
| Automated tests            | Pause‑resume integrity • Settings (save/load) • **Audio channel leak test** |

---

## 7  Open Questions / Risks

| Topic                  | Answer                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| Mobile Safari autoplay | **Yes – require first user interaction before starting audio**                    |
| Licensing constraints  | **No – all music/SFX are original or CC‑0**                                       |
| Localization plans     | **Ship English at launch; architecture externalizes strings for future ES/FR/JP** |


