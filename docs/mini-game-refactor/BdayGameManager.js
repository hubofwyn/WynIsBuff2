/**
 * BdayGameManager - The brain of the birthday minigame
 * Manages all game state and emits events for UI updates
 * This is the API that your main game will talk to
 */
import { BdayConfig } from './BdayConfig.js';

// Event names for the birthday minigame
export const BdayEvents = Object.freeze({
    // Score events
    SCORE_UPDATED: 'bday:score:updated',
    HIGH_SCORE_UPDATED: 'bday:highscore:updated',
    COMBO_UPDATED: 'bday:combo:updated',
    
    // Game state events
    LIVES_UPDATED: 'bday:lives:updated',
    DELIVERY_MADE: 'bday:delivery:made',
    DELIVERY_MISSED: 'bday:delivery:missed',
    
    // Pickup/carry events
    PARCEL_PICKED_UP: 'bday:parcel:pickup',
    PARCEL_DROPPED: 'bday:parcel:dropped',
    DELIVERY_TIMER_UPDATE: 'bday:timer:update',
    
    // Game flow events
    GAME_STARTED: 'bday:game:started',
    GAME_OVER: 'bday:game:over',
    BIRTHDAY_COMPLETE: 'bday:birthday:complete', // All 9 deliveries!
    
    // Streak events
    PERFECT_STREAK: 'bday:streak:perfect',
    NEAR_MISS_STREAK: 'bday:streak:nearmiss',
    
    // Speed/difficulty events
    SPEED_INCREASED: 'bday:speed:increased',
    DIFFICULTY_INCREASED: 'bday:difficulty:increased'
});

export class BdayGameManager {
    constructor(scene) {
        this.scene = scene;
        this.events = scene.events; // Use scene's event emitter
        
        // Core game state
        this.score = 0;
        this.deliveries = 0;
        this.lives = BdayConfig.Lives.Starting;
        this.gameOver = false;
        this.gameStarted = false;
        
        // Combo and streak tracking
        this.combo = 0;
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        this.perfectDeliveries = 0;
        this.missStreak = 0;
        
        // Speed and difficulty
        this.speedMultiplier = 1.0;
        this.speedLevel = 1;
        this.difficultyLevel = 1;
        
        // Delivery timing
        this.isCarrying = false;
        this.carriedType = null;
        this.carriedPoints = 0;
        this.pickupTime = 0;
        this.deliveryTimer = 0;
        
        // High score
        this.highScore = this.loadHighScore();
        
        // Leaderboard
        this.leaderboard = this.loadLeaderboard();
        
        // Timer for delivery countdown
        this.deliveryTimerEvent = null;
    }
    
    // ========== Game Flow ==========
    
    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        this.events.emit(BdayEvents.GAME_STARTED);
        
        // Start the delivery timer loop
        this.startDeliveryTimer();
    }
    
    endGame() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        this.stopDeliveryTimer();
        this.saveToLeaderboard();
        
        // Check if it's a birthday win (9 deliveries)
        if (this.deliveries >= BdayConfig.Scoring.DeliveryGoal) {
            this.events.emit(BdayEvents.BIRTHDAY_COMPLETE, {
                score: this.score,
                deliveries: this.deliveries
            });
        } else {
            this.events.emit(BdayEvents.GAME_OVER, {
                score: this.score,
                deliveries: this.deliveries,
                isNewHighScore: this.score > this.highScore
            });
        }
    }
    
    // ========== Score Management ==========
    
    addPoints(basePoints, bonusType = null) {
        const oldScore = this.score;
        this.score += basePoints;
        
        // Check for high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.events.emit(BdayEvents.HIGH_SCORE_UPDATED, this.highScore);
        }
        
        this.events.emit(BdayEvents.SCORE_UPDATED, {
            score: this.score,
            pointsAdded: basePoints,
            bonusType: bonusType
        });
    }
    
    // ========== Lives Management ==========
    
    loseLife() {
        this.lives--;
        this.events.emit(BdayEvents.LIVES_UPDATED, this.lives);
        
        if (this.lives <= 0) {
            this.endGame();
        }
    }
    
    // ========== Parcel/Delivery Management ==========
    
    pickupParcel(type = 'protein', points = 100) {
        this.isCarrying = true;
        this.carriedType = type;
        this.carriedPoints = points;
        this.pickupTime = this.scene.time.now;
        this.deliveryTimer = BdayConfig.Scoring.MaxDeliveryTimeMs;
        
        this.events.emit(BdayEvents.PARCEL_PICKED_UP, {
            type: type,
            points: points
        });
    }
    
    dropParcel() {
        if (!this.isCarrying) return;
        
        this.isCarrying = false;
        this.carriedType = null;
        this.carriedPoints = 0;
        this.deliveryTimer = 0;
        
        // Reset streaks
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        
        this.events.emit(BdayEvents.PARCEL_DROPPED);
        
        // Lose a life when dropping
        this.loseLife();
    }
    
    makeDelivery() {
        if (!this.isCarrying) return false;
        
        // Calculate time bonus
        const timeCarried = this.scene.time.now - this.pickupTime;
        const timeLeft = this.deliveryTimer / 1000;
        
        // Determine delivery quality and speed bonus
        let quality = 'normal';
        let speedMultiplier = BdayConfig.Scoring.SpeedBonus.NormalMultiplier;
        
        if (timeCarried < BdayConfig.Scoring.PerfectWindowMs) {
            quality = 'perfect';
            this.perfectDeliveries++;
            speedMultiplier = BdayConfig.Scoring.SpeedBonus.FastMultiplier;
        } else if (timeCarried < BdayConfig.Scoring.GoodWindowMs) {
            quality = 'good';
            speedMultiplier = BdayConfig.Scoring.SpeedBonus.QuickMultiplier;
        }
        
        // Calculate points
        this.combo++;
        const basePoints = this.carriedPoints;
        const timeBonus = Math.floor(timeLeft * BdayConfig.Scoring.Points.TimeBonus);
        const comboBonus = Math.floor(Math.pow(this.combo, BdayConfig.Scoring.Points.ComboExponent) * 50);
        const perfectBonus = this.perfectDeliveries > 2 ? this.perfectDeliveries * 100 : 0;
        const speedBonus = (speedMultiplier - 1) * 50;
        const totalPoints = Math.floor(basePoints + timeBonus + comboBonus + perfectBonus + speedBonus);
        
        // Update state
        this.deliveries++;
        this.deliveryStreak++;
        this.addPoints(totalPoints, 'delivery');
        
        // Clear carry state
        const deliveredType = this.carriedType;
        this.isCarrying = false;
        this.carriedType = null;
        this.carriedPoints = 0;
        this.deliveryTimer = 0;
        
        // Increase difficulty
        this.increaseDifficulty();
        
        // Emit event with all the details
        this.events.emit(BdayEvents.DELIVERY_MADE, {
            quality: quality,
            type: deliveredType,
            deliveryNumber: this.deliveries,
            points: {
                total: totalPoints,
                base: basePoints,
                time: timeBonus,
                combo: comboBonus,
                perfect: perfectBonus,
                speed: speedBonus
            },
            speedMultiplier: speedMultiplier,
            combo: this.combo
        });
        
        // Update combo event
        this.events.emit(BdayEvents.COMBO_UPDATED, this.combo);
        
        // Check for perfect streak
        if (this.perfectDeliveries > 2) {
            this.events.emit(BdayEvents.PERFECT_STREAK, this.perfectDeliveries);
        }
        
        // Check if we've hit the birthday goal!
        if (this.deliveries >= BdayConfig.Scoring.DeliveryGoal) {
            this.endGame();
        }
        
        return true;
    }
    
    missParcel() {
        this.missStreak++;
        this.combo = 0;
        this.perfectDeliveries = 0;
        
        this.events.emit(BdayEvents.DELIVERY_MISSED, this.missStreak);
        this.events.emit(BdayEvents.COMBO_UPDATED, 0);
        
        if (this.missStreak >= BdayConfig.Lives.MissStreakGameOver) {
            this.endGame();
        }
    }
    
    // ========== Near Miss Tracking ==========
    
    registerNearMiss() {
        this.nearMissStreak++;
        
        // Bonus points for chain of near misses
        if (this.nearMissStreak >= 3) {
            const bonusPoints = BdayConfig.Scoring.Points.NearMissChain * this.nearMissStreak;
            this.addPoints(bonusPoints, 'nearmiss');
        }
        
        this.events.emit(BdayEvents.NEAR_MISS_STREAK, this.nearMissStreak);
    }
    
    // ========== Difficulty Management ==========
    
    increaseDifficulty() {
        this.speedMultiplier += BdayConfig.Scrolling.SpeedIncreasePerDelivery;
        this.speedLevel++;
        this.difficultyLevel = Math.min(5, Math.floor(this.score / 2) + 1);
        
        this.events.emit(BdayEvents.SPEED_INCREASED, this.speedMultiplier);
        this.events.emit(BdayEvents.DIFFICULTY_INCREASED, this.difficultyLevel);
    }
    
    getSpeedMultiplier() {
        return this.speedMultiplier;
    }
    
    // ========== Timer Management ==========
    
    startDeliveryTimer() {
        // Update every 100ms
        this.deliveryTimerEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.gameOver && this.isCarrying) {
                    this.deliveryTimer -= 100;
                    
                    this.events.emit(BdayEvents.DELIVERY_TIMER_UPDATE, {
                        timeRemaining: this.deliveryTimer,
                        timeRemainingSeconds: Math.ceil(this.deliveryTimer / 1000)
                    });
                    
                    if (this.deliveryTimer <= 0) {
                        this.dropParcel();
                    }
                }
            },
            loop: true
        });
    }
    
    stopDeliveryTimer() {
        if (this.deliveryTimerEvent) {
            this.deliveryTimerEvent.destroy();
            this.deliveryTimerEvent = null;
        }
    }
    
    // ========== Persistence ==========
    
    loadHighScore() {
        return parseInt(localStorage.getItem('birthdayHighScore') || '0');
    }
    
    saveHighScore() {
        localStorage.setItem('birthdayHighScore', this.highScore.toString());
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('birthdayLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveToLeaderboard() {
        const entry = {
            score: this.score,
            deliveries: this.deliveries,
            combo: this.combo,
            date: new Date().toLocaleDateString()
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
        
        localStorage.setItem('birthdayLeaderboard', JSON.stringify(this.leaderboard));
    }
    
    getLeaderboard() {
        return this.leaderboard;
    }
    
    // ========== Cleanup ==========
    
    destroy() {
        this.stopDeliveryTimer();
        // Remove all event listeners if needed
        this.events.removeAllListeners();
    }
}
