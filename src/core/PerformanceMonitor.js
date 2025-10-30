import { BaseManager, EventBus } from '@features/core';
import { EventNames } from '../constants/EventNames.js';
import { LOG } from '../observability/core/LogSystem.js';

/**
 * Enhanced PerformanceMonitor - Comprehensive performance tracking and metrics
 * 
 * Tracks:
 * - FPS and frame timing
 * - Physics performance
 * - Memory usage
 * - Game-specific metrics (runs, bosses, clones)
 * - System health warnings
 */
export class PerformanceMonitor extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        // Debug flag
        this.debug = process.env.NODE_ENV !== 'production';
        
        // Display state
        this.scene = null;
        this.enabled = false;
        this.displayText = null;
        
        // Basic performance metrics
        this.fps = 60;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.timeAccumulator = 0;
        
        // Physics metrics
        this.physicsSteps = 0;
        this.physicsTime = 0;
        this.physicsObjects = 0;
        
        // Memory usage (if available)
        this.memoryUsage = 0;
        this.memoryPeak = 0;
        
        // Game-specific metrics
        this.gameMetrics = {
            runsCompleted: 0,
            bossesDefeated: 0,
            clonesForged: 0,
            averageRunTime: 0,
            bestRunScore: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            totalPlayTime: 0,
            performanceWarnings: 0
        };
        
        // Historical data (last 100 frames)
        this.fpsHistory = [];
        this.deltaHistory = [];
        this.physicsHistory = [];
        
        // Performance thresholds
        this.thresholds = {
            fpsCritical: 20,
            fpsWarning: 40,
            deltaWarning: 33.33, // 33.33ms = 30fps
            memoryWarning: 512, // MB
            physicsWarning: 16.67 // ms per physics step
        };
        
        // Metrics collection
        this.metricsCollection = {
            enabled: true,
            interval: 5000, // 5 seconds
            lastCollection: Date.now(),
            samples: []
        };
        
        // Event listeners
        this.setupEventListeners();
        
        this.setInitialized();
    }
    
    /**
     * Setup event listeners for game metrics
     */
    setupEventListeners() {
        const eventBus = EventBus.getInstance();
        
        // Track run completions
        eventBus.on(EventNames.LEVEL_COMPLETE, this.handleRunComplete.bind(this));
        
        // Track boss defeats
        eventBus.on(EventNames.BOSS_DEFEATED, this.handleBossDefeated.bind(this));
        
        // Track clone forging
        eventBus.on(EventNames.CLONE_FORGE_COMPLETE, this.handleCloneForged.bind(this));
        
        // Track performance warnings
        eventBus.on(EventNames.PERFORMANCE_METRIC_RECORDED, this.handlePerformanceWarning.bind(this));
    }
    
    /**
     * Initialize the performance monitor with a scene
     * @param {Phaser.Scene} scene - The scene to monitor
     * @param {boolean} showDisplay - Whether to show on-screen display
     */
    initWithScene(scene, showDisplay = false) {
        this.scene = scene;
        this.enabled = true;
        
        if (showDisplay) {
            this.createDisplay();
        }
        
        // Check if performance API is available
        this.supportsPerformance = typeof performance !== 'undefined';
        this.supportsMemory = this.supportsPerformance && performance.memory;
        
        // Start play time tracking
        this.playTimeStart = Date.now();
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_INITIALIZED', {
                subsystem: 'performance',
                message: 'Performance monitor initialized with scene',
                sceneKey: scene.scene.key,
                supportsPerformance: this.supportsPerformance,
                supportsMemory: this.supportsMemory
            });
        }
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
     * Enhanced update with comprehensive metrics tracking
     * @param {number} time - Current time
     * @param {number} delta - Delta time in ms
     */
    update(time, delta) {
        if (!this.enabled) return;
        
        // Update delta time
        this.deltaTime = delta;
        
        // Add to historical data
        this.deltaHistory.push(delta);
        if (this.deltaHistory.length > 100) {
            this.deltaHistory.shift();
        }
        
        // Calculate FPS
        this.frameCount++;
        this.timeAccumulator += delta;
        
        // Update FPS every second
        if (this.timeAccumulator >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / this.timeAccumulator);
            this.frameCount = 0;
            this.timeAccumulator = 0;
            
            // Add to FPS history
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > 100) {
                this.fpsHistory.shift();
            }
            
            // Update memory usage if available
            if (this.supportsMemory) {
                this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
                this.memoryPeak = Math.max(this.memoryPeak, this.memoryUsage);
            }
            
            // Check for performance issues
            this.checkPerformanceThresholds();
        }
        
        // Update play time
        if (this.playTimeStart) {
            this.gameMetrics.totalPlayTime = Date.now() - this.playTimeStart;
        }
        
        // Collect metrics periodically
        this.collectMetrics();
        
        // Update display
        if (this.displayText) {
            this.updateDisplay();
        }
    }
    
    /**
     * Record enhanced physics metrics
     * @param {number} steps - Number of physics steps this frame
     * @param {number} time - Time taken for physics update
     * @param {number} objects - Number of physics objects
     */
    recordPhysicsMetrics(steps, time, objects = 0) {
        this.physicsSteps = steps;
        this.physicsTime = time;
        this.physicsObjects = objects;
        
        // Add to physics history
        this.physicsHistory.push({ steps, time, objects, timestamp: Date.now() });
        if (this.physicsHistory.length > 100) {
            this.physicsHistory.shift();
        }
    }
    
    /**
     * Check performance thresholds and emit warnings
     */
    checkPerformanceThresholds() {
        const eventBus = EventBus.getInstance();
        
        // FPS warnings
        if (this.fps <= this.thresholds.fpsCritical) {
            this.gameMetrics.performanceWarnings++;
            eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'fps_critical',
                value: this.fps,
                threshold: this.thresholds.fpsCritical,
                timestamp: Date.now()
            });
        } else if (this.fps <= this.thresholds.fpsWarning) {
            eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'fps_warning',
                value: this.fps,
                threshold: this.thresholds.fpsWarning,
                timestamp: Date.now()
            });
        }
        
        // Memory warnings
        if (this.memoryUsage >= this.thresholds.memoryWarning) {
            eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'memory_warning',
                value: this.memoryUsage,
                threshold: this.thresholds.memoryWarning,
                timestamp: Date.now()
            });
        }
        
        // Physics warnings
        if (this.physicsTime >= this.thresholds.physicsWarning) {
            eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'physics_warning',
                value: this.physicsTime,
                threshold: this.thresholds.physicsWarning,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Collect metrics sample for analysis
     */
    collectMetrics() {
        const now = Date.now();
        
        if (!this.metricsCollection.enabled || 
            now - this.metricsCollection.lastCollection < this.metricsCollection.interval) {
            return;
        }
        
        const sample = {
            timestamp: now,
            fps: this.fps,
            deltaTime: this.deltaTime,
            memoryUsage: this.memoryUsage,
            physicsTime: this.physicsTime,
            physicsSteps: this.physicsSteps,
            physicsObjects: this.physicsObjects,
            gameMetrics: { ...this.gameMetrics }
        };
        
        this.metricsCollection.samples.push(sample);
        
        // Keep only last 100 samples
        if (this.metricsCollection.samples.length > 100) {
            this.metricsCollection.samples.shift();
        }
        
        this.metricsCollection.lastCollection = now;
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_METRICS_COLLECTED', {
                subsystem: 'performance',
                message: 'Performance metrics sample collected',
                fps: sample.fps,
                deltaTime: sample.deltaTime,
                memoryUsage: sample.memoryUsage,
                physicsTime: sample.physicsTime,
                sampleCount: this.metricsCollection.samples.length
            });
        }
    }
    
    /**
     * Event handlers for game metrics
     */
    handleRunComplete(data) {
        this.gameMetrics.runsCompleted++;
        
        if (data.runTime) {
            // Update average run time
            const totalTime = this.gameMetrics.averageRunTime * (this.gameMetrics.runsCompleted - 1) + data.runTime;
            this.gameMetrics.averageRunTime = totalTime / this.gameMetrics.runsCompleted;
        }
        
        // Update best score if provided
        if (data.runScore) {
            const current = this.gameMetrics.bestRunScore;
            const newScore = data.runScore;
            
            if ((newScore.S + newScore.C + newScore.H + newScore.R + newScore.B) > 
                (current.S + current.C + current.H + current.R + current.B)) {
                this.gameMetrics.bestRunScore = { ...newScore };
            }
        }
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_RUN_COMPLETED', {
                subsystem: 'performance',
                message: 'Run completed',
                totalRuns: this.gameMetrics.runsCompleted,
                averageRunTime: this.gameMetrics.averageRunTime,
                runTime: data.runTime,
                runScore: data.runScore
            });
        }
    }
    
    handleBossDefeated(data) {
        this.gameMetrics.bossesDefeated++;
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_BOSS_DEFEATED', {
                subsystem: 'performance',
                message: 'Boss defeated',
                totalBosses: this.gameMetrics.bossesDefeated,
                bossData: data
            });
        }
    }
    
    handleCloneForged(data) {
        this.gameMetrics.clonesForged++;
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_CLONE_FORGED', {
                subsystem: 'performance',
                message: 'Clone forged',
                totalClones: this.gameMetrics.clonesForged,
                cloneData: data
            });
        }
    }
    
    handlePerformanceWarning(data) {
        if (this.debug) {
            LOG.warn('PERFORMANCEMONITOR_WARNING', {
                subsystem: 'performance',
                message: 'Performance warning detected',
                warningType: data.type,
                value: data.value,
                threshold: data.threshold,
                timestamp: data.timestamp,
                hint: 'Monitor performance metrics to identify bottlenecks. Consider optimization if warnings persist.'
            });
        }
    }
    
    /**
     * Enhanced on-screen display
     */
    updateDisplay() {
        if (!this.displayText) return;
        
        let text = `FPS: ${this.fps} (avg: ${this.getAverageFPS()})\n`;
        text += `Delta: ${this.deltaTime.toFixed(1)}ms\n`;
        
        if (this.physicsTime > 0) {
            text += `Physics: ${this.physicsTime.toFixed(1)}ms (${this.physicsSteps} steps)\n`;
            text += `Objects: ${this.physicsObjects}\n`;
        }
        
        if (this.supportsMemory) {
            text += `Memory: ${this.memoryUsage}MB (peak: ${this.memoryPeak}MB)\n`;
        }
        
        // Game metrics
        text += `Runs: ${this.gameMetrics.runsCompleted} | Bosses: ${this.gameMetrics.bossesDefeated}\n`;
        text += `Clones: ${this.gameMetrics.clonesForged} | Warnings: ${this.gameMetrics.performanceWarnings}\n`;
        
        // Play time
        const playTimeMinutes = Math.floor(this.gameMetrics.totalPlayTime / 60000);
        text += `Play Time: ${playTimeMinutes}min`;
        
        // Color code based on FPS
        let color = '#00ff00'; // Green
        if (this.fps < this.thresholds.fpsCritical) {
            color = '#ff0000'; // Red
        } else if (this.fps < this.thresholds.fpsWarning) {
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
     * Get average FPS from recent history
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return this.fps;
        
        const sum = this.fpsHistory.reduce((total, fps) => total + fps, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        return {
            current: {
                fps: this.fps,
                deltaTime: this.deltaTime,
                memoryUsage: this.memoryUsage,
                physicsTime: this.physicsTime
            },
            averages: {
                fps: this.getAverageFPS(),
                deltaTime: this.deltaHistory.length > 0 ? 
                    this.deltaHistory.reduce((sum, delta) => sum + delta, 0) / this.deltaHistory.length : 0
            },
            peaks: {
                memoryPeak: this.memoryPeak,
                worstFPS: this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : this.fps,
                worstDelta: this.deltaHistory.length > 0 ? Math.max(...this.deltaHistory) : this.deltaTime
            },
            gameMetrics: { ...this.gameMetrics },
            warnings: this.gameMetrics.performanceWarnings
        };
    }
    
    /**
     * Export metrics data for analysis
     * @returns {Object} Complete metrics export
     */
    exportMetrics() {
        return {
            timestamp: Date.now(),
            sessionData: this.getPerformanceStats(),
            historicalData: {
                fpsHistory: [...this.fpsHistory],
                deltaHistory: [...this.deltaHistory],
                physicsHistory: [...this.physicsHistory]
            },
            metricsCollection: {
                samples: [...this.metricsCollection.samples]
            },
            thresholds: { ...this.thresholds }
        };
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
     * Reset game metrics (for new sessions)
     */
    resetGameMetrics() {
        this.gameMetrics = {
            runsCompleted: 0,
            bossesDefeated: 0,
            clonesForged: 0,
            averageRunTime: 0,
            bestRunScore: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            totalPlayTime: 0,
            performanceWarnings: 0
        };
        
        this.playTimeStart = Date.now();
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_METRICS_RESET', {
                subsystem: 'performance',
                message: 'Game metrics reset for new session'
            });
        }
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
     * Serialize state for saving
     * @returns {Object} Serialized state
     */
    serialize() {
        return {
            gameMetrics: { ...this.gameMetrics },
            memoryPeak: this.memoryPeak,
            thresholds: { ...this.thresholds },
            metricsCollection: {
                enabled: this.metricsCollection.enabled,
                interval: this.metricsCollection.interval,
                samples: this.metricsCollection.samples.slice(-10) // Keep last 10 samples
            }
        };
    }
    
    /**
     * Deserialize state from save
     * @param {Object} state - Saved state
     */
    deserialize(state) {
        if (state.gameMetrics) {
            this.gameMetrics = { ...this.gameMetrics, ...state.gameMetrics };
        }
        
        if (state.memoryPeak) {
            this.memoryPeak = state.memoryPeak;
        }
        
        if (state.thresholds) {
            this.thresholds = { ...this.thresholds, ...state.thresholds };
        }
        
        if (state.metricsCollection) {
            this.metricsCollection = { 
                ...this.metricsCollection, 
                ...state.metricsCollection,
                lastCollection: Date.now() // Reset collection timer
            };
        }
        
        // Reset play time tracking
        this.playTimeStart = Date.now();
        
        if (this.debug) {
            LOG.dev('PERFORMANCEMONITOR_STATE_DESERIALIZED', {
                subsystem: 'performance',
                message: 'Performance monitor state deserialized',
                runsCompleted: state.gameMetrics?.runsCompleted,
                bossesDefeated: state.gameMetrics?.bossesDefeated,
                clonesForged: state.gameMetrics?.clonesForged,
                memoryPeak: state.memoryPeak
            });
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
        
        // Remove event listeners
        const eventBus = EventBus.getInstance();
        eventBus.off(EventNames.LEVEL_COMPLETE, this.handleRunComplete);
        eventBus.off(EventNames.BOSS_DEFEATED, this.handleBossDefeated);
        eventBus.off(EventNames.CLONE_FORGE_COMPLETE, this.handleCloneForged);
        eventBus.off(EventNames.PERFORMANCE_METRIC_RECORDED, this.handlePerformanceWarning);
        
        this.scene = null;
        super.destroy();
    }
}