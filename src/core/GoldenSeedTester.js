import { BaseManager, DeterministicRNG, PhysicsManager } from '@features/core';
import { LOG } from '../observability/core/LogSystem.js';

/**
 * GoldenSeedTester - Framework for deterministic testing with golden seed 1138
 * 
 * Records game state snapshots and validates deterministic behavior.
 * Used to ensure the same seed produces identical results across runs.
 */
export class GoldenSeedTester extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.init();
  }

  init() {
    // Debug flag - set to false in production
    this.debug = process.env.NODE_ENV !== 'production';
    
    // Golden seed constant
    this.GOLDEN_SEED = 1138;
    
    // Recording state
    this.isRecording = false;
    this.isValidating = false;
    
    // Frame data storage
    this.recordedFrames = [];
    this.currentFrame = 0;
    
    // Tolerance for floating point comparison
    this.positionTolerance = 0.001; // 0.001 pixels
    this.velocityTolerance = 0.001;
    
    // Systems to track
    this.rng = null;
    this.physics = null;
    this.eventBus = null;
    
    this.setInitialized();
  }

  /**
   * Start recording a golden seed run
   * @param {Object} options - Recording options
   */
  startRecording(options = {}) {
    const {
      seed = this.GOLDEN_SEED,
      maxFrames = 600, // 10 seconds at 60fps
      systems = {}
    } = options;
    
    if (this.debug) {
      LOG.dev('GOLDENSEED_RECORD_START', {
        subsystem: 'testing',
        message: 'Starting golden seed recording',
        seed,
        maxFrames
      });
    }
    
    // Initialize RNG with golden seed
    this.rng = DeterministicRNG.getInstance();
    this.rng.init(seed);
    
    // Store system references
    this.physics = systems.physics || PhysicsManager.getInstance();
    this.eventBus = systems.eventBus;
    
    // Reset recording state
    this.recordedFrames = [];
    this.currentFrame = 0;
    this.maxFrames = maxFrames;
    this.isRecording = true;
    this.isValidating = false;
    
    // Record initial RNG state
    this.initialRNGState = this.rng.serialize();
    
    return {
      seed,
      startTime: Date.now(),
      maxFrames
    };
  }

  /**
   * Record current frame state
   * @param {Object} gameState - Current game state to record
   */
  recordFrame(gameState) {
    if (!this.isRecording || this.currentFrame >= this.maxFrames) {
      return;
    }
    
    const frameData = {
      frame: this.currentFrame,
      timestamp: performance.now(),
      
      // Player state
      player: gameState.player ? {
        x: gameState.player.x,
        y: gameState.player.y,
        vx: gameState.player.vx || 0,
        vy: gameState.player.vy || 0,
        grounded: gameState.player.grounded || false,
        facing: gameState.player.facing || 'right'
      } : null,
      
      // Enemies state
      enemies: (gameState.enemies || []).map(enemy => ({
        id: enemy.id,
        x: enemy.x,
        y: enemy.y,
        vx: enemy.vx || 0,
        vy: enemy.vy || 0,
        health: enemy.health
      })),
      
      // Collectibles state
      collectibles: (gameState.collectibles || []).map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        collected: item.collected || false
      })),
      
      // RNG state
      rngState: this.rng ? this.rng.getStateHash() : null,
      
      // Physics metrics
      physics: {
        accumulator: this.physics?.accumulator || 0,
        bodyCount: this.physics?.world?.bodies?.size || 0
      },
      
      // Game metrics
      metrics: {
        score: gameState.score || 0,
        coins: gameState.coins || 0,
        time: gameState.time || 0
      }
    };
    
    this.recordedFrames.push(frameData);
    this.currentFrame++;
    
    // Log milestone frames
    if (this.debug && this.currentFrame % 60 === 0) {
      LOG.dev('GOLDENSEED_FRAME_MILESTONE', {
        subsystem: 'testing',
        message: 'Recorded frame milestone',
        currentFrame: this.currentFrame,
        maxFrames: this.maxFrames
      });
    }
  }

  /**
   * Stop recording and generate snapshot
   * @returns {Object} Recording snapshot
   */
  stopRecording() {
    if (!this.isRecording) {
      return null;
    }
    
    this.isRecording = false;
    
    const snapshot = {
      seed: this.GOLDEN_SEED,
      totalFrames: this.recordedFrames.length,
      frames: this.recordedFrames,
      initialRNGState: this.initialRNGState,
      finalRNGState: this.rng ? this.rng.serialize() : null,
      timestamp: Date.now()
    };
    
    if (this.debug) {
      LOG.dev('GOLDENSEED_RECORD_COMPLETE', {
        subsystem: 'testing',
        message: 'Recording complete',
        totalFrames: snapshot.totalFrames
      });
    }

    return snapshot;
  }

  /**
   * Start validating against a golden snapshot
   * @param {Object} snapshot - Previously recorded snapshot
   */
  startValidation(snapshot) {
    if (!snapshot || !snapshot.frames) {
      if (this.debug) {
        LOG.error('GOLDENSEED_INVALID_SNAPSHOT', {
          subsystem: 'testing',
          message: 'Invalid snapshot provided for validation',
          hint: 'Ensure snapshot has frames array and was properly recorded'
        });
      }
      return false;
    }
    
    if (this.debug) {
      LOG.dev('GOLDENSEED_VALIDATION_START', {
        subsystem: 'testing',
        message: 'Starting golden seed validation',
        totalFrames: snapshot.totalFrames
      });
    }
    
    // Initialize RNG with same seed
    this.rng = DeterministicRNG.getInstance();
    this.rng.deserialize(snapshot.initialRNGState);
    
    this.validationSnapshot = snapshot;
    this.validationErrors = [];
    this.currentFrame = 0;
    this.isValidating = true;
    this.isRecording = false;
    
    return true;
  }

  /**
   * Validate current frame against snapshot
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if frame matches
   */
  validateFrame(gameState) {
    if (!this.isValidating || this.currentFrame >= this.validationSnapshot.frames.length) {
      return true;
    }
    
    const expectedFrame = this.validationSnapshot.frames[this.currentFrame];
    const errors = [];
    
    // Validate player position
    if (gameState.player && expectedFrame.player) {
      const posDiff = Math.abs(gameState.player.x - expectedFrame.player.x) + 
                     Math.abs(gameState.player.y - expectedFrame.player.y);
      
      if (posDiff > this.positionTolerance) {
        errors.push({
          frame: this.currentFrame,
          type: 'player_position',
          expected: { x: expectedFrame.player.x, y: expectedFrame.player.y },
          actual: { x: gameState.player.x, y: gameState.player.y },
          difference: posDiff
        });
      }
    }
    
    // Validate RNG state
    const currentRNGHash = this.rng ? this.rng.getStateHash() : null;
    if (currentRNGHash !== expectedFrame.rngState) {
      errors.push({
        frame: this.currentFrame,
        type: 'rng_state',
        expected: expectedFrame.rngState,
        actual: currentRNGHash
      });
    }
    
    // Validate metrics
    if (gameState.score !== expectedFrame.metrics.score) {
      errors.push({
        frame: this.currentFrame,
        type: 'score',
        expected: expectedFrame.metrics.score,
        actual: gameState.score || 0
      });
    }
    
    // Log errors
    if (errors.length > 0) {
      this.validationErrors.push(...errors);
      if (this.debug) {
        LOG.error('GOLDENSEED_VALIDATION_FAILED', {
          subsystem: 'testing',
          message: 'Frame validation failed',
          frame: this.currentFrame,
          errorCount: errors.length,
          errors,
          hint: 'Check game state, RNG state, and metrics for determinism issues'
        });
      }
    }

    this.currentFrame++;

    // Log progress
    if (this.debug && this.currentFrame % 60 === 0) {
      LOG.dev('GOLDENSEED_VALIDATION_PROGRESS', {
        subsystem: 'testing',
        message: 'Validation progress milestone',
        currentFrame: this.currentFrame,
        totalFrames: this.validationSnapshot.frames.length
      });
    }
    
    return errors.length === 0;
  }

  /**
   * Stop validation and generate report
   * @returns {Object} Validation report
   */
  stopValidation() {
    if (!this.isValidating) {
      return null;
    }
    
    this.isValidating = false;
    
    const report = {
      success: this.validationErrors.length === 0,
      framesValidated: this.currentFrame,
      totalFrames: this.validationSnapshot.frames.length,
      errors: this.validationErrors,
      errorSummary: this.summarizeErrors()
    };
    
    if (this.debug) {
      if (report.success) {
        LOG.info('GOLDENSEED_VALIDATION_PASSED', {
          subsystem: 'testing',
          message: '✅ Validation PASSED! All frames match',
          framesValidated: report.framesValidated
        });
      } else {
        LOG.error('GOLDENSEED_VALIDATION_COMPLETE_FAILED', {
          subsystem: 'testing',
          message: '❌ Validation FAILED!',
          errorCount: this.validationErrors.length,
          framesValidated: report.framesValidated,
          totalFrames: this.validationSnapshot.frames.length,
          hint: 'Review errorSummary in report for patterns. Check RNG, state management, and input handling.'
        });
      }
    }
    
    return report;
  }

  /**
   * Summarize validation errors by type
   * @returns {Object} Error summary
   */
  summarizeErrors() {
    const summary = {};
    
    for (const error of this.validationErrors) {
      if (!summary[error.type]) {
        summary[error.type] = {
          count: 0,
          firstFrame: error.frame,
          lastFrame: error.frame
        };
      }
      
      summary[error.type].count++;
      summary[error.type].lastFrame = error.frame;
    }
    
    return summary;
  }

  /**
   * Save snapshot to JSON
   * @param {Object} snapshot - Snapshot to save
   * @returns {string} JSON string
   */
  exportSnapshot(snapshot) {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Load snapshot from JSON
   * @param {string} json - JSON string
   * @returns {Object} Parsed snapshot
   */
  importSnapshot(json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      if (this.debug) {
        LOG.error('GOLDENSEED_PARSE_ERROR', {
          subsystem: 'testing',
          error,
          message: 'Failed to parse snapshot JSON',
          hint: 'Check JSON format and integrity. Snapshot may be corrupted.'
        });
      }
      return null;
    }
  }

  /**
   * Generate a simple hash for state comparison
   * @param {Object} state - State object
   * @returns {number} Hash value
   */
  hashState(state) {
    const str = JSON.stringify(state);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash;
  }
}