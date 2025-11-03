# Level Data Schema v1.1.0

**Source**: `src/constants/LevelData.js`
**Validation**: `scripts/validate-level.js`
**Index**: [doc_index.yaml](../../meta/doc_index.yaml#level-data-schema)

## Schema Structure

```typescript
interface LevelData {
  // Core Metadata
  id: string;                    // Unique level identifier
  name: string;                  // Display name
  description: string;           // Brief description

  // Schema Tracking (v1.1+)
  meta?: {
    schemaVersion: string;       // Schema version (e.g., "1.1.0")
    author: string;              // Level designer
    created: string;             // ISO date (YYYY-MM-DD)
    description: string;         // Design notes
    references: string[];        // Doc links
  };

  // Spawn Configuration
  spawnPoint: {
    x: number;                   // World X coordinate
    y: number;                   // World Y coordinate
  };

  // Collectibles
  collectibles: Array<{
    x: number;                   // World X coordinate
    y: number;                   // World Y coordinate
    type: string;                // 'protein' | 'bonus' | 'special'
  }>;

  // Static Platforms
  platforms: Array<{
    x: number;                   // World X coordinate
    y: number;                   // World Y coordinate
    width: number;               // Platform width (px)
    height: number;              // Platform height (px)
    texture?: string;            // Optional texture key
  }>;

  // Moving Platforms
  movingPlatforms?: Array<{
    x: number;                   // Start X coordinate
    y: number;                   // Start Y coordinate
    width: number;               // Platform width (px)
    height: number;              // Platform height (px)
    moveX?: number;              // Horizontal movement distance
    moveY?: number;              // Vertical movement distance
    duration: number;            // Movement duration (ms)
    texture?: string;            // Optional texture key
  }>;

  // Visual Layers
  backgroundAssets: Array<{
    key: string;                 // Asset key from Assets.js
    x: number;                   // World X coordinate
    y: number;                   // World Y coordinate
    depth?: number;              // Z-index
    scale?: number;              // Scale factor
  }>;

  foregroundAssets?: Array<{
    key: string;                 // Asset key from Assets.js
    x: number;                   // World X coordinate
    y: number;                   // World Y coordinate
    depth?: number;              // Z-index
    scale?: number;              // Scale factor
  }>;

  // Audio
  music: string;                 // Music track key from AudioAssets

  // World Bounds
  levelBounds: {
    width: number;               // Total level width (px)
    height: number;              // Total level height (px)
  };

  // Physics Configuration
  physics: {
    gravity: {
      x: number;                 // Horizontal gravity (usually 0)
      y: number;                 // Vertical gravity (e.g., 980)
    };
  };
}
```

## Required Fields

Every level **must** include:
- `id`, `name`, `description`
- `spawnPoint` (x, y)
- `collectibles` (array, can be empty)
- `platforms` (array, must have at least ground)
- `backgroundAssets` (array, can be empty)
- `music` (audio key)
- `levelBounds` (width, height)
- `physics` (gravity x, y)

## Optional Fields

- `meta` (recommended for tracking)
- `movingPlatforms`
- `foregroundAssets`

## Validation Rules

1. **IDs must be unique** across all levels
2. **Coordinates must be positive** integers
3. **Dimensions (width, height) must be > 0**
4. **Asset keys must exist** in `Assets.js` or `AudioAssets`
5. **Gravity Y should be positive** (down is positive in Phaser/Rapier)
6. **SpawnPoint must be within levelBounds**

## Example: Minimal Valid Level

```javascript
export const LEVEL_TEMPLATE = {
  id: 'level_template',
  name: 'Template Level',
  description: 'Starter template for new levels',

  meta: {
    schemaVersion: '1.1.0',
    author: 'system',
    created: '2025-11-02',
    description: 'Minimal valid level structure',
    references: ['docs/reference/data/level_schema.md']
  },

  spawnPoint: { x: 100, y: 100 },

  collectibles: [
    { x: 200, y: 100, type: 'protein' }
  ],

  platforms: [
    { x: 400, y: 500, width: 800, height: 32 } // Ground
  ],

  backgroundAssets: [],

  music: AudioAssets.LEVEL_THEME,

  levelBounds: {
    width: 1600,
    height: 600
  },

  physics: {
    gravity: { x: 0, y: 980 }
  }
};
```

## Schema Evolution

### v1.0.0 (Initial)
- Basic level structure
- No meta tracking

### v1.1.0 (Current)
- Added `meta` field for schema tracking
- Added `author`, `created`, `description`, `references`
- Recommended for all new levels

## Usage in Code

```javascript
import { LEVEL_1 } from '../constants/LevelData.js';

// Check schema version
if (LEVEL_1.meta?.schemaVersion) {
  console.log(`Level schema: ${LEVEL_1.meta.schemaVersion}`);
}

// Access level data
const spawnX = LEVEL_1.spawnPoint.x;
const collectibles = LEVEL_1.collectibles.length;
```

## Validation Command

```bash
# Validate a specific level
bun run validate-level level1

# Validate all levels
bun run validate-levels
```

## Related

- **Implementation**: [LevelLoader.js](../../../src/modules/level/LevelLoader.js)
- **Factory**: [PlatformFactory.js](../../../src/modules/level/PlatformFactory.js)
- **Index**: [doc_index.yaml](../../meta/doc_index.yaml#level-data-schema)
