import { BirthdayConfig, BirthdayEvents } from './BirthdayConfig';

/**
 * BirthdayUIManager - Manages all UI elements for the birthday minigame
 */
export class BirthdayUIManager {
    constructor(scene) {
        this.scene = scene;
        this.config = BirthdayConfig;
        
        // UI Elements
        this.elements = {};
        this.panels = {};
        
        // Animation tweens
        this.activeTweens = [];
    }
    
    /**
     * Create all UI elements
     */
    create() {
        this.createBackground();
        this.createScorePanel();
        this.createTimer();
        this.createLivesDisplay();
        this.createComboDisplay();
        this.createDeliveryCounter();
        this.createInstructions();
        this.createPowerUpIndicators();
        
        this.setupEventListeners();
    }
    
    /**
     * Create gradient background
     */
    createBackground() {
        const graphics = this.scene.add.graphics();
        
        // Birthday-themed gradient (pink to purple)
        graphics.fillGradientStyle(
            0xFF69B4, 0xFF1493, 0x9370DB, 0x8A2BE2,
            1, 1, 1, 1
        );
        graphics.fillRect(0, 0, 1024, 350);
        
        // Add birthday decorations
        this.createBirthdayDecorations();
    }
    
    /**
     * Create birthday decorations
     */
    createBirthdayDecorations() {
        // Balloons
        const balloonEmojis = ['🎈', '🎈', '🎈', '🎈', '🎈'];
        balloonEmojis.forEach((emoji, i) => {
            const balloon = this.scene.add.text(
                100 + i * 200,
                50 + Math.sin(i) * 20,
                emoji,
                { fontSize: '48px' }
            );
            
            // Floating animation
            this.scene.tweens.add({
                targets: balloon,
                y: balloon.y - 10,
                duration: 2000 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        });
        
        // Birthday banner
        const banner = this.scene.add.text(
            512, 25,
            "🎉 WYN'S 9TH BIRTHDAY SHAKE RUSH! 🎉",
            {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Pulse effect for banner
        this.scene.tweens.add({
            targets: banner,
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Create score panel
     */
    createScorePanel() {
        const { UI } = this.config;
        
        // Panel background
        const panel = this.scene.add.rectangle(
            UI.ScorePanelX + UI.ScorePanelWidth/2,
            UI.ScorePanelY + UI.ScorePanelHeight/2,
            UI.ScorePanelWidth,
            UI.ScorePanelHeight,
            0x000000, 0.7
        );
        
        // Score label
        this.elements.scoreLabel = this.scene.add.text(
            UI.ScorePanelX + 10,
            UI.ScorePanelY + 10,
            'SCORE:',
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Score,
                color: UI.Colors.Gold
            }
        );
        
        // Score value
        this.elements.scoreValue = this.scene.add.text(
            UI.ScorePanelX + 10,
            UI.ScorePanelY + 45,
            '0',
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Score,
                color: UI.Colors.White
            }
        );
        
        // High score
        this.elements.highScore = this.scene.add.text(
            UI.ScorePanelX + 10,
            UI.ScorePanelY + 80,
            `HIGH: ${localStorage.getItem('birthdayHighScore') || '0'}`,
            {
                fontFamily: 'Arial',
                fontSize: UI.FontSizes.Instructions,
                color: UI.Colors.Cyan
            }
        );
        
        this.panels.score = panel;
    }
    
    /**
     * Create timer display
     */
    createTimer() {
        const { UI } = this.config;
        
        this.elements.timer = this.scene.add.text(
            UI.TimerX,
            UI.TimerY,
            '',
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Timer,
                color: UI.Colors.White,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
    }
    
    /**
     * Create lives display
     */
    createLivesDisplay() {
        const { UI } = this.config;
        
        this.elements.livesLabel = this.scene.add.text(
            UI.LivesX,
            UI.LivesY,
            'LIVES:',
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Points,
                color: UI.Colors.White,
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(1, 0);
        
        this.elements.livesHearts = [];
        for (let i = 0; i < this.config.Lives.Starting; i++) {
            const heart = this.scene.add.text(
                UI.LivesX + 10 + i * 30,
                UI.LivesY,
                '❤️',
                { fontSize: '24px' }
            );
            this.elements.livesHearts.push(heart);
        }
    }
    
    /**
     * Create combo display
     */
    createComboDisplay() {
        const { UI } = this.config;
        
        this.elements.combo = this.scene.add.text(
            512, 120,
            '',
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Combo,
                color: UI.Colors.Yellow,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setVisible(false);
    }
    
    /**
     * Create delivery counter
     */
    createDeliveryCounter() {
        const { UI, Scoring } = this.config;
        
        // Delivery progress bar background
        const barBg = this.scene.add.rectangle(
            512, 80,
            400, 30,
            0x333333
        );
        
        // Delivery progress bar
        this.elements.deliveryBar = this.scene.add.rectangle(
            312, 80,
            0, 26,
            0x00FF00
        );
        
        // Delivery text
        this.elements.deliveryText = this.scene.add.text(
            512, 80,
            `0 / ${Scoring.DeliveryGoal} S²`,
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Points,
                color: UI.Colors.White,
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // S² indicators
        this.elements.shakeIndicators = [];
        for (let i = 0; i < Scoring.DeliveryGoal; i++) {
            const indicator = this.scene.add.text(
                320 + i * 45, 110,
                'S²',
                {
                    fontFamily: 'Arial Black',
                    fontSize: '24px',
                    color: '#666666',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
            this.elements.shakeIndicators.push(indicator);
        }
    }
    
    /**
     * Create instructions
     */
    createInstructions() {
        const { UI, Tutorial } = this.config;
        
        if (!Tutorial.ShowControls) return;
        
        this.elements.instructions = this.scene.add.text(
            512, 200,
            Tutorial.InstructionText,
            {
                fontFamily: 'Arial Black',
                fontSize: UI.FontSizes.Instructions,
                color: UI.Colors.White,
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Fade out instructions after delay
        this.scene.time.delayedCall(Tutorial.FadeOutDelayMs, () => {
            this.scene.tweens.add({
                targets: this.elements.instructions,
                alpha: 0,
                duration: Tutorial.FadeOutDurationMs,
                onComplete: () => {
                    this.elements.instructions.setVisible(false);
                }
            });
        });
    }
    
    /**
     * Create power-up indicators
     */
    createPowerUpIndicators() {
        const { UI } = this.config;
        
        this.elements.powerUpIndicators = {};
        
        const powerUpTypes = Object.keys(this.config.PowerUps.Types);
        powerUpTypes.forEach((type, index) => {
            if (!this.config.PowerUps.Types[type].IsInstant) {
                const indicator = this.scene.add.group();
                
                const icon = this.scene.add.text(
                    50 + index * 60,
                    250,
                    this.config.PowerUps.Types[type].Emoji,
                    { fontSize: '32px' }
                ).setVisible(false);
                
                const timer = this.scene.add.text(
                    50 + index * 60,
                    280,
                    '',
                    {
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        color: UI.Colors.White
                    }
                ).setOrigin(0.5).setVisible(false);
                
                indicator.add(icon);
                indicator.add(timer);
                
                this.elements.powerUpIndicators[type] = { icon, timer };
            }
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Score updates
        this.scene.events.on(BirthdayEvents.SCORE_UPDATE, (data) => {
            this.updateScore(data.score);
            if (data.bonus) {
                this.showBonusText(data.bonus, data.reason);
            }
        });
        
        // Lives updates
        this.scene.events.on(BirthdayEvents.LIVES_UPDATE, (lives) => {
            this.updateLives(lives);
        });
        
        // Delivery made
        this.scene.events.on(BirthdayEvents.DELIVERY_MADE, (data) => {
            this.updateDeliveryCounter(data.deliveryNumber);
            this.showDeliveryFeedback(data);
        });
        
        // Combo updates
        this.scene.events.on(BirthdayEvents.COMBO_INCREASE, (combo) => {
            this.updateCombo(combo);
        });
        
        this.scene.events.on(BirthdayEvents.COMBO_BREAK, () => {
            this.hideCombo();
        });
        
        // Power-up collected
        this.scene.events.on(BirthdayEvents.POWERUP_COLLECTED, (data) => {
            this.showPowerUpIndicator(data.type, data.powerUp);
        });
        
        // Game over
        this.scene.events.on(BirthdayEvents.GAME_OVER, (data) => {
            this.showGameOver(data);
        });
        
        // Game complete
        this.scene.events.on(BirthdayEvents.GAME_COMPLETE, (data) => {
            this.showVictory(data);
        });
    }
    
    /**
     * Update score display
     */
    updateScore(score) {
        this.elements.scoreValue.setText(score.toString());
        
        // Pulse effect
        this.scene.tweens.add({
            targets: this.elements.scoreValue,
            scale: { from: 1, to: 1.2 },
            duration: 100,
            yoyo: true
        });
    }
    
    /**
     * Update lives display
     */
    updateLives(lives) {
        this.elements.livesHearts.forEach((heart, index) => {
            if (index < lives) {
                heart.setVisible(true);
                heart.setText('❤️');
            } else {
                heart.setText('💔');
                heart.setAlpha(0.5);
            }
        });
        
        // Flash effect on life loss
        if (lives < this.config.Lives.Starting) {
            this.scene.cameras.main.flash(100, 255, 0, 0, false);
        }
    }
    
    /**
     * Update delivery counter
     */
    updateDeliveryCounter(deliveries) {
        const { Scoring } = this.config;
        
        // Update text
        this.elements.deliveryText.setText(`${deliveries} / ${Scoring.DeliveryGoal} S²`);
        
        // Update progress bar
        const progress = deliveries / Scoring.DeliveryGoal;
        this.elements.deliveryBar.width = 400 * progress;
        
        // Update indicators
        this.elements.shakeIndicators.forEach((indicator, index) => {
            if (index < deliveries) {
                indicator.setColor('#FFD700');
                indicator.setScale(1.2);
                
                // Celebration effect
                this.scene.tweens.add({
                    targets: indicator,
                    scale: { from: 1.5, to: 1.2 },
                    angle: { from: -10, to: 10 },
                    duration: 300,
                    yoyo: true,
                    repeat: 2
                });
            }
        });
    }
    
    /**
     * Update combo display
     */
    updateCombo(combo) {
        if (combo > 1) {
            this.elements.combo.setVisible(true);
            this.elements.combo.setText(`${combo}x COMBO!`);
            
            // Color based on combo level
            if (combo >= 10) {
                this.elements.combo.setColor('#FF00FF');
            } else if (combo >= 5) {
                this.elements.combo.setColor('#FFD700');
            } else {
                this.elements.combo.setColor('#FFFF00');
            }
            
            // Bounce effect
            this.scene.tweens.add({
                targets: this.elements.combo,
                scale: { from: 0.8, to: 1.2 },
                duration: 200,
                yoyo: true
            });
        }
    }
    
    /**
     * Hide combo display
     */
    hideCombo() {
        this.elements.combo.setVisible(false);
    }
    
    /**
     * Show delivery feedback
     */
    showDeliveryFeedback(data) {
        const feedbackText = data.isPerfect ? 'PERFECT!' : 'GOOD!';
        const color = data.isPerfect ? '#FFD700' : '#00FF00';
        
        const feedback = this.scene.add.text(
            512, 300,
            feedbackText,
            {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                color: color,
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Points breakdown
        const points = this.scene.add.text(
            512, 350,
            `+${data.totalPoints} POINTS!`,
            {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        // Animate and remove
        this.scene.tweens.add({
            targets: [feedback, points],
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            onComplete: () => {
                feedback.destroy();
                points.destroy();
            }
        });
    }
    
    /**
     * Show bonus text
     */
    showBonusText(amount, reason) {
        const bonus = this.scene.add.text(
            Phaser.Math.Between(400, 600),
            Phaser.Math.Between(400, 500),
            `+${amount}\n${reason}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: '#00FFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: bonus,
            y: bonus.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonus.destroy()
        });
    }
    
    /**
     * Show power-up indicator
     */
    showPowerUpIndicator(type, powerUp) {
        if (!powerUp.IsInstant && this.elements.powerUpIndicators[type]) {
            const { icon, timer } = this.elements.powerUpIndicators[type];
            
            icon.setVisible(true);
            timer.setVisible(true);
            
            // Glow effect
            this.scene.tweens.add({
                targets: icon,
                scale: { from: 1, to: 1.2 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
            
            // Update timer
            const updateTimer = () => {
                const remaining = this.scene.gameManager?.activePowerUps.get(type);
                if (remaining) {
                    timer.setText(`${Math.ceil(remaining / 1000)}s`);
                } else {
                    icon.setVisible(false);
                    timer.setVisible(false);
                    this.scene.tweens.killTweensOf(icon);
                }
            };
            
            this.scene.time.addEvent({
                delay: 100,
                callback: updateTimer,
                loop: true,
                callbackScope: this
            });
        }
    }
    
    /**
     * Update timer display
     */
    updateTimer(time) {
        if (time > 0) {
            const seconds = Math.floor(time / 1000);
            const ms = Math.floor((time % 1000) / 10);
            this.elements.timer.setText(`${seconds}.${ms.toString().padStart(2, '0')}`);
        }
    }
    
    /**
     * Show game over screen
     */
    showGameOver(data) {
        // Darken screen
        const overlay = this.scene.add.rectangle(
            512, 384,
            1024, 768,
            0x000000, 0.8
        );
        
        // Game over text
        const gameOver = this.scene.add.text(
            512, 200,
            'GAME OVER',
            {
                fontFamily: 'Arial Black',
                fontSize: '64px',
                color: '#FF0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Final score
        const score = this.scene.add.text(
            512, 300,
            `Final Score: ${data.score}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '42px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Stats
        const stats = this.scene.add.text(
            512, 400,
            `Deliveries: ${data.deliveries}\nMax Combo: ${data.stats.maxCombo}`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Retry button
        this.createRetryButton();
    }
    
    /**
     * Show victory screen
     */
    showVictory(data) {
        // Confetti effect
        this.createConfetti();
        
        // Victory overlay
        const overlay = this.scene.add.rectangle(
            512, 384,
            1024, 768,
            0x000000, 0.7
        );
        
        // Victory text
        const victory = this.scene.add.text(
            512, 150,
            '🎉 HAPPY BIRTHDAY WYN! 🎉',
            {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Completion message
        const complete = this.scene.add.text(
            512, 220,
            'All 9 S² Delivered!',
            {
                fontFamily: 'Arial Black',
                fontSize: '36px',
                color: '#00FF00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Final score
        const score = this.scene.add.text(
            512, 300,
            `Score: ${data.score}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '42px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // High score notification
        if (data.isHighScore) {
            const highScore = this.scene.add.text(
                512, 360,
                'NEW HIGH SCORE!',
                {
                    fontFamily: 'Arial Black',
                    fontSize: '32px',
                    color: '#FF00FF',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: highScore,
                scale: { from: 0.8, to: 1.2 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Play again button
        this.createRetryButton(450);
    }
    
    /**
     * Create confetti effect
     */
    createConfetti() {
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
        
        for (let i = 0; i < 100; i++) {
            const confetti = this.scene.add.rectangle(
                Phaser.Math.Between(0, 1024),
                -10,
                8, 16,
                Phaser.Utils.Array.GetRandom(colors)
            );
            
            this.scene.physics.add.existing(confetti);
            confetti.body.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(200, 400)
            );
            confetti.body.setAngularVelocity(Phaser.Math.Between(-500, 500));
            
            this.scene.time.delayedCall(5000, () => confetti.destroy());
        }
    }
    
    /**
     * Create retry button
     */
    createRetryButton(y = 500) {
        const button = this.scene.add.text(
            512, y,
            'PLAY AGAIN',
            {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#FF1493',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive();
        
        button.on('pointerover', () => {
            button.setScale(1.1);
            button.setBackgroundColor('#FF69B4');
        });
        
        button.on('pointerout', () => {
            button.setScale(1);
            button.setBackgroundColor('#FF1493');
        });
        
        button.on('pointerdown', () => {
            this.scene.scene.restart();
        });
    }
    
    /**
     * Reset UI
     */
    reset() {
        // Clear all tweens
        this.activeTweens.forEach(tween => tween.stop());
        this.activeTweens = [];
        
        // Reset displays
        this.updateScore(0);
        this.updateLives(this.config.Lives.Starting);
        this.updateDeliveryCounter(0);
        this.hideCombo();
        
        // Hide power-up indicators
        Object.values(this.elements.powerUpIndicators).forEach(indicator => {
            indicator.icon.setVisible(false);
            indicator.timer.setVisible(false);
        });
    }
    
    /**
     * Destroy UI manager
     */
    destroy() {
        this.scene.events.off(BirthdayEvents.SCORE_UPDATE);
        this.scene.events.off(BirthdayEvents.LIVES_UPDATE);
        this.scene.events.off(BirthdayEvents.DELIVERY_MADE);
        this.scene.events.off(BirthdayEvents.COMBO_INCREASE);
        this.scene.events.off(BirthdayEvents.COMBO_BREAK);
        this.scene.events.off(BirthdayEvents.POWERUP_COLLECTED);
        this.scene.events.off(BirthdayEvents.GAME_OVER);
        this.scene.events.off(BirthdayEvents.GAME_COMPLETE);
        
        this.activeTweens.forEach(tween => tween.stop());
    }
}