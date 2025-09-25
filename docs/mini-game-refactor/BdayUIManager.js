/**
 * BdayUIManager - Handles all UI elements and responds to game events
 * Completely decoupled from game logic through event listeners
 * CRITICAL: Always clean up event listeners in destroy()
 */
import { BdayConfig } from './BdayConfig.js';
import { BdayEvents } from './BdayGameManager.js';

export class BdayUIManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        
        // UI element references
        this.scoreText = null;
        this.pointsText = null;
        this.highScoreText = null;
        this.comboText = null;
        this.timerText = null;
        this.livesContainer = null;
        this.speedBonusText = null;
        this.perfectStreakText = null;
        
        // Create all UI elements
        this.createUI();
        
        // Setup event listeners - CRITICAL: Store references for cleanup
        this.setupEventListeners();
        
        // Initial UI state
        this.updateInitialState();
    }
    
    createUI() {
        // Score panel background
        const uiPanel = this.scene.add.graphics();
        uiPanel.fillStyle(0x000000, 0.8);
        uiPanel.fillRoundedRect(
            BdayConfig.UI.ScorePanelX,
            BdayConfig.UI.ScorePanelY,
            BdayConfig.UI.ScorePanelWidth,
            BdayConfig.UI.ScorePanelHeight,
            10
        );
        
        // Deliveries count with icon
        this.scene.add.text(35, 30, '🧨', {
            fontSize: BdayConfig.UI.FontSizes.Timer
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.scoreText = this.scene.add.text(70, 30, 'Deliveries: 0/9', {
            fontSize: BdayConfig.UI.FontSizes.Score,
            color: BdayConfig.UI.Colors.Gold,
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        // Points display
        this.pointsText = this.scene.add.text(35, 65, 'Points: 0', {
            fontSize: BdayConfig.UI.FontSizes.Points,
            color: BdayConfig.UI.Colors.White,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0);
        
        // High score
        this.highScoreText = this.scene.add.text(35, 90, `High Score: ${this.gameManager.highScore}`, {
            fontSize: BdayConfig.UI.FontSizes.Instructions,
            color: BdayConfig.UI.Colors.Gold,
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Combo display
        this.comboText = this.scene.add.text(35, 115, '', {
            fontSize: BdayConfig.UI.FontSizes.Combo,
            color: BdayConfig.UI.Colors.Green,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0);
        
        // Speed bonus indicator
        this.speedBonusText = this.scene.add.text(35, 140, '', {
            fontSize: BdayConfig.UI.FontSizes.Instructions,
            color: BdayConfig.UI.Colors.Cyan,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Timer
        const timerBg = this.scene.add.rectangle(
            BdayConfig.UI.TimerX,
            BdayConfig.UI.TimerY,
            200, 50,
            0x000000, 0.7
        );
        timerBg.setStrokeStyle(3, 0xFFFFFF).setScrollFactor(0);
        
        this.timerText = this.scene.add.text(
            BdayConfig.UI.TimerX,
            BdayConfig.UI.TimerY,
            'Find S² Shake!',
            {
                fontSize: BdayConfig.UI.FontSizes.Timer,
                color: BdayConfig.UI.Colors.Green,
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Lives display
        this.livesContainer = this.scene.add.container(
            BdayConfig.UI.LivesX,
            BdayConfig.UI.LivesY
        ).setScrollFactor(0);
        
        // Perfect streak
        this.perfectStreakText = this.scene.add.text(35, 165, '', {
            fontSize: '16px',
            color: BdayConfig.UI.Colors.Gold,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Instructions at bottom
        this.scene.add.text(512, 740, '↑/↓ or W/S: Change Lanes | ←/→ or A/D: Move | SPACE: Dash', {
            fontSize: BdayConfig.UI.FontSizes.Instructions,
            color: BdayConfig.UI.Colors.White,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    setupEventListeners() {
        // Store bound functions for cleanup
        this.boundUpdateScore = this.updateScore.bind(this);
        this.boundUpdateLives = this.updateLives.bind(this);
        this.boundUpdateCombo = this.updateCombo.bind(this);
        this.boundUpdateHighScore = this.updateHighScore.bind(this);
        this.boundOnDelivery = this.onDeliveryMade.bind(this);
        this.boundOnParcelPickup = this.onParcelPickup.bind(this);
        this.boundOnParcelDropped = this.onParcelDropped.bind(this);
        this.boundUpdateTimer = this.updateTimer.bind(this);
        this.boundOnPerfectStreak = this.onPerfectStreak.bind(this);
        this.boundOnGameOver = this.onGameOver.bind(this);
        this.boundOnBirthdayComplete = this.onBirthdayComplete.bind(this);
        this.boundOnDeliveryMissed = this.onDeliveryMissed.bind(this);
        
        // Listen to game events
        this.scene.events.on(BdayEvents.SCORE_UPDATED, this.boundUpdateScore);
        this.scene.events.on(BdayEvents.LIVES_UPDATED, this.boundUpdateLives);
        this.scene.events.on(BdayEvents.COMBO_UPDATED, this.boundUpdateCombo);
        this.scene.events.on(BdayEvents.HIGH_SCORE_UPDATED, this.boundUpdateHighScore);
        this.scene.events.on(BdayEvents.DELIVERY_MADE, this.boundOnDelivery);
        this.scene.events.on(BdayEvents.PARCEL_PICKED_UP, this.boundOnParcelPickup);
        this.scene.events.on(BdayEvents.PARCEL_DROPPED, this.boundOnParcelDropped);
        this.scene.events.on(BdayEvents.DELIVERY_TIMER_UPDATE, this.boundUpdateTimer);
        this.scene.events.on(BdayEvents.PERFECT_STREAK, this.boundOnPerfectStreak);
        this.scene.events.on(BdayEvents.GAME_OVER, this.boundOnGameOver);
        this.scene.events.on(BdayEvents.BIRTHDAY_COMPLETE, this.boundOnBirthdayComplete);
        this.scene.events.on(BdayEvents.DELIVERY_MISSED, this.boundOnDeliveryMissed);
    }
    
    updateInitialState() {
        this.updateScore({ score: 0 });
        this.updateLives(this.gameManager.lives);
        this.scoreText.setText(`Deliveries: 0/${BdayConfig.Scoring.DeliveryGoal}`);
    }
    
    // ========== Event Handlers ==========
    
    updateScore(data) {
        const score = typeof data === 'number' ? data : data.score;
        this.pointsText.setText(`Points: ${score}`);
        
        // Animate on score change
        if (data.pointsAdded) {
            this.showPointsPopup(data.pointsAdded, 512, 300);
        }
    }
    
    updateLives(lives) {
        this.livesContainer.removeAll(true);
        
        const livesText = this.scene.add.text(0, 0, 'Lives: ', {
            fontSize: '20px',
            color: BdayConfig.UI.Colors.White,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.livesContainer.add(livesText);
        
        // Show hearts for remaining lives
        for (let i = 0; i < BdayConfig.Lives.Starting; i++) {
            const heart = this.scene.add.text(60 + i * 25, 0, 
                i < lives ? '❤️' : '💔', 
                { fontSize: '20px' }
            ).setOrigin(0.5);
            this.livesContainer.add(heart);
        }
    }
    
    updateCombo(combo) {
        if (combo > 1) {
            this.comboText.setText(`${combo}x COMBO!`);
            const color = combo > 5 ? BdayConfig.UI.Colors.Gold : 
                         combo > 3 ? BdayConfig.UI.Colors.Cyan : 
                         BdayConfig.UI.Colors.Green;
            this.comboText.setColor(color);
            
            // Animate combo text
            this.scene.tweens.add({
                targets: this.comboText,
                scale: { from: 1.2, to: 1 },
                duration: 300,
                ease: 'Back.Out'
            });
        } else {
            this.comboText.setText('');
        }
    }
    
    updateHighScore(highScore) {
        this.highScoreText.setText(`High Score: ${highScore}`);
        this.highScoreText.setColor(BdayConfig.UI.Colors.Green);
        
        // Flash animation
        this.scene.tweens.add({
            targets: this.highScoreText,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 2
        });
    }
    
    onDeliveryMade(data) {
        // Update delivery count
        this.scoreText.setText(`Deliveries: ${data.deliveryNumber}/${BdayConfig.Scoring.DeliveryGoal}`);
        
        // Show detailed points breakdown
        this.showDetailedPointsPopup(data.points);
        
        // Show delivery message
        let message = '';
        if (data.speedMultiplier > 2) {
            message = `FAST ${data.type === 'shakeshake' ? 'S² SHAKE' : 'PROTEIN SHAKE'}! x${data.speedMultiplier}`;
        } else if (data.type === 'shakeshake') {
            message = '✨ SPECIAL S² SHAKE! ✨';
        } else if (data.deliveryNumber === BdayConfig.Scoring.DeliveryGoal) {
            message = '9TH DELIVERY! 🎉';
        } else {
            message = `${data.deliveryNumber}/${BdayConfig.Scoring.DeliveryGoal} DELIVERIES!`;
        }
        
        const color = data.speedMultiplier > 2 ? BdayConfig.UI.Colors.Gold :
                     data.speedMultiplier > 1 ? BdayConfig.UI.Colors.Cyan :
                     BdayConfig.UI.Colors.Green;
        
        this.showMessage(message, color);
    }
    
    onParcelPickup(data) {
        this.timerText.setText('DELIVER NOW!');
        this.timerText.setColor(BdayConfig.UI.Colors.Gold);
        
        // Show pickup message
        this.showFloatingText(
            this.scene.player.x,
            this.scene.player.y - 80,
            'GO GO GO!',
            BdayConfig.UI.Colors.Green
        );
    }
    
    onParcelDropped() {
        this.timerText.setText('Time Out! -1 ❤️');
        this.timerText.setColor(BdayConfig.UI.Colors.Red);
        
        this.scene.time.delayedCall(1000, () => {
            this.timerText.setText('Find S² Shake!');
            this.timerText.setColor(BdayConfig.UI.Colors.Green);
        });
    }
    
    updateTimer(data) {
        if (this.gameManager.isCarrying) {
            const seconds = data.timeRemainingSeconds;
            const color = seconds <= 3 ? BdayConfig.UI.Colors.Red :
                         seconds <= 5 ? '#FFFF00' :
                         BdayConfig.UI.Colors.Green;
            
            this.timerText.setText(`Deliver: ${seconds}s`);
            this.timerText.setColor(color);
            
            // Pulse urgently if low time
            if (seconds <= 3 && !this.timerPulseTween) {
                this.timerPulseTween = this.scene.tweens.add({
                    targets: this.timerText,
                    scale: { from: 1, to: 1.2 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else {
            // Stop pulsing
            if (this.timerPulseTween) {
                this.timerPulseTween.stop();
                this.timerPulseTween = null;
                this.timerText.setScale(1);
            }
        }
    }
    
    onPerfectStreak(count) {
        this.perfectStreakText.setText(`Perfect Streak: ${count}!`);
        
        // Animate streak text
        this.scene.tweens.add({
            targets: this.perfectStreakText,
            scale: { from: 1.2, to: 1 },
            duration: 300,
            ease: 'Back.Out'
        });
    }
    
    onDeliveryMissed(missStreak) {
        this.showMessage('DELIVERY MISSED!', BdayConfig.UI.Colors.Red, 36);
        
        // Clear combo and streak displays
        this.comboText.setText('');
        this.perfectStreakText.setText('');
    }
    
    onGameOver(data) {
        this.showGameOverScreen(data);
    }
    
    onBirthdayComplete(data) {
        this.showBirthdaySurprise(data);
    }
    
    // ========== UI Helper Methods ==========
    
    showMessage(text, color, fontSize = 48) {
        const message = this.scene.add.text(512, 200, text, {
            fontSize: `${fontSize}px`,
            color: color,
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: message,
            y: 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }
    
    showFloatingText(x, y, text, color) {
        const floatingText = this.scene.add.text(x, y, text, {
            fontSize: '24px',
            color: color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: floatingText,
            y: '-=30',
            alpha: 0,
            duration: 800,
            onComplete: () => floatingText.destroy()
        });
    }
    
    showPointsPopup(points, x, y) {
        const pointsText = this.scene.add.text(x, y, `+${points}`, {
            fontSize: '32px',
            color: BdayConfig.UI.Colors.Gold,
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: pointsText,
            y: y - 60,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2.Out',
            onComplete: () => pointsText.destroy()
        });
    }
    
    showDetailedPointsPopup(points) {
        const popupContainer = this.scene.add.container(
            BdayConfig.DeliveryZone.XPosition - 100,
            400
        );
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 200, 150, 0x000000, 0.8);
        bg.setStrokeStyle(3, 0xFFD700);
        popupContainer.add(bg);
        
        // Total points
        const totalText = this.scene.add.text(0, -60, `+${points.total}`, {
            fontSize: '36px',
            color: BdayConfig.UI.Colors.Gold,
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        popupContainer.add(totalText);
        
        // Breakdown
        let y = -20;
        const addLine = (label, value, color = BdayConfig.UI.Colors.White) => {
            if (value > 0) {
                const text = this.scene.add.text(0, y, `${label}: +${value}`, {
                    fontSize: '16px',
                    color: color,
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                popupContainer.add(text);
                y += 20;
            }
        };
        
        addLine('Base', points.base);
        addLine('Time', points.time, BdayConfig.UI.Colors.Cyan);
        if (points.combo > 0) addLine('Combo', points.combo, BdayConfig.UI.Colors.Green);
        if (points.perfect > 0) addLine('Perfect!', points.perfect, BdayConfig.UI.Colors.Gold);
        if (points.speed > 0) addLine('Speed', points.speed, '#FF00FF');
        
        // Animate popup
        popupContainer.setScale(0);
        this.scene.tweens.add({
            targets: popupContainer,
            scale: 1,
            duration: 300,
            ease: 'Back.Out',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: popupContainer,
                    y: '-=100',
                    alpha: 0,
                    duration: 1500,
                    delay: 500,
                    onComplete: () => popupContainer.destroy()
                });
            }
        });
    }
    
    showGameOverScreen(data) {
        // Implementation of game over screen
        // (Similar to your original but using the data from events)
        // This is a placeholder - you can expand with full implementation
        const gameOverBg = this.scene.add.rectangle(512, 384, 700, 600, 0x000000, 0.9)
            .setScrollFactor(0);
        gameOverBg.setStrokeStyle(4, 0xFF0000);
        
        const gameOverText = this.scene.add.text(512, 150, 'DELIVERY FAILED!', {
            fontSize: '48px',
            color: BdayConfig.UI.Colors.Red,
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        // ... rest of game over UI
    }
    
    showBirthdaySurprise(data) {
        // Implementation of birthday complete screen
        // This is a placeholder - you can expand with full implementation
        const surpriseBg = this.scene.add.rectangle(512, 384, 1024, 768, 0x000000, 0.9)
            .setScrollFactor(0);
        
        const message = this.scene.add.text(512, 384, 
            '🎉 HAPPY 9TH BIRTHDAY WYN! 🎉\n\n' +
            `You delivered all 9 SHAKE SHAKES!\n` +
            `Final Score: ${data.score} points`,
            {
                fontSize: '28px',
                color: BdayConfig.UI.Colors.Gold,
                fontFamily: 'Impact',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // ... rest of birthday UI
    }
    
    // ========== Cleanup - CRITICAL! ==========
    
    destroy() {
        // Remove all event listeners to prevent memory leaks
        this.scene.events.off(BdayEvents.SCORE_UPDATED, this.boundUpdateScore);
        this.scene.events.off(BdayEvents.LIVES_UPDATED, this.boundUpdateLives);
        this.scene.events.off(BdayEvents.COMBO_UPDATED, this.boundUpdateCombo);
        this.scene.events.off(BdayEvents.HIGH_SCORE_UPDATED, this.boundUpdateHighScore);
        this.scene.events.off(BdayEvents.DELIVERY_MADE, this.boundOnDelivery);
        this.scene.events.off(BdayEvents.PARCEL_PICKED_UP, this.boundOnParcelPickup);
        this.scene.events.off(BdayEvents.PARCEL_DROPPED, this.boundOnParcelDropped);
        this.scene.events.off(BdayEvents.DELIVERY_TIMER_UPDATE, this.boundUpdateTimer);
        this.scene.events.off(BdayEvents.PERFECT_STREAK, this.boundOnPerfectStreak);
        this.scene.events.off(BdayEvents.GAME_OVER, this.boundOnGameOver);
        this.scene.events.off(BdayEvents.BIRTHDAY_COMPLETE, this.boundOnBirthdayComplete);
        this.scene.events.off(BdayEvents.DELIVERY_MISSED, this.boundOnDeliveryMissed);
        
        // Stop any running tweens
        if (this.timerPulseTween) {
            this.timerPulseTween.stop();
        }
    }
}
