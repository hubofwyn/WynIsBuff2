import { BirthdayConfig, BirthdayEvents } from './BirthdayConfig';

/**
 * BirthdayGameManager - Central game state management and logic
 * This is the API for the birthday minigame
 */
export class BirthdayGameManager {
    constructor(scene) {
        this.scene = scene;
        this.config = BirthdayConfig;
        
        // Core game state
        this.score = 0;
        this.deliveries = 0;
        this.lives = this.config.Lives.Starting;
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        
        // Timing state
        this.gameTime = 0;
        this.pickupTime = 0;
        this.deliveryStartTime = 0;
        
        // Combo and streak tracking
        this.combo = 0;
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        this.missStreak = 0;
        this.perfectDeliveries = 0;
        
        // Speed and difficulty
        this.speedLevel = 1;
        this.speedMultiplier = 1.0;
        this.difficultyLevel = 1;
        
        // Power-up state
        this.activePowerUps = new Map();
        this.shieldActive = false;
        this.speedBoostActive = false;
        this.magnetActive = false;
        
        // Statistics for end screen
        this.stats = {
            totalPoints: 0,
            perfectDeliveries: 0,
            maxCombo: 0,
            nearMisses: 0,
            obstaclesHit: 0,
            powerUpsCollected: 0,
            totalDistance: 0
        };
        
        // High score
        this.highScore = this.loadHighScore();
    }
    
    /**
     * Start the game
     */
    startGame() {
        this.gameStarted = true;
        this.gameTime = 0;
        this.scene.events.emit(BirthdayEvents.GAME_START);
    }
    
    /**
     * Update game time
     * @param {number} delta - Time since last frame in ms
     */
    updateTime(delta) {
        if (!this.gameStarted || this.gameOver || this.paused) return;
        
        this.gameTime += delta;
        this.stats.totalDistance += (this.config.Scrolling.BaseSpeedPxPerSec * this.speedMultiplier * delta) / 1000;
        
        // Update power-up timers
        this.updatePowerUps(delta);
        
        // Check delivery timer
        if (this.deliveryStartTime > 0) {
            const deliveryTime = this.gameTime - this.deliveryStartTime;
            if (deliveryTime > this.config.Scoring.MaxDeliveryTimeMs) {
                this.dropParcel();
            }
        }
    }
    
    /**
     * Handle parcel pickup
     */
    pickupParcel() {
        this.pickupTime = this.gameTime;
        this.deliveryStartTime = this.gameTime;
        this.scene.events.emit(BirthdayEvents.PARCEL_PICKUP);
    }
    
    /**
     * Handle parcel drop (timeout or obstacle hit)
     */
    dropParcel() {
        this.deliveryStartTime = 0;
        this.breakCombo();
        this.missStreak++;
        
        if (this.missStreak >= this.config.Lives.MissStreakGameOver) {
            this.endGame();
        }
    }
    
    /**
     * Handle successful delivery
     * @returns {Object} Delivery result with points breakdown
     */
    makeDelivery() {
        const deliveryTime = (this.gameTime - this.deliveryStartTime) / 1000;
        this.deliveryStartTime = 0;
        
        // Calculate points
        let basePoints = this.config.Scoring.Points.ShakeShake;
        let speedBonus = this.calculateSpeedBonus(deliveryTime);
        let comboBonus = this.calculateComboBonus();
        let streakBonus = this.deliveryStreak * this.config.Scoring.Points.StreakBonus;
        
        const totalPoints = Math.floor(
            (basePoints * speedBonus) + comboBonus + streakBonus
        );
        
        // Update state
        this.deliveries++;
        this.score += totalPoints;
        this.stats.totalPoints += totalPoints;
        this.deliveryStreak++;
        this.missStreak = 0;
        this.combo++;
        
        // Track perfect deliveries
        if (deliveryTime < this.config.Scoring.PerfectWindowMs / 1000) {
            this.perfectDeliveries++;
            this.stats.perfectDeliveries++;
        }
        
        // Update max combo
        if (this.combo > this.stats.maxCombo) {
            this.stats.maxCombo = this.combo;
        }
        
        // Increase difficulty
        this.updateDifficulty();
        
        // Emit event with delivery details
        const result = {
            deliveryNumber: this.deliveries,
            basePoints,
            speedBonus,
            comboBonus,
            streakBonus,
            totalPoints,
            deliveryTime,
            isPerfect: deliveryTime < this.config.Scoring.PerfectWindowMs / 1000
        };
        
        this.scene.events.emit(BirthdayEvents.DELIVERY_MADE, result);
        
        // Check win condition
        if (this.deliveries >= this.config.Scoring.DeliveryGoal) {
            this.winGame();
        }
        
        return result;
    }
    
    /**
     * Calculate speed bonus based on delivery time
     */
    calculateSpeedBonus(deliveryTime) {
        const { SpeedBonus } = this.config.Scoring;
        
        if (deliveryTime < SpeedBonus.FastThresholdSec) {
            return SpeedBonus.FastMultiplier;
        } else if (deliveryTime < SpeedBonus.QuickThresholdSec) {
            return SpeedBonus.QuickMultiplier;
        }
        return SpeedBonus.NormalMultiplier;
    }
    
    /**
     * Calculate combo bonus
     */
    calculateComboBonus() {
        if (this.combo <= 0) return 0;
        return Math.floor(100 * Math.pow(this.combo, this.config.Scoring.Points.ComboExponent));
    }
    
    /**
     * Handle obstacle collision
     */
    hitObstacle() {
        if (this.shieldActive) {
            this.scene.events.emit(BirthdayEvents.OBSTACLE_HIT, { blocked: true });
            return false; // Blocked by shield
        }
        
        this.lives--;
        this.stats.obstaclesHit++;
        this.breakCombo();
        
        this.scene.events.emit(BirthdayEvents.OBSTACLE_HIT, { blocked: false });
        this.scene.events.emit(BirthdayEvents.LIVES_UPDATE, this.lives);
        
        if (this.lives <= 0) {
            this.endGame();
        }
        
        return true; // Hit registered
    }
    
    /**
     * Handle near miss
     */
    registerNearMiss() {
        this.nearMissStreak++;
        this.stats.nearMisses++;
        
        // Award points for near miss chains
        if (this.nearMissStreak >= 3) {
            const bonusPoints = this.nearMissStreak * this.config.Scoring.Points.NearMissChain;
            this.score += bonusPoints;
            this.stats.totalPoints += bonusPoints;
            
            this.scene.events.emit(BirthdayEvents.SCORE_UPDATE, {
                score: this.score,
                bonus: bonusPoints,
                reason: 'Near Miss Chain'
            });
        }
    }
    
    /**
     * Break combo
     */
    breakCombo() {
        if (this.combo > 0) {
            this.combo = 0;
            this.deliveryStreak = 0;
            this.nearMissStreak = 0;
            this.scene.events.emit(BirthdayEvents.COMBO_BREAK);
        }
    }
    
    /**
     * Collect power-up
     * @param {string} type - Type of power-up
     */
    collectPowerUp(type) {
        const powerUp = this.config.PowerUps.Types[type];
        if (!powerUp) return;
        
        this.stats.powerUpsCollected++;
        
        if (powerUp.IsInstant) {
            // Instant effect (like cake bonus)
            this.score += powerUp.BonusPoints;
            this.stats.totalPoints += powerUp.BonusPoints;
        } else {
            // Timed effect
            this.activePowerUps.set(type, powerUp.DurationMs);
            
            // Apply power-up effects
            switch(type) {
                case 'Shield':
                    this.shieldActive = true;
                    break;
                case 'Speed':
                    this.speedBoostActive = true;
                    this.speedMultiplier *= powerUp.SpeedMultiplier;
                    break;
                case 'Magnet':
                    this.magnetActive = true;
                    break;
            }
        }
        
        this.scene.events.emit(BirthdayEvents.POWERUP_COLLECTED, { type, powerUp });
    }
    
    /**
     * Update power-up timers
     */
    updatePowerUps(delta) {
        for (const [type, remaining] of this.activePowerUps.entries()) {
            const newTime = remaining - delta;
            
            if (newTime <= 0) {
                // Power-up expired
                this.activePowerUps.delete(type);
                this.deactivatePowerUp(type);
            } else {
                this.activePowerUps.set(type, newTime);
            }
        }
    }
    
    /**
     * Deactivate power-up
     */
    deactivatePowerUp(type) {
        const powerUp = this.config.PowerUps.Types[type];
        
        switch(type) {
            case 'Shield':
                this.shieldActive = false;
                break;
            case 'Speed':
                this.speedBoostActive = false;
                this.speedMultiplier /= powerUp.SpeedMultiplier;
                break;
            case 'Magnet':
                this.magnetActive = false;
                break;
        }
    }
    
    /**
     * Update difficulty based on progress
     */
    updateDifficulty() {
        this.speedLevel = Math.min(this.deliveries + 1, 10);
        this.speedMultiplier = 1.0 + (this.deliveries * this.config.Scrolling.SpeedIncreasePerDelivery);
        this.difficultyLevel = Math.floor(this.deliveries / 3) + 1;
        
        this.scene.events.emit(BirthdayEvents.SPEED_INCREASE, {
            speedLevel: this.speedLevel,
            speedMultiplier: this.speedMultiplier,
            difficultyLevel: this.difficultyLevel
        });
    }
    
    /**
     * Win the game
     */
    winGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Calculate final score with bonuses
        const completionBonus = 1000;
        const livesBonus = this.lives * 200;
        this.score += completionBonus + livesBonus;
        this.stats.totalPoints = this.score;
        
        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.scene.events.emit(BirthdayEvents.GAME_COMPLETE, {
            score: this.score,
            stats: this.stats,
            isHighScore: this.score >= this.highScore
        });
    }
    
    /**
     * End the game (loss)
     */
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Save high score if applicable
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.scene.events.emit(BirthdayEvents.GAME_OVER, {
            score: this.score,
            deliveries: this.deliveries,
            stats: this.stats,
            isHighScore: this.score >= this.highScore
        });
    }
    
    /**
     * Pause the game
     */
    pause() {
        this.paused = true;
    }
    
    /**
     * Resume the game
     */
    resume() {
        this.paused = false;
    }
    
    /**
     * Reset the game state
     */
    reset() {
        this.score = 0;
        this.deliveries = 0;
        this.lives = this.config.Lives.Starting;
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        
        this.gameTime = 0;
        this.pickupTime = 0;
        this.deliveryStartTime = 0;
        
        this.combo = 0;
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        this.missStreak = 0;
        this.perfectDeliveries = 0;
        
        this.speedLevel = 1;
        this.speedMultiplier = 1.0;
        this.difficultyLevel = 1;
        
        this.activePowerUps.clear();
        this.shieldActive = false;
        this.speedBoostActive = false;
        this.magnetActive = false;
        
        // Reset stats
        this.stats = {
            totalPoints: 0,
            perfectDeliveries: 0,
            maxCombo: 0,
            nearMisses: 0,
            obstaclesHit: 0,
            powerUpsCollected: 0,
            totalDistance: 0
        };
    }
    
    /**
     * Load high score from storage
     */
    loadHighScore() {
        return parseInt(localStorage.getItem('birthdayHighScore') || '0');
    }
    
    /**
     * Save high score to storage
     */
    saveHighScore() {
        localStorage.setItem('birthdayHighScore', this.highScore.toString());
    }
    
    /**
     * Get current game state
     */
    getState() {
        return {
            score: this.score,
            deliveries: this.deliveries,
            lives: this.lives,
            combo: this.combo,
            speedMultiplier: this.speedMultiplier,
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            paused: this.paused,
            activePowerUps: Array.from(this.activePowerUps.keys())
        };
    }
    
    /**
     * Destroy the manager
     */
    destroy() {
        this.activePowerUps.clear();
    }
}