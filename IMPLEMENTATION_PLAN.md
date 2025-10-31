# WynIsBuff2: Skill-to-Automation Implementation Plan

## Overview

Transform WynIsBuff2 into a hybrid skill-first platformer where performance manufactures idle automation. This plan harmonizes with existing architecture while introducing new systems.

## Core Architecture Refactors

### 1. Enhanced Game State System

```javascript
// src/modules/gameState/GameStateManager.js
class GameStateManager extends BaseManager {
    // Existing state + new hybrid state
    state = {
        // Active Play State
        currentRun: {
            biome: null,
            room: 0,
            startTime: 0,
            score: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            combo: 0,
            maxCombo: 0,
            hitsThaken: 0,
            rarePickups: [],
        },

        // Idle State
        clones: [],
        resources: {
            coins: 0,
            gritShards: 0,
            repsPerSec: 0,
            tempoSparks: 0,
            buffDNA: 0,
        },
        generators: [],
        lastSeen: Date.now(),

        // Progression State
        unlockedBiomes: ['protein-plant'],
        movementTech: {
            doubleJump: true,
            tripleJump: false,
            wallDash: false,
            momentumVault: false,
        },
        bulkCycle: 0,
    };
}
```

### 2. New Manager Classes

```javascript
// src/modules/idle/CloneManager.js
export class CloneManager extends BaseManager {
    forgeClone(performanceVector) {
        const { S, C, H, R, B } = performanceVector;
        const baseRate = this.getBaseRate();
        const performanceMult =
            (1 + 0.12 * S) * (1 + 0.03 * C) * (H === 0 ? 1.15 : 1.0) * (1 + 0.05 * R) * B;
        const stability = Math.max(0.5, Math.min(0.95, 0.6 + 0.08 * S + 0.02 * C - 0.05 * H));

        return {
            id: crypto.randomUUID(),
            rate: baseRate * performanceMult,
            stability,
            specialty: this.determineSpecialty(performanceVector),
            createdAt: Date.now(),
            lastRefresh: Date.now(),
            boosted: false,
        };
    }

    calculateOfflineProgress(deltaTime) {
        const resources = {};
        this.clones.forEach((clone) => {
            const decay = Math.min(1.0, Math.max(0.6, 1.0 - (deltaTime / 36000) * 0.4));
            const effective = clone.rate * decay * clone.stability;
            resources[clone.specialty] = (resources[clone.specialty] || 0) + effective * deltaTime;
        });
        return resources;
    }
}

// src/modules/pcg/PCGManager.js
export class PCGManager extends BaseManager {
    generateLevel(dnaParams, seed) {
        const rng = this.seedRandom(seed);
        const { strength, agility, endurance, tempo } = dnaParams;

        return {
            platformDensity: 0.5 + strength * 0.3,
            gapVariance: 0.2 + agility * 0.4,
            routeLength: 100 + endurance * 50,
            hazardCadence: 60 + tempo * 30,
            rooms: this.generateRooms(rng, dnaParams),
        };
    }
}

// src/modules/economy/EconomyManager.js
export class EconomyManager extends BaseManager {
    processResourceGain(type, amount, source = 'unknown') {
        const multipliers = this.getActiveMultipliers();
        const finalAmount = amount * multipliers[type];

        this.eventSystem.emit(EventNames.RESOURCE_GAINED, {
            type,
            amount: finalAmount,
            source,
        });

        return finalAmount;
    }
}
```

## Scene Structure

### New Scenes

```javascript
// src/scenes/HubScene.js
export class HubScene extends Phaser.Scene {
    sections = {
        track: { x: 100, y: 100, icon: 'track-icon', scene: SceneKeys.RUN },
        weightRoom: { x: 300, y: 100, icon: 'weight-icon', scene: SceneKeys.UPGRADES },
        factory: { x: 500, y: 100, icon: 'factory-icon', scene: SceneKeys.FACTORY },
        lab: { x: 700, y: 100, icon: 'lab-icon', scene: SceneKeys.LAB },
    };
}

// src/scenes/RunScene.js (enhanced Game.js)
export class RunScene extends Phaser.Scene {
    // Enhanced with scoring system
    updateScore(event) {
        switch (event) {
            case 'speed_checkpoint':
                this.runScore.S++;
                break;
            case 'combo_extend':
                this.runScore.C = Math.max(this.runScore.C, this.combo);
                break;
            case 'hit_taken':
                this.runScore.H++;
                break;
        }
    }
}

// src/scenes/ResultsScene.js
export class ResultsScene extends Phaser.Scene {
    create(data) {
        const { score } = data;
        const clone = this.cloneManager.forgeClone(score);
        this.displayCloneStats(clone);
        this.addToFactory(clone);
    }
}

// src/scenes/FactoryScene.js
export class FactoryScene extends Phaser.Scene {
    // Visualize clone lanes with production rates
    createLane(clone) {
        const lane = this.add.container();
        const sprite = this.add.sprite(0, 0, ImageAssets.BUFF_CLONE);
        const rateText = this.add.text(0, 50, `${clone.rate.toFixed(1)}/s`);
        const boostButton = this.add.sprite(100, 0, ImageAssets.TEMPO_SPARK);

        lane.add([sprite, rateText, boostButton]);
        return lane;
    }
}
```

## Data Models

### JSON Configuration Files

```json
// assets/data/biomes.json
{
  "protein-plant": {
    "name": "Protein Plant",
    "tier": 1,
    "hazards": ["conveyor", "whey-pool"],
    "boss": "the-clumper",
    "unlockRequires": null,
    "specialtyResource": "protein",
    "baseGeneratorRate": 1.0
  },
  "metronome-mines": {
    "name": "Metronome Mines",
    "tier": 2,
    "hazards": ["piston", "rhythm-trap"],
    "boss": "the-pulsar",
    "unlockRequires": { "gritShards": 10 },
    "specialtyResource": "tempo",
    "baseGeneratorRate": 1.5
  }
}

// assets/data/upgrades.json
{
  "movement": {
    "triple-jump": {
      "name": "Triple Jump",
      "tiers": [
        { "cost": { "gritShards": 5 }, "effect": "unlockTripleJump" },
        { "cost": { "gritShards": 15 }, "effect": "tripleJumpHeight+10%" }
      ]
    },
    "wall-dash": {
      "name": "Wall Dash",
      "tiers": [
        { "cost": { "boss": "the-pulsar" }, "effect": "unlockWallDash" },
        { "cost": { "gritShards": 20 }, "effect": "wallDashSpeed+15%" }
      ]
    }
  }
}
```

## Event Flow

### New Event Names

```javascript
// src/constants/EventNames.js
export const EventNames = {
    // Existing events...

    // Run Events
    RUN_START: 'run:start',
    RUN_COMPLETE: 'run:complete',
    SCORE_UPDATE: 'run:score-update',

    // Clone Events
    CLONE_FORGED: 'clone:forged',
    CLONE_BOOSTED: 'clone:boosted',
    CLONE_REFRESHED: 'clone:refreshed',

    // Economy Events
    RESOURCE_GAINED: 'economy:resource-gained',
    GENERATOR_UNLOCKED: 'economy:generator-unlocked',

    // Prestige Events
    BULK_CYCLE_TRIGGERED: 'prestige:bulk-cycle',
    WORLD_RESEEDED: 'prestige:world-reseeded',
};
```

## Implementation Phases

### Phase 1: Core Movement Enhancement (Days 1-2)

```javascript
// Enhance PlayerController with buffering
class PlayerController {
    constructor() {
        this.inputBuffer = [];
        this.bufferWindow = 12; // ms
        this.coyoteTime = 100; // ms
        this.lastGroundedTime = 0;
    }

    update(delta) {
        this.processBufferedInputs();
        this.checkCoyoteTime();
        this.updateJumpHeight();
    }
}
```

### Phase 2: Scoring & Clone System (Days 3-4)

```javascript
// Run completion flow
this.eventSystem.on(EventNames.RUN_COMPLETE, (data) => {
    const clone = this.cloneManager.forgeClone(data.score);
    this.gameStateManager.addClone(clone);
    this.scene.start(SceneKeys.RESULTS, { clone, score: data.score });
});
```

### Phase 3: Idle Mechanics (Days 5-6)

```javascript
// Boot scene idle catch-up
create() {
  const now = Date.now();
  const lastSeen = this.gameStateManager.getLastSeen();
  const deltaTime = Math.min((now - lastSeen) / 1000, 36000); // Cap at 10 hours

  const resources = this.cloneManager.calculateOfflineProgress(deltaTime);
  this.economyManager.addResources(resources);
}
```

### Phase 4: Boss Implementation (Days 7-8)

```javascript
// The Pulsar boss pattern
class PulsarBoss extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.pulseRadius = 100;
        this.pulseSpeed = 0.02;
        this.obstacles = [];
    }

    update(time) {
        const scale = 1 + Math.sin(time * this.pulseSpeed) * 0.3;
        this.obstacles.forEach((obs) => {
            obs.setScale(scale);
            this.checkCollision(obs);
        });
    }
}
```

### Phase 5: Prestige System (Days 9-10)

```javascript
// Bulk Cycle implementation
class PrestigeManager extends BaseManager {
    triggerBulkCycle() {
        const kept = {
            movementTech: this.gameStateManager.getMovementTech(),
            unlockedGenerators: this.gameStateManager.getUnlockedGenerators(),
        };

        this.gameStateManager.reset(kept);
        this.pcgManager.reseedWorld(this.gameStateManager.getDNAParams());
        this.eventSystem.emit(EventNames.BULK_CYCLE_TRIGGERED);
    }
}
```

## Key Refactors to Existing Code

### 1. Enhanced PlayerController

- Add input buffering system
- Implement coyote time
- Add variable jump height
- Integrate wall-dash when unlocked

### 2. GameStateManager Extension

- Add idle/active hybrid state
- Implement resource tracking
- Add clone management
- Handle offline progress

### 3. New Event Flows

- Run → Results → Clone Forge
- Boss Defeat → Movement Unlock
- Resource Gain → Generator Unlock
- DNA Threshold → Bulk Cycle

## Data Persistence

```javascript
// src/modules/persistence/SaveManager.js
export class SaveManager extends BaseManager {
    save() {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            gameState: this.gameStateManager.getState(),
            clones: this.cloneManager.getClones(),
            resources: this.economyManager.getResources(),
            bulkCycle: this.prestigeManager.getCycleCount(),
        };

        localStorage.setItem('wynisbuff2_save', JSON.stringify(saveData));
    }

    load() {
        const saved = localStorage.getItem('wynisbuff2_save');
        if (!saved) return null;

        const data = JSON.parse(saved);
        this.migrate(data);
        return data;
    }
}
```

## Performance Targets

- 60 FPS during active play
- < 100ms scene transitions
- < 2MB memory for idle state
- Offline calculation < 50ms for 10hr gap
- Save/load < 100ms

## Testing Strategy

```javascript
// tests/CloneForging.test.cjs
const assert = require('assert');

describe('Clone Forging', () => {
    it('should calculate correct performance multiplier', () => {
        const score = { S: 5, C: 10, H: 0, R: 3, B: 1.2 };
        const clone = forgeClone(score);
        const expected = 1.6 * 1.3 * 1.15 * 1.15 * 1.2;
        assert.equal(clone.rate / BASE_RATE, expected);
    });
});
```

## Next Immediate Steps

1. **Start with Phase 1**: Enhance PlayerController with buffering/coyote time
2. **Create data models**: Set up JSON configs for biomes, upgrades, generators
3. **Build CloneManager**: Core forging logic with performance mapping
4. **Implement RunScene scoring**: Track S, C, H, R, B during play
5. **Create ResultsScene**: Display clone stats and forge animation

## Asset Requirements

New assets needed:

- Buff Clone sprites (idle animation)
- Tempo Spark icon/particle
- Factory lane backgrounds
- The Pulsar boss sprite sheet
- Hub section icons
- Resource icons (Coins, Grit Shards, Reps, DNA)

## Timeline

- **Week 1**: Core gameplay, scoring, clone forging
- **Week 2**: Idle mechanics, boss, prestige system
- **Week 3**: Polish, balance, PCG implementation

This implementation maintains your architectural patterns while introducing the hybrid mechanics that make this game unique.
