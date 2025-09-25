import { BirthdayConfig, BirthdayEvents } from './BirthdayConfig';

/**
 * BirthdayLaneManager - Manages lane system and player movement between lanes
 */
export class BirthdayLaneManager {
    constructor(scene) {
        this.scene = scene;
        this.config = BirthdayConfig;
        
        // Lane state
        this.currentLane = this.config.Player.StartLane;
        this.isChangingLanes = false;
        this.targetLane = this.currentLane;
        
        // Visual elements
        this.laneGraphics = null;
        this.laneIndicators = [];
        
        // Lane change animation
        this.laneChangeTween = null;
    }
    
    /**
     * Create visual lane representation
     */
    createLanes() {
        const { Lanes } = this.config;
        
        // Create lane graphics
        this.laneGraphics = this.scene.add.graphics();
        
        // Draw lane backgrounds with gradient
        for (let i = 0; i < Lanes.Count; i++) {
            const y = Lanes.StartY + (i * Lanes.HeightPx);
            
            // Lane background gradient
            const gradient = this.scene.add.graphics();
            gradient.fillGradientStyle(
                0x1a1a1a, 0x2a2a2a, 0x1a1a1a, 0x2a2a2a,
                0.3, 0.3, 0.2, 0.2
            );
            gradient.fillRect(0, y, 1024, Lanes.HeightPx);
            
            // Lane divider lines
            this.laneGraphics.lineStyle(2, 0x444444, 0.5);
            this.laneGraphics.strokeRect(0, y, 1024, Lanes.HeightPx);
            
            // Dashed center line for lanes
            if (i < Lanes.Count - 1) {
                const lineY = y + Lanes.HeightPx;
                this.drawDashedLine(0, lineY, 1024, lineY, 0x666666, 0.7);
            }
            
            // Lane number indicator
            const laneText = this.scene.add.text(30, y + Lanes.HeightPx / 2, `${i + 1}`, {
                fontFamily: 'Arial Black',
                fontSize: '24px',
                color: '#444444'
            }).setOrigin(0.5);
            
            this.laneIndicators.push(laneText);
        }
        
        // Add lane markers for player position
        this.createLaneMarkers();
    }
    
    /**
     * Draw dashed line
     */
    drawDashedLine(x1, y1, x2, y2, color, alpha) {
        const dashLength = 20;
        const gapLength = 10;
        const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const dashCount = Math.floor(distance / (dashLength + gapLength));
        
        this.laneGraphics.lineStyle(2, color, alpha);
        
        for (let i = 0; i < dashCount; i++) {
            const startRatio = (i * (dashLength + gapLength)) / distance;
            const endRatio = (i * (dashLength + gapLength) + dashLength) / distance;
            
            const dashX1 = Phaser.Math.Linear(x1, x2, startRatio);
            const dashY1 = Phaser.Math.Linear(y1, y2, startRatio);
            const dashX2 = Phaser.Math.Linear(x1, x2, endRatio);
            const dashY2 = Phaser.Math.Linear(y1, y2, endRatio);
            
            this.laneGraphics.beginPath();
            this.laneGraphics.moveTo(dashX1, dashY1);
            this.laneGraphics.lineTo(dashX2, dashY2);
            this.laneGraphics.strokePath();
        }
    }
    
    /**
     * Create lane position markers
     */
    createLaneMarkers() {
        const { Lanes } = this.config;
        
        // Create arrow indicators for current lane
        this.laneMarkers = [];
        
        for (let i = 0; i < Lanes.Count; i++) {
            const marker = this.scene.add.text(
                100,
                Lanes.Positions[i],
                '▶',
                {
                    fontFamily: 'Arial',
                    fontSize: '32px',
                    color: '#00FF00'
                }
            ).setOrigin(0.5);
            
            marker.setVisible(i === this.currentLane);
            marker.setAlpha(0.5);
            
            this.laneMarkers.push(marker);
        }
    }
    
    /**
     * Change to a specific lane
     * @param {number} laneIndex - Target lane (0-2)
     * @param {Phaser.GameObjects.Sprite} player - Player sprite to move
     * @returns {boolean} Whether lane change was initiated
     */
    changeLane(laneIndex, player) {
        // Validate lane index
        if (laneIndex < 0 || laneIndex >= this.config.Lanes.Count) {
            return false;
        }
        
        // Don't change if already changing or in same lane
        if (this.isChangingLanes || laneIndex === this.currentLane) {
            return false;
        }
        
        this.isChangingLanes = true;
        this.targetLane = laneIndex;
        
        const targetY = this.config.Lanes.Positions[laneIndex];
        
        // Stop any existing tween
        if (this.laneChangeTween) {
            this.laneChangeTween.stop();
        }
        
        // Animate player to new lane
        this.laneChangeTween = this.scene.tweens.add({
            targets: player,
            y: targetY,
            duration: this.config.Player.LaneChangeSpeedMs,
            ease: this.config.Effects.TweenEases.LaneChange,
            onComplete: () => {
                this.currentLane = this.targetLane;
                this.isChangingLanes = false;
                this.updateLaneMarkers();
                
                // Emit lane change event
                this.scene.events.emit(BirthdayEvents.LANE_CHANGE, {
                    lane: this.currentLane,
                    position: targetY
                });
            }
        });
        
        return true;
    }
    
    /**
     * Move up one lane
     * @param {Phaser.GameObjects.Sprite} player - Player sprite
     */
    moveUp(player) {
        if (this.currentLane > 0) {
            return this.changeLane(this.currentLane - 1, player);
        }
        return false;
    }
    
    /**
     * Move down one lane
     * @param {Phaser.GameObjects.Sprite} player - Player sprite
     */
    moveDown(player) {
        if (this.currentLane < this.config.Lanes.Count - 1) {
            return this.changeLane(this.currentLane + 1, player);
        }
        return false;
    }
    
    /**
     * Update lane marker visibility
     */
    updateLaneMarkers() {
        if (!this.laneMarkers) return;
        
        this.laneMarkers.forEach((marker, index) => {
            marker.setVisible(index === this.currentLane);
            
            // Pulse effect for active marker
            if (index === this.currentLane) {
                this.scene.tweens.add({
                    targets: marker,
                    alpha: { from: 0.3, to: 0.7 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }
    
    /**
     * Get current lane index
     */
    getCurrentLane() {
        return this.currentLane;
    }
    
    /**
     * Get Y position for a lane
     * @param {number} laneIndex - Lane index (0-2)
     */
    getLaneY(laneIndex) {
        if (laneIndex < 0 || laneIndex >= this.config.Lanes.Count) {
            return this.config.Lanes.Positions[this.config.Player.StartLane];
        }
        return this.config.Lanes.Positions[laneIndex];
    }
    
    /**
     * Get random lane index
     */
    getRandomLane() {
        return Phaser.Math.Between(0, this.config.Lanes.Count - 1);
    }
    
    /**
     * Check if currently changing lanes
     */
    isChanging() {
        return this.isChangingLanes;
    }
    
    /**
     * Reset lane state
     */
    reset() {
        this.currentLane = this.config.Player.StartLane;
        this.targetLane = this.currentLane;
        this.isChangingLanes = false;
        
        if (this.laneChangeTween) {
            this.laneChangeTween.stop();
            this.laneChangeTween = null;
        }
        
        this.updateLaneMarkers();
    }
    
    /**
     * Highlight a lane temporarily
     * @param {number} laneIndex - Lane to highlight
     * @param {number} color - Color to use
     * @param {number} duration - Duration in ms
     */
    highlightLane(laneIndex, color = 0x00FF00, duration = 500) {
        const y = this.config.Lanes.StartY + (laneIndex * this.config.Lanes.HeightPx);
        
        const highlight = this.scene.add.rectangle(
            512, 
            y + this.config.Lanes.HeightPx / 2,
            1024, 
            this.config.Lanes.HeightPx,
            color, 
            0.2
        );
        
        this.scene.tweens.add({
            targets: highlight,
            alpha: { from: 0.2, to: 0 },
            duration: duration,
            onComplete: () => highlight.destroy()
        });
    }
    
    /**
     * Destroy the lane manager
     */
    destroy() {
        if (this.laneChangeTween) {
            this.laneChangeTween.stop();
        }
        
        if (this.laneGraphics) {
            this.laneGraphics.destroy();
        }
        
        this.laneIndicators.forEach(indicator => indicator.destroy());
        this.laneMarkers?.forEach(marker => marker.destroy());
    }
}