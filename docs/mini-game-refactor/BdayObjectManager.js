/**
 * BdayObjectManager - Handles spawning, scrolling, and recycling of game objects
 * Uses object pooling for performance and clean spawn timers
 */
import { BdayConfig } from './BdayConfig.js';

export class BdayObjectManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        
        // Object groups - using physics groups for collision detection
        this.scrollingObjects = this.scene.physics.add.group();
        this.parcels = this.scene.physics.add.group({
            classType: Parcel,
            maxSize: 10,
            runChildUpdate: false
        });
        this.obstacles = this.scene.physics.add.group({
            classType: Obstacle,
            maxSize: 20,
            runChildUpdate: false
        });
        
        // Spawn timing
        this.lastSpawnTime = 0;
        this.spawnTimer = null;
        
        // Start spawning
        this.startSpawning();
    }
    
    startSpawning() {
        // Use scene timer for clean spawning rhythm
        const baseInterval = BdayConfig.Spawning.BaseIntervalMs;
        
        this.spawnTimer = this.scene.time.addEvent({
            delay: baseInterval,
            callback: () => this.spawnRhythm(),
            loop: true
        });
    }
    
    spawnRhythm() {
        if (this.gameManager.gameOver) return;
        
        // Dynamic spawn interval based on difficulty
        const interval = Math.max(
            BdayConfig.Spawning.MinIntervalMs,
            BdayConfig.Spawning.BaseIntervalMs - (this.gameManager.speedLevel * BdayConfig.Spawning.IntervalReductionPerLevel)
        );
        
        // Update timer delay for next spawn
        if (this.spawnTimer) {
            this.spawnTimer.delay = interval;
        }
        
        // Decide what to spawn
        const pattern = Phaser.Math.Between(0, 100);
        
        if (pattern < BdayConfig.Spawning.PatternThresholds.Obstacle) {
            // Spawn obstacle
            const obstacleType = Phaser.Math.Between(0, 2);
            this.spawnObstacle(obstacleType);
        } else if (pattern < BdayConfig.Spawning.PatternThresholds.Parcel && !this.gameManager.isCarrying) {
            // Spawn parcel only if not carrying
            this.spawnParcel();
        }
    }
    
    spawnParcel() {
        const lane = Phaser.Math.Between(0, BdayConfig.Lanes.Count - 1);
        const y = BdayConfig.Lanes.Positions[lane];
        const x = BdayConfig.Scrolling.ObjectSpawnXPx;
        
        // Try to get from pool or create new
        let parcel = this.parcels.getFirstDead();
        if (!parcel) {
            parcel = new Parcel(this.scene, x, y);
            this.parcels.add(parcel);
        } else {
            // Reuse pooled parcel
            parcel.activate(x, y, lane);
        }
        
        // Add to scrolling group
        this.scrollingObjects.add(parcel);
        
        // Decide if it's a special S² Shake
        const isSpecial = Phaser.Math.Between(0, 100) < 30; // 30% chance
        parcel.setType(isSpecial ? 'shakeshake' : 'protein');
    }
    
    spawnObstacle(type) {
        const lane = Phaser.Math.Between(0, BdayConfig.Lanes.Count - 1);
        const y = BdayConfig.Lanes.Positions[lane];
        const x = BdayConfig.Scrolling.ObjectSpawnXPx;
        
        // Try to get from pool or create new
        let obstacle = this.obstacles.getFirstDead();
        if (!obstacle) {
            obstacle = new Obstacle(this.scene, x, y, type);
            this.obstacles.add(obstacle);
        } else {
            // Reuse pooled obstacle
            obstacle.activate(x, y, lane, type);
        }
        
        // Add to scrolling group
        this.scrollingObjects.add(obstacle);
    }
    
    update(time, delta) {
        // Update all scrolling objects
        this.updateScrolling(delta);
        
        // Check for objects that need recycling
        this.checkRecycling();
    }
    
    updateScrolling(delta) {
        const scrollSpeed = BdayConfig.Scrolling.BaseSpeedPxPerSec * 
                          this.gameManager.getSpeedMultiplier() * 
                          (delta / 1000);
        
        this.scrollingObjects.children.entries.forEach(obj => {
            if (obj && obj.active) {
                obj.x -= scrollSpeed;
                
                // Object-specific updates
                if (obj.updateMovement) {
                    obj.updateMovement(time, delta);
                }
            }
        });
    }
    
    checkRecycling() {
        this.scrollingObjects.children.entries.forEach(obj => {
            if (obj && obj.active && obj.x < BdayConfig.Scrolling.ObjectDespawnXPx) {
                // Check if it was a missed parcel
                if (obj.isParcel && !obj.pickedUp && !this.gameManager.isCarrying) {
                    this.gameManager.missParcel();
                }
                
                // Recycle the object
                this.recycleObject(obj);
            }
        });
    }
    
    recycleObject(obj) {
        // Remove from scrolling group
        this.scrollingObjects.remove(obj);
        
        // Deactivate for pooling
        if (obj.deactivate) {
            obj.deactivate();
        } else {
            obj.setActive(false);
            obj.setVisible(false);
            if (obj.body) {
                obj.body.enable = false;
            }
        }
    }
    
    getScrollingObjects() {
        return this.scrollingObjects;
    }
    
    destroy() {
        // Stop spawn timer
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
        
        // Destroy all groups
        this.scrollingObjects.destroy(true);
        this.parcels.destroy(true);
        this.obstacles.destroy(true);
    }
}

/**
 * Parcel - Collectible object
 * Poolable for performance
 */
class Parcel extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Parcel properties
        this.isParcel = true;
        this.pickedUp = false;
        this.lane = 0;
        this.itemType = 'protein';
        this.points = BdayConfig.Scoring.Points.ProteinShake;
        
        // Create visual container
        this.createVisuals();
        
        // Set hitbox
        this.setSize(60, 60);
    }
    
    createVisuals() {
        // Visual container that follows this sprite
        this.visualContainer = this.scene.add.container(this.x, this.y);
        
        // Background circle
        this.bgCircle = this.scene.add.circle(0, 0, 35, 0x000000, 0.5);
        this.bgCircle.setStrokeStyle(3, 0xFFD700);
        
        // Main emoji
        this.emoji = this.scene.add.text(0, 0, '🧨', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        // Label background
        this.labelBg = this.scene.add.rectangle(0, -35, 80, 25, 0x000000, 0.8);
        this.labelBg.setStrokeStyle(2, 0xFFD700);
        
        // Label text
        this.label = this.scene.add.text(0, -35, 'S² SHAKE', {
            fontSize: '14px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Glow effect
        this.glow = this.scene.add.circle(0, 0, 40, 0xFFD700, 0.3);
        
        // Pickup arrow
        this.arrow = this.scene.add.text(0, 35, '⬆ PICKUP', {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.visualContainer.add([this.glow, this.bgCircle, this.emoji, this.labelBg, this.label, this.arrow]);
        
        // Pulse animation
        this.scene.tweens.add({
            targets: [this.glow, this.arrow],
            alpha: { from: 0.3, to: 0.8 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    setType(type) {
        this.itemType = type;
        
        if (type === 'shakeshake') {
            this.points = BdayConfig.Scoring.Points.ShakeShake;
            this.label.setText('S² SHAKE');
            this.emoji.setText('🧨');
        } else {
            this.points = BdayConfig.Scoring.Points.ProteinShake;
            this.label.setText('PROTEIN');
            this.emoji.setText('🥤');
        }
    }
    
    activate(x, y, lane) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        
        this.lane = lane;
        this.pickedUp = false;
        
        // Update visual container position
        if (this.visualContainer) {
            this.visualContainer.setPosition(x, y);
            this.visualContainer.setVisible(true);
        }
        
        // Entrance animation
        this.setScale(0);
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.Out'
        });
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        
        if (this.visualContainer) {
            this.visualContainer.setVisible(false);
        }
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Keep visual container synced with sprite position
        if (this.visualContainer && this.active) {
            this.visualContainer.x = this.x;
            this.visualContainer.y = this.y;
        }
    }
    
    destroy() {
        if (this.visualContainer) {
            this.visualContainer.destroy();
        }
        super.destroy();
    }
}

/**
 * Obstacle - Hazard object
 * Poolable for performance
 */
class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 0) {
        super(scene, x, y, null);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Obstacle properties
        this.isObstacle = true;
        this.hit = false;
        this.nearMissed = false;
        this.lane = 0;
        this.obstacleType = type;
        
        // Create visual container
        this.createVisuals();
        
        // Set hitbox
        this.setSize(50, 50);
    }
    
    createVisuals() {
        // Visual container that follows this sprite
        this.visualContainer = this.scene.add.container(this.x, this.y);
        
        // Main emoji (will be set based on type)
        this.emoji = this.scene.add.text(0, 0, '', {
            fontSize: '36px'
        }).setOrigin(0.5);
        
        this.visualContainer.add(this.emoji);
        
        // Additional visuals will be added based on type
        this.extraVisuals = [];
    }
    
    activate(x, y, lane, type) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        
        this.lane = lane;
        this.obstacleType = type;
        this.hit = false;
        this.nearMissed = false;
        
        // Clear old extra visuals
        this.extraVisuals.forEach(v => v.destroy());
        this.extraVisuals = [];
        
        // Setup based on type
        this.setupType(type);
        
        // Update visual container
        if (this.visualContainer) {
            this.visualContainer.setPosition(x, y);
            this.visualContainer.setVisible(true);
        }
    }
    
    setupType(type) {
        const config = Object.values(BdayConfig.Obstacles.Types)[type] || BdayConfig.Obstacles.Types.Poop;
        
        this.emoji.setText(config.Emoji);
        this.speedMultiplier = config.SpeedMultiplier;
        this.isPoop = (type === 0);
        this.hasWobble = config.HasWobble;
        this.isDrone = config.IsDrone;
        
        // Add type-specific visuals
        if (this.isPoop) {
            // Stink lines for poop
            const stink1 = this.scene.add.text(-10, -20, '~', {
                fontSize: '16px',
                color: '#88FF88'
            }).setOrigin(0.5);
            const stink2 = this.scene.add.text(10, -20, '~', {
                fontSize: '16px',
                color: '#88FF88'
            }).setOrigin(0.5);
            
            this.visualContainer.add([stink1, stink2]);
            this.extraVisuals.push(stink1, stink2);
            
            // Animate stink
            this.scene.tweens.add({
                targets: [stink1, stink2],
                y: '-=5',
                alpha: { from: 0.8, to: 0.2 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        if (this.isDrone) {
            // Wing flap for bird
            this.scene.tweens.add({
                targets: this.emoji,
                scaleX: { from: 1, to: 0.8 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
        
        if (this.hasWobble) {
            // Wobble effect for cone
            this.scene.tweens.add({
                targets: this.visualContainer,
                y: this.y + 10,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }
    
    updateMovement(time, delta) {
        // Special movement patterns
        if (this.isDrone && this.active) {
            // Hovering effect
            this.visualContainer.y = this.y + Math.sin(time * 0.003) * 5;
        }
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        
        if (this.visualContainer) {
            this.visualContainer.setVisible(false);
        }
        
        // Clear extra visuals
        this.extraVisuals.forEach(v => v.destroy());
        this.extraVisuals = [];
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Keep visual container synced (if not wobbling)
        if (this.visualContainer && this.active && !this.hasWobble) {
            this.visualContainer.x = this.x;
            this.visualContainer.y = this.y;
        } else if (this.visualContainer && this.active) {
            // Just sync X for wobbling objects
            this.visualContainer.x = this.x;
        }
    }
    
    destroy() {
        if (this.visualContainer) {
            this.visualContainer.destroy();
        }
        this.extraVisuals.forEach(v => v.destroy());
        super.destroy();
    }
}
