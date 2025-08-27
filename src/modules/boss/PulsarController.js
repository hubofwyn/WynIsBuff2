import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';

/**
 * PulsarController - Boss physics controller for The Pulsar's pulsating obstacles
 * Optimized collision patterns for 60 FPS performance with multiple collision bodies.
 * 
 * Features:
 * - Pulsating collision zones with proper physics
 * - Predictive collision detection for smooth gameplay
 * - Optimized spatial partitioning for multiple obstacles
 * - Frame-perfect hitbox synchronization
 */
export class PulsarController {
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        
        // Boss state
        this.state = {
            phase: 'idle',  // idle, pulsing, attacking, vulnerable
            health: 100,
            position: { x: 800, y: 300 },
            pulsePhase: 0,
            lastPhaseChange: 0
        };
        
        // Pulsating obstacles configuration
        this.pulseConfig = {
            // Wave patterns
            patterns: {
                circular: {
                    count: 8,
                    radius: 200,
                    speed: 2,
                    sizeOscillation: 0.5
                },
                spiral: {
                    count: 12,
                    radiusMin: 100,
                    radiusMax: 400,
                    rotationSpeed: 1.5,
                    expansionRate: 50
                },
                shockwave: {
                    rings: 3,
                    speed: 400,
                    thickness: 30,
                    interval: 500
                }
            },
            
            // Collision optimization
            optimization: {
                spatialGridSize: 100,
                collisionLayers: 0x0002,  // Separate collision layer
                sensorMode: false,
                continuousDetection: true
            }
        };
        
        // Active obstacles
        this.obstacles = [];
        this.obstaclePool = [];  // Object pooling for performance
        this.spatialGrid = new Map();
        
        // Physics bodies
        this.bossBody = null;
        this.pulseZones = [];
        
        // Performance monitoring
        this.performance = {
            lastUpdateTime: 0,
            frameTime: 16.67,  // Target 60 FPS
            interpolationFactor: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize boss physics
     */
    initialize() {
        // Create main boss body
        const bossDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(this.state.position.x, this.state.position.y);
        
        this.bossBody = this.world.createRigidBody(bossDesc);
        
        // Create boss collider
        const bossCollider = RAPIER.ColliderDesc.ball(50)
            .setSensor(true)
            .setCollisionGroups(this.pulseConfig.optimization.collisionLayers)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        
        this.world.createCollider(bossCollider, this.bossBody);
        
        // Pre-allocate obstacle pool
        this.initializeObstaclePool(50);
        
        console.log('[PulsarController] Boss initialized with optimized collision system');
    }
    
    /**
     * Initialize object pool for obstacles
     */
    initializeObstaclePool(size) {
        for (let i = 0; i < size; i++) {
            const obstacle = this.createPooledObstacle();
            obstacle.active = false;
            this.obstaclePool.push(obstacle);
        }
    }
    
    /**
     * Create pooled obstacle object
     */
    createPooledObstacle() {
        // Create kinematic body for obstacle
        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        const body = this.world.createRigidBody(bodyDesc);
        
        // Create collider
        const colliderDesc = RAPIER.ColliderDesc.ball(20)
            .setCollisionGroups(this.pulseConfig.optimization.collisionLayers)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        
        const collider = this.world.createCollider(colliderDesc, body);
        
        // Create visual sprite
        const sprite = this.scene.add.circle(0, 0, 20, 0xff0000, 0.6);
        sprite.setVisible(false);
        
        return {
            body,
            collider,
            sprite,
            active: false,
            pattern: null,
            data: {}
        };
    }
    
    /**
     * Get obstacle from pool
     */
    getObstacleFromPool() {
        let obstacle = this.obstaclePool.find(o => !o.active);
        
        if (!obstacle) {
            obstacle = this.createPooledObstacle();
            this.obstaclePool.push(obstacle);
        }
        
        obstacle.active = true;
        obstacle.sprite.setVisible(true);
        return obstacle;
    }
    
    /**
     * Return obstacle to pool
     */
    returnObstacleToPool(obstacle) {
        obstacle.active = false;
        obstacle.sprite.setVisible(false);
        obstacle.body.setTranslation({ x: -1000, y: -1000 }, true);
    }
    
    /**
     * Update boss and obstacles
     */
    update(deltaTime, playerPosition) {
        // Performance monitoring
        const now = performance.now();
        this.performance.frameTime = now - this.performance.lastUpdateTime;
        this.performance.lastUpdateTime = now;
        
        // Update boss state
        this.updateBossState(deltaTime, playerPosition);
        
        // Update pulsating patterns
        this.updatePulsePatterns(deltaTime);
        
        // Update spatial grid for optimization
        this.updateSpatialGrid();
        
        // Check collisions efficiently
        this.checkOptimizedCollisions(playerPosition);
        
        // Clean up inactive obstacles
        this.cleanupObstacles();
    }
    
    /**
     * Update boss state machine
     */
    updateBossState(deltaTime, playerPosition) {
        const now = performance.now();
        
        switch (this.state.phase) {
            case 'idle':
                if (now - this.state.lastPhaseChange > 2000) {
                    this.startPulseAttack('circular');
                }
                break;
                
            case 'pulsing':
                this.state.pulsePhase += deltaTime * 2;
                this.updateBossPosition(playerPosition, deltaTime);
                
                if (now - this.state.lastPhaseChange > 5000) {
                    this.state.phase = 'vulnerable';
                    this.state.lastPhaseChange = now;
                }
                break;
                
            case 'attacking':
                if (now - this.state.lastPhaseChange > 3000) {
                    this.state.phase = 'idle';
                    this.state.lastPhaseChange = now;
                }
                break;
                
            case 'vulnerable':
                if (now - this.state.lastPhaseChange > 2000) {
                    this.state.phase = 'idle';
                    this.state.lastPhaseChange = now;
                }
                break;
        }
    }
    
    /**
     * Start pulse attack pattern
     */
    startPulseAttack(patternType) {
        this.state.phase = 'pulsing';
        this.state.lastPhaseChange = performance.now();
        
        switch (patternType) {
            case 'circular':
                this.createCircularPattern();
                break;
            case 'spiral':
                this.createSpiralPattern();
                break;
            case 'shockwave':
                this.createShockwavePattern();
                break;
        }
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.BOSS_ATTACK_START, {
                pattern: patternType,
                position: this.state.position
            });
        }
    }
    
    /**
     * Create circular pulsating pattern
     */
    createCircularPattern() {
        const pattern = this.pulseConfig.patterns.circular;
        const angleStep = (Math.PI * 2) / pattern.count;
        
        for (let i = 0; i < pattern.count; i++) {
            const obstacle = this.getObstacleFromPool();
            const angle = angleStep * i;
            
            obstacle.pattern = 'circular';
            obstacle.data = {
                angle: angle,
                baseRadius: pattern.radius,
                phase: i * 0.5,  // Phase offset for wave effect
                speed: pattern.speed,
                sizeOscillation: pattern.sizeOscillation
            };
            
            this.obstacles.push(obstacle);
        }
    }
    
    /**
     * Create spiral pattern
     */
    createSpiralPattern() {
        const pattern = this.pulseConfig.patterns.spiral;
        
        for (let i = 0; i < pattern.count; i++) {
            const obstacle = this.getObstacleFromPool();
            
            obstacle.pattern = 'spiral';
            obstacle.data = {
                index: i,
                radius: pattern.radiusMin,
                angle: (i / pattern.count) * Math.PI * 2,
                rotationSpeed: pattern.rotationSpeed,
                expansionRate: pattern.expansionRate
            };
            
            this.obstacles.push(obstacle);
        }
    }
    
    /**
     * Create shockwave pattern
     */
    createShockwavePattern() {
        const pattern = this.pulseConfig.patterns.shockwave;
        
        for (let ring = 0; ring < pattern.rings; ring++) {
            this.scene.time.delayedCall(ring * pattern.interval, () => {
                this.createShockwaveRing(ring, pattern);
            });
        }
    }
    
    /**
     * Create single shockwave ring
     */
    createShockwaveRing(ringIndex, pattern) {
        const obstacleCount = 16;  // Obstacles per ring
        const angleStep = (Math.PI * 2) / obstacleCount;
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = this.getObstacleFromPool();
            const angle = angleStep * i;
            
            obstacle.pattern = 'shockwave';
            obstacle.data = {
                angle: angle,
                radius: 0,
                speed: pattern.speed,
                maxRadius: 600,
                thickness: pattern.thickness
            };
            
            this.obstacles.push(obstacle);
        }
    }
    
    /**
     * Update all pulse patterns
     */
    updatePulsePatterns(deltaTime) {
        const bossPos = this.state.position;
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (!obstacle.active) continue;
            
            switch (obstacle.pattern) {
                case 'circular':
                    this.updateCircularObstacle(obstacle, deltaTime, bossPos);
                    break;
                case 'spiral':
                    this.updateSpiralObstacle(obstacle, deltaTime, bossPos);
                    break;
                case 'shockwave':
                    this.updateShockwaveObstacle(obstacle, deltaTime, bossPos);
                    break;
            }
            
            // Update physics body position
            obstacle.body.setTranslation(
                { x: obstacle.sprite.x, y: obstacle.sprite.y },
                true
            );
        }
    }
    
    /**
     * Update circular pattern obstacle
     */
    updateCircularObstacle(obstacle, deltaTime, bossPos) {
        const data = obstacle.data;
        
        // Update phase for pulsation
        data.phase += data.speed * deltaTime;
        
        // Calculate pulsating radius
        const radiusMultiplier = 1 + Math.sin(data.phase) * data.sizeOscillation;
        const currentRadius = data.baseRadius * radiusMultiplier;
        
        // Update position
        const x = bossPos.x + Math.cos(data.angle + this.state.pulsePhase) * currentRadius;
        const y = bossPos.y + Math.sin(data.angle + this.state.pulsePhase) * currentRadius;
        
        obstacle.sprite.x = x;
        obstacle.sprite.y = y;
        
        // Update size based on pulse
        const sizeMultiplier = 0.8 + Math.sin(data.phase * 2) * 0.3;
        obstacle.sprite.setScale(sizeMultiplier);
        
        // Update collider size
        const newRadius = 20 * sizeMultiplier;
        this.world.removeCollider(obstacle.collider);
        obstacle.collider = this.world.createCollider(
            RAPIER.ColliderDesc.ball(newRadius)
                .setCollisionGroups(this.pulseConfig.optimization.collisionLayers),
            obstacle.body
        );
    }
    
    /**
     * Update spiral pattern obstacle
     */
    updateSpiralObstacle(obstacle, deltaTime, bossPos) {
        const data = obstacle.data;
        
        // Update angle and radius
        data.angle += data.rotationSpeed * deltaTime;
        data.radius += data.expansionRate * deltaTime;
        
        // Spiral outward
        const x = bossPos.x + Math.cos(data.angle) * data.radius;
        const y = bossPos.y + Math.sin(data.angle) * data.radius;
        
        obstacle.sprite.x = x;
        obstacle.sprite.y = y;
        
        // Remove if too far
        if (data.radius > this.pulseConfig.patterns.spiral.radiusMax) {
            this.removeObstacle(obstacle);
        }
    }
    
    /**
     * Update shockwave obstacle
     */
    updateShockwaveObstacle(obstacle, deltaTime, bossPos) {
        const data = obstacle.data;
        
        // Expand outward
        data.radius += data.speed * deltaTime;
        
        // Update position
        const x = bossPos.x + Math.cos(data.angle) * data.radius;
        const y = bossPos.y + Math.sin(data.angle) * data.radius;
        
        obstacle.sprite.x = x;
        obstacle.sprite.y = y;
        
        // Fade out as it expands
        obstacle.sprite.alpha = 1 - (data.radius / data.maxRadius);
        
        // Remove if reached max radius
        if (data.radius > data.maxRadius) {
            this.removeObstacle(obstacle);
        }
    }
    
    /**
     * Update spatial grid for collision optimization
     */
    updateSpatialGrid() {
        this.spatialGrid.clear();
        const gridSize = this.pulseConfig.optimization.spatialGridSize;
        
        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;
            
            const gridX = Math.floor(obstacle.sprite.x / gridSize);
            const gridY = Math.floor(obstacle.sprite.y / gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(obstacle);
        }
    }
    
    /**
     * Check collisions using spatial grid
     */
    checkOptimizedCollisions(playerPosition) {
        const gridSize = this.pulseConfig.optimization.spatialGridSize;
        const playerGridX = Math.floor(playerPosition.x / gridSize);
        const playerGridY = Math.floor(playerPosition.y / gridSize);
        
        // Check surrounding grid cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${playerGridX + dx},${playerGridY + dy}`;
                const obstacles = this.spatialGrid.get(key);
                
                if (obstacles) {
                    for (const obstacle of obstacles) {
                        this.checkCollisionWithPlayer(obstacle, playerPosition);
                    }
                }
            }
        }
    }
    
    /**
     * Check collision with player
     */
    checkCollisionWithPlayer(obstacle, playerPosition) {
        const dx = obstacle.sprite.x - playerPosition.x;
        const dy = obstacle.sprite.y - playerPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const obstacleRadius = obstacle.sprite.radius * obstacle.sprite.scaleX;
        const playerRadius = 32;  // Player hitbox radius
        
        if (distance < obstacleRadius + playerRadius) {
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.BOSS_HIT_PLAYER, {
                    damage: 10,
                    knockback: { x: -dx / distance * 500, y: -dy / distance * 500 },
                    position: { x: obstacle.sprite.x, y: obstacle.sprite.y }
                });
            }
        }
    }
    
    /**
     * Update boss position (tracking player)
     */
    updateBossPosition(playerPosition, deltaTime) {
        const speed = 100;
        const dx = playerPosition.x - this.state.position.x;
        const dy = playerPosition.y - this.state.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 300) {  // Keep distance from player
            this.state.position.x += (dx / distance) * speed * deltaTime;
            this.state.position.y += (dy / distance) * speed * deltaTime;
            
            this.bossBody.setTranslation(this.state.position, true);
        }
    }
    
    /**
     * Remove obstacle and return to pool
     */
    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
        this.returnObstacleToPool(obstacle);
    }
    
    /**
     * Clean up inactive obstacles
     */
    cleanupObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (!this.obstacles[i].active) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.state.phase !== 'vulnerable') return;
        
        this.state.health -= amount;
        
        if (this.state.health <= 0) {
            this.defeat();
        }
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.BOSS_DAMAGED, {
                damage: amount,
                remainingHealth: this.state.health
            });
        }
    }
    
    /**
     * Defeat the boss
     */
    defeat() {
        // Clear all obstacles
        for (const obstacle of this.obstacles) {
            this.returnObstacleToPool(obstacle);
        }
        this.obstacles = [];
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.BOSS_DEFEATED, {
                position: this.state.position
            });
        }
    }
}