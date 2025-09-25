# Complete Asset Generation Directive: First-Wave Visual Pack

## Overview
Generate a comprehensive visual asset pack covering the first two biomes (Protein Plant, Metronome Mines), Factory Floor hub, and optional Sky Gym biome, including all sprites, UI elements, and parallax-ready backdrops.

## Critical Specifications
- **Dimensions**: All assets 1024×1024 PNG (Power-of-Two compliant)
- **Alpha Channel Rules**:
  - **Sprites/UI**: `alpha: true` (transparent background)
  - **Backdrops**: `alpha: false` (solid background, no transparency)
- **Budget**: Enforce $20 ceiling via BudgetGuard
- **Style**: Flat stylized 2D art, strong readable silhouettes, high-contrast palette, no photorealism

## Phase 1: Setup Validation

### 1.1 Add Validator Script
Create `asset-generation/tools/validate-shots.mjs`:

```javascript
#!/usr/bin/env node
// Mini validator for shots.json
// Ensures each entry has key/kind/prompt and validates sprite/backdrop prompt rules.

import fs from "node:fs";
import path from "node:path";

const SHOTS_FILE = path.join(process.cwd(), "asset-generation", "shots.json");

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(SHOTS_FILE)) {
    fail(`shots.json not found at ${SHOTS_FILE}`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(SHOTS_FILE, "utf8"));

  if (!Array.isArray(data)) {
    fail("shots.json must be an array of shot objects");
    return;
  }

  let errors = 0;
  for (const [i, shot] of data.entries()) {
    if (!shot.key || !shot.kind || !shot.prompt) {
      console.error(`❌ Entry ${i} missing key/kind/prompt`);
      errors++;
      continue;
    }
    if (!["sprite", "backdrop"].includes(shot.kind)) {
      console.error(`❌ Entry ${shot.key} has invalid kind: ${shot.kind}`);
      errors++;
    }
    // Rule: sprites must mention transparent background
    if (shot.kind === "sprite" && !/transparent background/i.test(shot.prompt)) {
      console.error(`⚠️ Sprite ${shot.key} prompt missing "transparent background"`);
      errors++;
    }
    // Rule: backdrops must NOT mention transparency
    if (shot.kind === "backdrop" && /transparent/i.test(shot.prompt)) {
      console.error(`⚠️ Backdrop ${shot.key} prompt should not mention transparency`);
      errors++;
    }
    // Rule: should mention size for consistency
    if (!/1024/.test(shot.prompt)) {
      console.warn(`ℹ️ ${shot.key} prompt does not explicitly mention 1024x1024`);
    }
  }

  if (errors > 0) {
    fail(`Validation failed with ${errors} error(s).`);
  } else {
    console.log(`✅ Validation passed: ${data.length} entries checked.`);
  }
}

main();
```

### 1.2 Update Package Configuration
Add to `asset-generation/package.json`:

```json
{
  "scripts": {
    "gfx:validate": "node tools/validate-shots.mjs",
    "pre-gfx:all": "npm run gfx:validate",
    "pre-gfx:thumbs": "npm run gfx:validate",
    "pre-gfx:score": "npm run gfx:validate",
    "pre-gfx:final": "npm run gfx:validate"
  }
}
```

## Phase 2: Deploy Shot Definitions

Replace or merge into `asset-generation/shots.json`:

```json
[
  /* =========================
     Protein Plant — Parallax
     ========================= */
  {
    "key": "backdrop_protein_sky",
    "kind": "backdrop",
    "prompt": "Luminous greenhouse sky with glowing bioluminescent spores drifting upward, subtle green/blue gradient, hazy light beams, flat stylized 2D art, strong readable silhouette, high-contrast palette, no photorealism, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_protein_mid",
    "kind": "backdrop",
    "prompt": "Silhouettes of massive plant stalks and nutrient tanks, semi-transparent mist look (but no alpha), industrial vines wrapping machinery, flat stylized 2D art, strong readable silhouette, high-contrast palette, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_protein_fore",
    "kind": "backdrop",
    "prompt": "Detailed nutrient pipes, glass domes, plant pods with faint glow, bold outlines, crisp shapes, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_protein_fg",
    "kind": "backdrop",
    "prompt": "Interactive catwalk rails, metal platforms, glowing consoles, close-up leaf silhouettes, bold outlines, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },

  /* =========================
     Metronome Mines — Parallax
     ========================= */
  {
    "key": "backdrop_mines_sky",
    "kind": "backdrop",
    "prompt": "Dark cavern ceiling with glowing crystal veins, ambient amber/purple lighting, deep shadows, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_mines_mid",
    "kind": "backdrop",
    "prompt": "Large rock formations, mining scaffolds, silhouettes of conveyor belts and hanging chains, flat stylized 2D art, strong silhouettes, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_mines_fore",
    "kind": "backdrop",
    "prompt": "Detailed minecart rails, pulley systems, lit lamps, gear silhouettes, bold lines, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_mines_fg",
    "kind": "backdrop",
    "prompt": "Close-up machinery pieces, warning signs, spark particles motif (painted), rubble at the bottom edge, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },

  /* =========================
     Factory Floor (Hub) — Parallax
     ========================= */
  {
    "key": "backdrop_factory_sky",
    "kind": "backdrop",
    "prompt": "High industrial ceiling with skylight beams, faint smoke haze, muted steel palette, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_factory_mid",
    "kind": "backdrop",
    "prompt": "Rows of robotic arms, silhouette conveyors, large rotating gears in shadow, flat stylized 2D art, strong silhouettes, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_factory_fore",
    "kind": "backdrop",
    "prompt": "Detailed conveyor belts, control panels, hazard lights glowing red/orange (painted), bold outlines, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_factory_fg",
    "kind": "backdrop",
    "prompt": "Close-up pipes, vents with steam wisps (painted), glowing caution stripes, safety rails, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },

  /* =========================
     Sky Gym — Parallax (Bonus Biome)
     ========================= */
  {
    "key": "backdrop_skygym_sky",
    "kind": "backdrop",
    "prompt": "Bright open sky with stylized clouds and faint aurora-like streaks, clean pastel gradient, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_skygym_mid",
    "kind": "backdrop",
    "prompt": "Floating platforms and hanging banners, silhouette gym equipment suspended by cables, flat stylized 2D art, strong silhouettes, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_skygym_fore",
    "kind": "backdrop",
    "prompt": "Detailed ropes, dumbbell silhouettes, metal trusses, glowing energy monitors, bold outlines, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },
  {
    "key": "backdrop_skygym_fg",
    "kind": "backdrop",
    "prompt": "Close-up training equipment, glowing floor tiles, interactive obstacles, bold outlines, flat stylized 2D art, solid background, no transparency, parallax-ready composition, 1024x1024"
  },

  /* =========================
     Boss Sprites (transparent)
     ========================= */
  {
    "key": "sprite_the_clumper_boss",
    "kind": "sprite",
    "prompt": "The Clumper boss — heavy mass silhouette with industrial plating, readable at small size, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_pulsar_boss",
    "kind": "sprite",
    "prompt": "Pulsar boss — pulsing core with radiating arcs, rhythmic energy motif, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_the_bulk_boss",
    "kind": "sprite",
    "prompt": "The Bulk boss — massive armored form with momentum cues, strong silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },

  /* =========================
     Player Poses (transparent)
     ========================= */
  {
    "key": "sprite_wyn_idle",
    "kind": "sprite",
    "prompt": "Hero Wyn — idle stance, subtle glow, strong readable silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_wyn_run",
    "kind": "sprite",
    "prompt": "Hero Wyn — running pose, dynamic lean, motion hint lines, strong silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_wyn_jump",
    "kind": "sprite",
    "prompt": "Hero Wyn — triple-jump apex pose, energized rim light, strong silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },

  /* =========================
     Tiles & Props (transparent)
     ========================= */
  {
    "key": "sprite_platform_industrial",
    "kind": "sprite",
    "prompt": "Industrial platform tile with beveled metal edges and bolt heads, high readability, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_pipe_straight",
    "kind": "sprite",
    "prompt": "Straight pipe segment with subtle wear, clear connectors, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_pipe_corner",
    "kind": "sprite",
    "prompt": "Corner pipe elbow with flange, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_crate_heavy",
    "kind": "sprite",
    "prompt": "Heavy crate with hazard stripes and reinforced metal corners, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_sign_warning",
    "kind": "sprite",
    "prompt": "Warning sign plaque with triangular caution icon, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },

  /* =========================
     Collectibles (transparent)
     ========================= */
  {
    "key": "sprite_coin",
    "kind": "sprite",
    "prompt": "Glowing coin with buff arm emblem, neon rim light, high readability, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_buff_dna",
    "kind": "sprite",
    "prompt": "Buff DNA vial with green energy swirl, readable silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, crisp edges, 1024x1024"
  },
  {
    "key": "sprite_grit_shard",
    "kind": "sprite",
    "prompt": "Grit shard crystal, faceted with inner glow, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_boss_emblem",
    "kind": "sprite",
    "prompt": "Boss gate emblem token, dramatic shape with metallic sheen, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },

  /* =========================
     Hazards (transparent)
     ========================= */
  {
    "key": "sprite_spikes",
    "kind": "sprite",
    "prompt": "Triangular floor spikes cluster, clear danger silhouette, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_laser_emitter",
    "kind": "sprite",
    "prompt": "Compact laser emitter with glowing diode and warning glyphs, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_crusher",
    "kind": "sprite",
    "prompt": "Heavy vertical crusher head with scuffed metal and hazard chevrons, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "sprite_shock_grid",
    "kind": "sprite",
    "prompt": "Electrified floor grid tile with arcing sparks motif, bold outline, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },

  /* =========================
     Particles / FX (transparent)
     ========================= */
  {
    "key": "particle_flare_small",
    "kind": "sprite",
    "prompt": "Small radial flare for pickups/impacts, clean shape, no soft halos, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "particle_dust",
    "kind": "sprite",
    "prompt": "Dust puff particle cluster, stylized blobs for jump/land effects, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "particle_spark",
    "kind": "sprite",
    "prompt": "Spark streaks cluster for hits/rails, crisp edges, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },

  /* =========================
     UI (transparent)
     ========================= */
  {
    "key": "ui_icon_coin",
    "kind": "sprite",
    "prompt": "UI coin icon matching collectible coin style, clean silhouette, high readability at 32–64 px, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "ui_icon_dna",
    "kind": "sprite",
    "prompt": "UI DNA icon matching buff DNA vial style, clean silhouette, high readability at 32–64 px, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "ui_icon_grit",
    "kind": "sprite",
    "prompt": "UI grit shard icon matching shard style, clean silhouette, high readability, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "ui_button_primary",
    "kind": "sprite",
    "prompt": "Primary UI button plate with subtle bevel and glow, neutral styling to skin via tinting, high readability, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  },
  {
    "key": "ui_badge_srank",
    "kind": "sprite",
    "prompt": "S-rank badge trophy icon, bold laurels and star, clean silhouette, centered object, transparent background, flat stylized 2D sprite, 1024x1024"
  }
]
```

## Phase 3: Execute Generation Pipeline

### 3.1 Validate First
```bash
npm run --prefix asset-generation gfx:validate
```
✅ Must pass before proceeding

### 3.2 Run Full Generation (Resume-Safe)
```bash
npm run gfx:all -- --budget 20 --concurrency 3 --n 4
```

**Parameters:**
- `--budget 20`: Enforces $20 ceiling via BudgetGuard
- `--concurrency 3`: Parallel processing limit
- `--n 4`: Generate 4 variants per shot for selection

**Resume Safety:**
- If interrupted, simply rerun the same command
- Generator skips completed work and reuses existing scores
- No duplicate costs incurred

## Phase 4: Quality Assurance

### 4.1 Run Audit
```bash
npm run gfx:audit
```

**Verify:**
- ✅ All images are 1024×1024
- ✅ Sprites/UI have alpha channel
- ✅ Backdrops do NOT have alpha
- ✅ Power-of-Two compliance

### 4.2 Integration
```bash
npm run gfx:integrate
```

**This will:**
1. Move winners to `assets/images/generated/`
2. Update `assets/manifest.json`
3. Regenerate `src/constants/Assets.js`

**Confirm keys present:**
- Parallax: `genBackdropProteinSky`, `genBackdropMinesFore`, etc.
- Bosses: `genSpriteClumperBoss`, `genSpritePulsarBoss`, etc.
- Player: `genSpriteWynIdle`, `genSpriteWynRun`, etc.
- Props/Tiles/Collectibles/Hazards/UI: All corresponding keys

## Phase 5: Deliverables

### Required Summary Report:
- **Thumbnails Generated:** Total count + scored
- **Finals Integrated:** Count by category (backdrops, sprites, UI)
- **Budget Report:** Actual spend from BudgetGuard
- **Audit Results:** Any anomalies or warnings
- **Asset Manifest:** List of all keys in `Assets.js`

### Optional Enhancement:
Create `asset-generation/.reports/assets/preview.html` for visual QA:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Asset Preview Grid</title>
  <style>
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(256px, 1fr)); gap: 20px; padding: 20px; }
    .asset { text-align: center; }
    .asset img { width: 100%; max-width: 256px; border: 1px solid #ccc; }
    .asset .label { margin-top: 5px; font-family: monospace; font-size: 12px; }
    h2 { padding: 20px; background: #333; color: white; margin: 0; }
  </style>
</head>
<body>
  <h2>Protein Plant Parallax</h2>
  <div class="grid">
    <!-- Group by biome/category -->
  </div>
</body>
</html>
```

## Parallax Layer Reference

### Layer Roles:
- **Sky**: Mood and atmosphere (no hard structures)
- **Mid**: Silhouette context (large shapes, depth)
- **Fore**: Structural detail (clear interactive elements)
- **FG**: Interactive depth (closest to player, platform hints)

### Consistency Rules:
- Each biome uses consistent color palette across layers
- Layer depth progression: sky → mid → fore → fg
- No transparency in ANY backdrop layer
- Maintain visual hierarchy for gameplay readability

## Critical Reminders

⚠️ **NEVER** mention transparency in backdrop prompts
⚠️ **ALWAYS** include "transparent background" in sprite prompts
⚠️ **ENFORCE** $20 budget ceiling - pipeline will abort if exceeded
⚠️ **VALIDATE** before generation to prevent wasted credits
⚠️ **CHECK** `Assets.js` after integration for proper key generation

## Success Criteria
✅ 46 unique assets generated (16 backdrops + 30 sprites/UI)
✅ All assets pass audit (dimensions, alpha, POT)
✅ Budget stays under $20
✅ All keys accessible in `Assets.js` with proper naming convention
✅ Visual consistency across biome parallax layers

---

**Execute this directive sequentially. Report any blockers immediately.**
