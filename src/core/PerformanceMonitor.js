import { BaseManager } from './BaseManager';

/**
 * PerformanceMonitor tracks FPS and performance metrics
 * Helps diagnose performance issues across different systems
 */
export class PerformanceMonitor extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        
        this.scene = null;
        this.enabled = false;
        this.displayText = null;
        
        // Performance metrics
        this.fps = 60;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.timeAccumulator = 0;
        
        // Physics metrics
        this.physicsSteps = 0;
        this.physicsTime = 0;
        
        // Memory usage (if available)
        this.memoryUsage = 0;
        
        this._initialized = true;
    }
    
    /**
     * Initialize the performance monitor
     * @param {Phaser.Scene} scene - The scene to monitor
     * @param {boolean} showDisplay - Whether to show on-screen display
     */
    init(scene, showDisplay = false) {
        this.scene = scene;
        this.enabled = true;
        
        if (showDisplay) {
            this.createDisplay();
        }
        
        // Check if performance API is available
        this.supportsPerformance = typeof performance !== 'undefined';
        this.supportsMemory = this.supportsPerformance && performance.memory;
    }
    
    /**
     * Create on-screen performance display
     */
    createDisplay() {
        if (!this.scene) return;
        
        const style = {
            font: '14px monospace',
            fill: '#00ff00',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 10, y: 5 }
        };
        
        this.displayText = this.scene.add.text(10, 10, '', style);
        this.displayText.setScrollFactor(0);
        this.displayText.setDepth(10000);
    }
    
    /**
     * Update performance metrics
     * @param {number} time - Current time
     * @param {number} delta - Delta time in ms
     */
    update(time, delta) {
        if (!this.enabled) return;
        
        // Update delta time
        this.deltaTime = delta;
        
        // Calculate FPS
        this.frameCount++;
        this.timeAccumulator += delta;
        
        // Update FPS every second
        if (this.timeAccumulator >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / this.timeAccumulator);
            this.frameCount = 0;
            this.timeAccumulator = 0;
            
            // Update memory usage if available
            if (this.supportsMemory) {
                this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
        }
        
        // Update display
        if (this.displayText) {
            this.updateDisplay();
        }
    }
    
    /**
     * Record physics step timing
     * @param {number} steps - Number of physics steps this frame
     * @param {number} time - Time taken for physics update
     */
    recordPhysicsMetrics(steps, time) {
        this.physicsSteps = steps;
        this.physicsTime = time;
    }
    
    /**
     * Update the on-screen display
     */
    updateDisplay() {
        if (!this.displayText) return;
        
        let text = `FPS: ${this.fps}\n`;
        text += `Delta: ${this.deltaTime.toFixed(1)}ms\n`;
        text += `Physics Steps: ${this.physicsSteps}\n`;
        
        if (this.physicsTime > 0) {
            text += `Physics Time: ${this.physicsTime.toFixed(1)}ms\n`;
        }
        
        if (this.supportsMemory) {
            text += `Memory: ${this.memoryUsage}MB`;
        }
        
        // Color code based on FPS
        let color = '#00ff00'; // Green
        if (this.fps < 30) {
            color = '#ff0000'; // Red
        } else if (this.fps < 50) {
            color = '#ffff00'; // Yellow
        }
        
        this.displayText.setColor(color);
        this.displayText.setText(text);
    }
    
    /**
     * Get current FPS
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Check if performance is below threshold
     * @param {number} threshold - FPS threshold
     * @returns {boolean} True if FPS is below threshold
     */
    isPerformanceLow(threshold = 30) {
        return this.fps < threshold;
    }
    
    /**
     * Toggle performance display
     */
    toggleDisplay() {
        if (this.displayText) {
            this.displayText.setVisible(!this.displayText.visible);
        }
    }
    
    /**
     * Enable or disable monitoring
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.displayText) {
            this.displayText.setVisible(enabled);
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.displayText) {
            this.displayText.destroy();
            this.displayText = null;
        }
        
        this.scene = null;
        super.destroy();
    }
}