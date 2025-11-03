#!/usr/bin/env node
/**
 * Level Data Validation Script
 *
 * Validates level data against the schema specification
 * Usage: node scripts/validate-level.js [levelId]
 *
 * Examples:
 *   node scripts/validate-level.js level1
 *   node scripts/validate-level.js all
 */

import Ajv from 'ajv';
import { LevelData } from '../src/constants/LevelData.js';

const ajv = new Ajv({ allErrors: true });

// Level Data JSON Schema (v1.1.0)
const levelSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    // Either playerStart or spawnPoint
    'collectibles',
    'platforms'
    // Other fields optional for flexibility
  ],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9_-]+$' },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },

    meta: {
      type: 'object',
      properties: {
        schemaVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        author: { type: 'string' },
        created: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        description: { type: 'string' },
        references: { type: 'array', items: { type: 'string' } }
      }
    },

    // Accept either spawnPoint or playerStart
    spawnPoint: {
      type: 'object',
      required: ['x', 'y'],
      properties: {
        x: { type: 'number', minimum: 0 },
        y: { type: 'number', minimum: 0 }
      }
    },
    playerStart: {
      type: 'object',
      required: ['x', 'y'],
      properties: {
        x: { type: 'number', minimum: 0 },
        y: { type: 'number', minimum: 0 }
      }
    },
    ground: {
      type: 'object',
      properties: {
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 },
        y: { type: 'number' }
      }
    },

    collectibles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['x', 'y', 'type'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          type: { type: 'string' }, // Allow any string type for flexibility
          value: { type: 'number' } // Optional value field
        }
      }
    },

    platforms: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', exclusiveMinimum: 0 },
          height: { type: 'number', exclusiveMinimum: 0 },
          texture: { type: 'string' },
          color: { type: 'number' } // Allow color property
        }
      }
    },

    movingPlatforms: {
      type: 'array',
      items: {
        type: 'object',
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', exclusiveMinimum: 0 },
          height: { type: 'number', exclusiveMinimum: 0 },
          moveX: { type: 'number' },
          moveY: { type: 'number' },
          speed: { type: 'number' }, // Allow speed instead of duration
          duration: { type: 'number', exclusiveMinimum: 0 },
          texture: { type: 'string' },
          color: { type: 'number' } // Allow color property
        }
      }
    },

    backgroundAssets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'x', 'y'],
        properties: {
          key: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          depth: { type: 'number' },
          scale: { type: 'number', exclusiveMinimum: 0 }
        }
      }
    },

    foregroundAssets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'x', 'y'],
        properties: {
          key: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          depth: { type: 'number' },
          scale: { type: 'number', exclusiveMinimum: 0 }
        }
      }
    },

    music: { type: 'string' },

    levelBounds: {
      type: 'object',
      required: ['width', 'height'],
      properties: {
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 }
      }
    },

    physics: {
      type: 'object',
      required: ['gravity'],
      properties: {
        gravity: {
          type: 'object',
          required: ['x', 'y'],
          properties: {
            x: { type: 'number' },
            y: { type: 'number', minimum: 0 }
          }
        }
      }
    }
  }
};

const validate = ajv.compile(levelSchema);

// Available levels (from LevelData object)
const levels = LevelData;

/**
 * Validate a single level
 */
function validateLevel(levelId, levelData) {
  console.log(`\n🔍 Validating ${levelId}...`);

  const valid = validate(levelData);

  if (valid) {
    console.log(`✅ ${levelId} is valid`);

    // Additional checks
    const warnings = [];

    // Check for meta field (recommended)
    if (!levelData.meta) {
      warnings.push('⚠️  Missing recommended "meta" field for schema tracking');
    } else if (levelData.meta.schemaVersion !== '1.1.0') {
      warnings.push(`⚠️  Schema version is ${levelData.meta.schemaVersion}, current is 1.1.0`);
    }

    // Check spawn point is within bounds (if bounds exist)
    const spawn = levelData.spawnPoint || levelData.playerStart;
    if (spawn && levelData.levelBounds) {
      if (spawn.x < 0 ||
          spawn.x > levelData.levelBounds.width ||
          spawn.y < 0 ||
          spawn.y > levelData.levelBounds.height) {
        warnings.push('⚠️  Spawn point is outside level bounds');
      }
    }

    // Check for at least one collectible
    if (levelData.collectibles.length === 0) {
      warnings.push('⚠️  No collectibles defined');
    }

    if (warnings.length > 0) {
      console.log('\nWarnings:');
      warnings.forEach(w => console.log(`  ${w}`));
    }

    return { valid: true, warnings };
  } else {
    console.log(`❌ ${levelId} has validation errors:`);
    validate.errors.forEach(err => {
      console.log(`  - ${err.instancePath} ${err.message}`);
    });
    return { valid: false, errors: validate.errors };
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const targetLevel = args[0] || 'all';

  console.log('🎮 WynIsBuff2 Level Validation');
  console.log('================================\n');
  console.log(`Schema Version: 1.1.0`);
  console.log(`Target: ${targetLevel}`);

  let results = {};

  if (targetLevel === 'all') {
    // Validate all levels
    Object.entries(levels).forEach(([id, data]) => {
      results[id] = validateLevel(id, data);
    });
  } else {
    // Validate specific level
    const levelData = levels[targetLevel];
    if (!levelData) {
      console.error(`\n❌ Level "${targetLevel}" not found`);
      console.log(`\nAvailable levels: ${Object.keys(levels).join(', ')}`);
      process.exit(1);
    }
    results[targetLevel] = validateLevel(targetLevel, levelData);
  }

  // Summary
  console.log('\n================================');
  console.log('Summary:');
  const total = Object.keys(results).length;
  const valid = Object.values(results).filter(r => r.valid).length;
  const invalid = total - valid;
  const warnings = Object.values(results).reduce((sum, r) => sum + (r.warnings?.length || 0), 0);

  console.log(`  Total: ${total}`);
  console.log(`  Valid: ${valid}`);
  console.log(`  Invalid: ${invalid}`);
  console.log(`  Warnings: ${warnings}`);

  if (invalid > 0) {
    process.exit(1);
  }
}

main();
