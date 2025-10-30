import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * PrecisionTimingController tracks precise input timing and patterns
 * for muscle memory development and advanced gameplay mechanics.
 */
export class PrecisionTimingController {
    /**
     * Create a new PrecisionTimingController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Timing tracking
        this.inputHistory = []; // Stores recent input events with precise timestamps
        this.historyMaxSize = 100; // Keep last 100 inputs
        
        // Pattern recognition
        this.commonPatterns = new Map(); // Stores recognized input patterns
        this.patternThreshold = 3; // Minimum occurrences to recognize pattern
        this.maxPatternLength = 8; // Maximum inputs in a pattern
        
        // Precision metrics
        this.timingMetrics = {
            averageReactionTime: 0,
            inputConsistency: 0, // How consistent timing is between similar actions
            patternAccuracy: 0,  // How accurately patterns are repeated
            muscleMemoryScore: 0, // Overall muscle memory development score
            
            // Detailed statistics
            totalInputs: 0,
            perfectTimings: 0, // Inputs within perfect timing window
            goodTimings: 0,    // Inputs within good timing window
            missedTimings: 0,  // Inputs outside acceptable windows
            
            // Timing windows (in milliseconds)
            perfectWindow: 16.67, // 1 frame at 60fps
            goodWindow: 33.33,    // 2 frames at 60fps
            acceptableWindow: 50  // 3 frames at 60fps
        };
        
        // Input prediction
        this.inputPrediction = {
            predictedInputs: new Map(), // What inputs we expect next
            confidence: 0,             // Confidence in predictions (0-1)
            predictionWindow: 200,     // How far ahead to predict (ms)
            adaptationRate: 0.1        // How quickly to adapt predictions
        };
        
        // Performance tracking for different actions
        this.actionPerformance = {
            jump: { attempts: 0, perfectTimings: 0, averageDelay: 0 },
            wallJump: { attempts: 0, perfectTimings: 0, averageDelay: 0 },
            movement: { attempts: 0, perfectTimings: 0, averageDelay: 0 },
            combo: { attempts: 0, perfectTimings: 0, averageDelay: 0 }
        };

        LOG.dev('PRECISIONTIMINGCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'PrecisionTimingController initialized with muscle memory tracking'
        });
    }
    
    /**
     * Update timing controller every frame
     * @param {object} input - Current input state
     * @param {object} gameState - Current game state (position, velocity, etc.)
     */
    update(input, gameState) {
        const currentTime = performance.now();
        
        // Track input events
        this.trackInputEvents(input, currentTime);
        
        // Update pattern recognition
        this.updatePatternRecognition();
        
        // Update input predictions
        this.updateInputPredictions(currentTime);
        
        // Calculate timing metrics
        this.calculateTimingMetrics();
        
        // Clean old history
        this.cleanInputHistory(currentTime);
    }
    
    /**
     * Get current timing statistics
     * @returns {object} Current timing metrics and statistics
     */
    getTimingStats() {
        return {
            metrics: { ...this.timingMetrics },
            patterns: Array.from(this.commonPatterns.entries())
                .map(([key, data]) => ({ key, ...data }))
                .sort((a, b) => b.count - a.count),
            actionPerformance: { ...this.actionPerformance },
            historyLength: this.inputHistory.length
        };
    }
    
    /**
     * Track input events with precise timestamps (simplified version)
     */
    trackInputEvents(input, timestamp) {
        // Simplified input tracking without complex pattern analysis
        if (input.spaceKey && input.spaceKey.isDown) {
            this.timingMetrics.totalInputs++;
        }
    }
    
    /**
     * Update pattern recognition (simplified)
     */
    updatePatternRecognition() {
        // Basic pattern recognition placeholder
        this.timingMetrics.patternAccuracy = Math.min(this.timingMetrics.totalInputs / 100, 1.0);
    }
    
    /**
     * Update input predictions (simplified)
     */
    updateInputPredictions(currentTime) {
        // Simple prediction system placeholder
        this.inputPrediction.confidence = Math.min(this.timingMetrics.totalInputs / 50, 1.0);
    }
    
    /**
     * Calculate timing metrics (simplified)
     */
    calculateTimingMetrics() {
        this.timingMetrics.inputConsistency = Math.min(this.timingMetrics.totalInputs / 75, 1.0);
        this.timingMetrics.muscleMemoryScore = 
            (this.timingMetrics.inputConsistency * 0.4) +
            (this.timingMetrics.patternAccuracy * 0.4) + 
            0.2;
    }
    
    /**
     * Clean old input history
     */
    cleanInputHistory(currentTime) {
        const maxAge = 10000; // 10 seconds
        
        while (this.inputHistory.length > 0 && 
               currentTime - this.inputHistory[0].timestamp > maxAge) {
            this.inputHistory.shift();
        }
    }
    
    /**
     * Record a timing event for a specific action
     */
    recordActionTiming(action, actualTiming, optimalTiming = null) {
        if (!this.actionPerformance[action]) {
            this.actionPerformance[action] = {
                attempts: 0,
                perfectTimings: 0,
                averageDelay: 0
            };
        }
        
        this.actionPerformance[action].attempts++;
        this.timingMetrics.totalInputs++;
    }
    
    /**
     * Reset all timing data
     */
    reset() {
        this.inputHistory = [];
        this.commonPatterns.clear();
        
        Object.keys(this.timingMetrics).forEach(key => {
            if (typeof this.timingMetrics[key] === 'number' && !key.includes('Window')) {
                this.timingMetrics[key] = 0;
            }
        });
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        this.reset();
    }
}