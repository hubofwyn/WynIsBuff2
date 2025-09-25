import { BirthdayConfig } from './BirthdayConfig';

/**
 * BirthdaySpawnManager - Handles spawning and pooling of game objects
 */
export class BirthdaySpawnManager {
    constructor(scene, laneManager) {
        this.scene = scene;
        this.laneManager = laneManager;
        this.config = BirthdayConfig;
        
        // Object pools
        this.obstacles = this.scene.physics.add.group();
        this.parcels = this.scene.physics.add.group();
        this.powerUps = this.scene.physics.add.group();
        
        // Active objects tracking
        this.activeObstacles = [];
        this.activeParcels = [];
        this.activePowerUps = [];
        
        // Spawning state
        this.lastSpawnTime = 0;
        this.spawnTimer = 0;
        this.nextSpawnDelay = this.config.Spawning.BaseIntervalMs;
        
        // Patterns
        this.currentPattern = null;
        this.patternIndex = 0;
    }
    
    /**
     * Initialize spawn manager
     */
    init() {
        // Pre-create objects for pooling
        this.createObjectPools();
    }
    
    /**
     * Create object pools
     */
    createObjectPools() {
        // Pre-create obstacles
        for (let i = 0; i < 10; i++) {
            const obstacle = this.createObstacle();
            obstacle.setActive(false).setVisible(false);
        }
        
        // Pre-create parcels
        for (let i = 0; i < 5; i++) {
            const parcel = this.createParcel();
            parcel.setActive(false).setVisible(false);
        }
        
        // Pre-create power-ups
        for (let i = 0; i < 3; i++) {
            const powerUp = this.createPowerUp();
            powerUp.setActive(false).setVisible(false);
        }
    }
    
    /**
     * Update spawning logic
     * @param {number} time - Current game time
     * @param {number} delta - Delta time
     * @param {Object} gameState - Current game state
     */
    update(time, delta, gameState) {
        if (!gameState.gameStarted || gameState.gameOver || gameState.paused) return;
        
        // Update spawn timer
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.nextSpawnDelay) {
            this.spawnTimer = 0;
            this.spawn(gameState);
            
            // Calculate next spawn delay based on difficulty
            this.updateSpawnDelay(gameState.difficultyLevel);
        }
        
        // Update active objects
        this.updateObjects(delta, gameState.speedMultiplier);
    }
    
    /**
     * Spawn new object based on game state
     */
    spawn(gameState) {
        const roll = Math.random() * 100;
        const { PatternThresholds } = this.config.Spawning;
        
        // Determine what to spawn
        if (!gameState.isCarrying && roll < PatternThresholds.Obstacle) {
            this.spawnObstacle();
        } else if (!gameState.isCarrying && roll < PatternThresholds.Parcel) {
            this.spawnParcel();
        } else if (roll < PatternThresholds.PowerUp) {
            this.spawnPowerUp();
        } else {
            this.spawnObstacle();
        }
    }
    
    /**
     * Spawn an obstacle
     */
    spawnObstacle(type = null) {
        // Get or create obstacle from pool
        let obstacle = this.obstacles.getFirstDead();
        
        if (!obstacle) {
            obstacle = this.createObstacle();
        }
        
        // Determine type
        if (!type) {
            const types = Object.keys(this.config.Obstacles.Types);
            type = Phaser.Utils.Array.GetRandom(types);
        }
        
        const obstacleConfig = this.config.Obstacles.Types[type];
        const lane = this.laneManager.getRandomLane();
        const y = this.laneManager.getLaneY(lane);
        
        // Configure obstacle
        obstacle.setActive(true).setVisible(true);
        obstacle.setPosition(this.config.Scrolling.ObjectSpawnXPx, y);
        obstacle.setText(obstacleConfig.Emoji);
        obstacle.setData('type', type);
        obstacle.setData('lane', lane);
        obstacle.setData('speed', this.config.Obstacles.BaseSpeedPxPerSec * obstacleConfig.SpeedMultiplier);
        
        // Add wobble for certain types
        if (obstacleConfig.HasWobble) {
            this.addWobbleEffect(obstacle);
        }
        
        // Add vertical movement for drones
        if (obstacleConfig.IsDrone) {
            this.addDroneMovement(obstacle, y);
        }
        
        this.activeObstacles.push(obstacle);
        
        return obstacle;
    }
    
    /**
     * Spawn a parcel
     */
    spawnParcel() {
        let parcel = this.parcels.getFirstDead();
        
        if (!parcel) {
            parcel = this.createParcel();
        }
        
        const lane = this.laneManager.getRandomLane();
        const y = this.laneManager.getLaneY(lane);
        
        parcel.setActive(true).setVisible(true);
        parcel.setPosition(this.config.Scrolling.ObjectSpawnXPx, y);
        parcel.setText('📦');
        parcel.setData('lane', lane);
        parcel.setData('type', 'parcel');
        
        // Add floating animation
        this.scene.tweens.add({
            targets: parcel,
            y: y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        this.activeParcels.push(parcel);
        
        return parcel;
    }
    
    /**
     * Spawn a power-up
     */
    spawnPowerUp(type = null) {
        let powerUp = this.powerUps.getFirstDead();
        
        if (!powerUp) {
            powerUp = this.createPowerUp();
        }
        
        // Determine type
        if (!type) {
            const types = Object.keys(this.config.PowerUps.Types);
            type = Phaser.Utils.Array.GetRandom(types);
        }
        
        const powerUpConfig = this.config.PowerUps.Types[type];
        const lane = this.laneManager.getRandomLane();
        const y = this.laneManager.getLaneY(lane);
        
        powerUp.setActive(true).setVisible(true);
        powerUp.setPosition(this.config.Scrolling.ObjectSpawnXPx, y);
        powerUp.setText(powerUpConfig.Emoji);
        powerUp.setData('type', type);
        powerUp.setData('lane', lane);
        powerUp.setTint(powerUpConfig.Color);
        
        // Add glow effect
        this.addGlowEffect(powerUp, powerUpConfig.Color);
        
        this.activePowerUps.push(powerUp);
        
        return powerUp;
    }
    
    /**
     * Create an obstacle object
     */
    createObstacle() {
        const obstacle = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '48px'
        });
        
        this.scene.physics.add.existing(obstacle);
        obstacle.body.setSize(40, 40);
        this.obstacles.add(obstacle);
        
        return obstacle;
    }
    
    /**
     * Create a parcel object
     */
    createParcel() {
        const parcel = this.scene.add.text(0, 0, '📦', {
            fontFamily: 'Arial',
            fontSize: '48px'
        });
        
        this.scene.physics.add.existing(parcel);
        parcel.body.setSize(40, 40);
        this.parcels.add(parcel);
        
        return parcel;
    }
    
    /**
     * Create a power-up object
     */
    createPowerUp() {
        const powerUp = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '36px'
        });
        
        this.scene.physics.add.existing(powerUp);
        powerUp.body.setSize(35, 35);
        this.powerUps.add(powerUp);
        
        return powerUp;
    }
    
    /**
     * Update all active objects
     */
    updateObjects(delta, speedMultiplier) {
        const scrollSpeed = this.config.Scrolling.BaseSpeedPxPerSec * speedMultiplier;
        const deltaSeconds = delta / 1000;
        
        // Update obstacles
        this.activeObstacles = this.activeObstacles.filter(obstacle => {
            if (!obstacle.active) return false;
            
            const speed = obstacle.getData('speed') || scrollSpeed;
            obstacle.x -= speed * deltaSeconds;
            
            if (obstacle.x < this.config.Scrolling.ObjectDespawnXPx) {
                this.deactivateObject(obstacle);
                return false;
            }
            
            return true;
        });
        
        // Update parcels
        this.activeParcels = this.activeParcels.filter(parcel => {
            if (!parcel.active) return false;
            
            parcel.x -= scrollSpeed * deltaSeconds;
            
            if (parcel.x < this.config.Scrolling.ObjectDespawnXPx) {
                this.deactivateObject(parcel);
                return false;
            }
            
            return true;
        });
        
        // Update power-ups
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (!powerUp.active) return false;
            
            powerUp.x -= scrollSpeed * deltaSeconds;
            
            if (powerUp.x < this.config.Scrolling.ObjectDespawnXPx) {
                this.deactivateObject(powerUp);
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Add wobble effect to object
     */
    addWobbleEffect(object) {
        this.scene.tweens.add({
            targets: object,
            angle: { from: -5, to: 5 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: this.config.Effects.TweenEases.Wobble
        });
    }
    
    /**
     * Add drone movement pattern
     */
    addDroneMovement(object, centerY) {
        const amplitude = this.config.Obstacles.Types.Bird.VerticalAmplitude || 50;
        
        this.scene.tweens.add({
            targets: object,
            y: { from: centerY - amplitude, to: centerY + amplitude },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }
    
    /**
     * Add glow effect to object
     */
    addGlowEffect(object, color) {
        const glow = this.scene.add.graphics();
        glow.fillStyle(color, 0.3);
        glow.fillCircle(0, 0, 30);
        
        object.setData('glow', glow);
        
        // Update glow position in render
        this.scene.events.on('postupdate', () => {
            if (object.active && glow) {
                glow.setPosition(object.x, object.y);
            }
        });
        
        // Pulse effect
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.2, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Deactivate an object and return to pool
     */
    deactivateObject(object) {
        // Stop any tweens on this object
        this.scene.tweens.killTweensOf(object);
        
        // Clean up glow if exists
        const glow = object.getData('glow');
        if (glow) {
            glow.destroy();
            object.setData('glow', null);
        }
        
        // Reset object
        object.setActive(false).setVisible(false);
        object.setPosition(-100, -100);
        object.clearTint();
        object.setAngle(0);
    }
    
    /**
     * Update spawn delay based on difficulty
     */
    updateSpawnDelay(difficultyLevel) {
        const reduction = this.config.Spawning.IntervalReductionPerLevel * (difficultyLevel - 1);
        this.nextSpawnDelay = Math.max(
            this.config.Spawning.MinIntervalMs,
            this.config.Spawning.BaseIntervalMs - reduction
        );
    }
    
    /**
     * Get all active objects for collision checking
     */
    getActiveObjects() {
        return {
            obstacles: this.activeObstacles,
            parcels: this.activeParcels,
            powerUps: this.activePowerUps
        };
    }
    
    /**
     * Remove specific object
     */
    removeObject(object) {
        this.deactivateObject(object);
        
        // Remove from active arrays
        this.activeObstacles = this.activeObstacles.filter(o => o !== object);
        this.activeParcels = this.activeParcels.filter(p => p !== object);
        this.activePowerUps = this.activePowerUps.filter(p => p !== object);
    }
    
    /**
     * Clear all active objects
     */
    clearAll() {
        [...this.activeObstacles, ...this.activeParcels, ...this.activePowerUps].forEach(object => {
            this.deactivateObject(object);
        });
        
        this.activeObstacles = [];
        this.activeParcels = [];
        this.activePowerUps = [];
    }
    
    /**
     * Reset spawn manager
     */
    reset() {
        this.clearAll();
        this.spawnTimer = 0;
        this.nextSpawnDelay = this.config.Spawning.BaseIntervalMs;
        this.currentPattern = null;
        this.patternIndex = 0;
    }
    
    /**
     * Destroy spawn manager
     */
    destroy() {
        this.clearAll();
        this.obstacles.destroy(true);
        this.parcels.destroy(true);
        this.powerUps.destroy(true);
    }
}