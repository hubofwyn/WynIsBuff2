import { CloneManager, EventBus } from '@features/core';
import { EventNames } from '../../constants/EventNames.js';

/**
 * EnhancedCloneManager - Extends CloneManager with decay and offline calculation
 * 
 * Adds:
 * - Production decay over time (2% per hour)
 * - Offline progress calculation (capped at 10 hours)
 * - Boost queue system for temporary multipliers
 * - Stability affecting decay rate
 */
export class EnhancedCloneManager extends CloneManager {
  constructor() {
    super();
    if (this.enhancedInitialized) return;
    this.initEnhanced();
  }

  initEnhanced() {
    // Debug flag - set to false in production
    this.debug = process.env.NODE_ENV !== 'production';
    
    // Clone lanes for production
    this.lanes = new Map(); // laneId -> lane data
    this.nextLaneId = 1;
    
    // Decay parameters
    this.decayRate = 0.02; // 2% per hour
    this.decayFloor = 0.6; // 60% minimum production
    
    // Offline parameters
    this.offlineCapHours = 10; // Maximum 10 hours of offline progress
    this.lastUpdateTime = Date.now();
    
    // Boost system
    this.activeBoosts = new Map(); // boostId -> boost data
    this.nextBoostId = 1;
    
    // Listen for forge events
    EventBus.getInstance().on(EventNames.CLONE_FORGE_START, this.handleForgeRequest.bind(this));
    
    this.enhancedInitialized = true;
  }

  /**
   * Handle a clone forge request from performance analysis
   * @param {Object} data - Forge request data
   */
  handleForgeRequest(data) {
    const { performance, routeId, stats } = data;
    
    // Create a new lane from the clone stats
    const lane = this.createCloneLane({
      rate: stats.rate,
      stability: stats.stability,
      specialty: stats.specialty,
      performance,
      routeId
    });
    
    // Emit creation event
    EventBus.getInstance().emit(EventNames.CLONE_FORGE_COMPLETE, {
      laneId: lane.id,
      rate: lane.currentRate,
      stability: lane.stability,
      specialty: lane.specialty
    });
    
    return lane;
  }

  /**
   * Create a new clone production lane
   * @param {Object} cloneData - Clone configuration
   * @returns {Object} Created lane
   */
  createCloneLane(cloneData) {
    const lane = {
      id: this.nextLaneId++,
      baseRate: cloneData.rate || 10,
      currentRate: cloneData.rate || 10,
      stability: cloneData.stability || 0.7,
      specialty: cloneData.specialty || 'balanced',
      
      // Time tracking
      createdAt: Date.now(),
      lastDecayUpdate: Date.now(),
      lastProduction: Date.now(),
      
      // Production totals
      totalProduced: {
        coins: 0,
        grit: 0,
        sparks: 0
      },
      
      // Source data
      performance: cloneData.performance,
      routeId: cloneData.routeId
    };
    
    this.lanes.set(lane.id, lane);
    
    // Start production immediately
    this.startLaneProduction(lane.id);
    
    if (this.debug) {
      console.log(`[EnhancedCloneManager] Created lane ${lane.id} with rate ${lane.baseRate}/s`);
    }
    
    return lane;
  }

  /**
   * Start production for a lane
   * @param {number} laneId - Lane ID
   */
  startLaneProduction(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    
    // Update decay first
    this.applyDecayToLane(laneId);
    
    // Lane is now producing
    lane.lastProduction = Date.now();
  }

  /**
   * Apply decay to a lane's production rate
   * @param {number} laneId - Lane ID
   */
  applyDecayToLane(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    
    const now = Date.now();
    const hoursSinceLastUpdate = (now - lane.lastDecayUpdate) / 3600000;
    
    if (hoursSinceLastUpdate > 0) {
      // Calculate decay with stability modifier
      // Higher stability = slower decay
      const effectiveDecayRate = this.decayRate * (1 - lane.stability * 0.5);
      const decayFactor = Math.pow(1 - effectiveDecayRate, hoursSinceLastUpdate);
      
      // Apply decay with floor
      const decayedRate = lane.baseRate * decayFactor;
      lane.currentRate = Math.max(decayedRate, lane.baseRate * this.decayFloor);
      
      lane.lastDecayUpdate = now;
      
      if (this.debug && hoursSinceLastUpdate > 0.1) { // Log significant decay
        console.log(`[EnhancedCloneManager] Lane ${laneId} decayed to ${lane.currentRate.toFixed(2)}/s`);
      }
    }
  }

  /**
   * Apply a temporary boost to a lane or globally
   * @param {Object} boost - Boost configuration
   */
  applyBoost(boost) {
    const boostData = {
      id: this.nextBoostId++,
      multiplier: boost.multiplier || 1.25,
      duration: boost.duration || 1800000, // 30 minutes default
      laneId: boost.laneId || null, // null = global boost
      startTime: Date.now(),
      endTime: Date.now() + (boost.duration || 1800000)
    };
    
    this.activeBoosts.set(boostData.id, boostData);
    
    // Emit boost applied event
    EventBus.getInstance().emit(EventNames.IDLE_BOOST_APPLIED, {
      boostId: boostData.id,
      multiplier: boostData.multiplier,
      duration: boostData.duration,
      target: boostData.laneId ? `lane_${boostData.laneId}` : 'global'
    });
    
    if (this.debug) {
      console.log(`[EnhancedCloneManager] Applied ${boostData.multiplier}x boost for ${boostData.duration / 60000} minutes`);
    }
    
    return boostData.id;
  }

  /**
   * Calculate effective production rate with boosts
   * @param {number} laneId - Lane ID
   * @returns {number} Effective rate
   */
  getEffectiveRate(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) return 0;
    
    let rate = lane.currentRate;
    const now = Date.now();
    
    // Apply active boosts
    for (const [boostId, boost] of this.activeBoosts) {
      if (boost.endTime < now) {
        // Boost expired, remove it
        this.activeBoosts.delete(boostId);
        continue;
      }
      
      // Apply if global or matching lane
      if (!boost.laneId || boost.laneId === laneId) {
        rate *= boost.multiplier;
      }
    }
    
    return rate;
  }

  /**
   * Calculate production for a time period
   * @param {number} laneId - Lane ID
   * @param {number} deltaMs - Time period in milliseconds
   * @returns {Object} Production amounts
   */
  calculateLaneProduction(laneId, deltaMs) {
    const lane = this.lanes.get(laneId);
    if (!lane) return { coins: 0, grit: 0, sparks: 0 };
    
    const rate = this.getEffectiveRate(laneId);
    const seconds = deltaMs / 1000;
    
    // Production based on specialty
    const production = {
      coins: 0,
      grit: 0,
      sparks: 0
    };
    
    switch (lane.specialty) {
      case 'speedster':
        production.coins = rate * seconds * 1.2;
        production.grit = rate * seconds * 0.3;
        break;
        
      case 'comboist':
        production.coins = rate * seconds * 0.8;
        production.grit = rate * seconds * 0.8;
        break;
        
      case 'survivor':
        production.coins = rate * seconds * 0.6;
        production.grit = rate * seconds * 0.6;
        production.sparks = rate * seconds * 0.1;
        break;
        
      case 'explorer':
        production.coins = rate * seconds * 0.5;
        production.grit = rate * seconds * 0.5;
        production.sparks = rate * seconds * 0.2;
        break;
        
      case 'warrior':
        production.grit = rate * seconds * 1.5;
        production.coins = rate * seconds * 0.4;
        break;
        
      default: // balanced
        production.coins = rate * seconds * 0.7;
        production.grit = rate * seconds * 0.7;
        production.sparks = rate * seconds * 0.05;
    }
    
    return production;
  }

  /**
   * Calculate offline production for all lanes
   * @param {number} lastSaveTime - Timestamp of last save
   * @returns {Object} Offline production summary
   */
  calculateOfflineProduction(lastSaveTime) {
    const now = Date.now();
    const deltaMs = now - lastSaveTime;
    
    // Cap offline time
    const cappedMs = Math.min(deltaMs, this.offlineCapHours * 3600000);
    
    if (this.debug) {
      console.log(`[EnhancedCloneManager] Calculating offline for ${(cappedMs / 3600000).toFixed(2)} hours`);
    }
    
    const totalProduction = {
      coins: 0,
      grit: 0,
      sparks: 0
    };
    
    const laneProductions = [];
    
    for (const [laneId, lane] of this.lanes) {
      // Apply decay based on offline time
      this.applyDecayToLane(laneId);
      
      // Calculate production with average rate (accounting for decay over time)
      const startRate = lane.baseRate;
      const endRate = lane.currentRate;
      const avgRate = (startRate + endRate) / 2;
      
      // Use average rate for offline calculation
      const tempRate = lane.currentRate;
      lane.currentRate = avgRate;
      
      const production = this.calculateLaneProduction(laneId, cappedMs);
      
      // Restore current rate
      lane.currentRate = tempRate;
      
      // Add to totals
      totalProduction.coins += production.coins;
      totalProduction.grit += production.grit;
      totalProduction.sparks += production.sparks;
      
      // Track per-lane production
      laneProductions.push({
        laneId,
        specialty: lane.specialty,
        production
      });
      
      // Update lane totals
      lane.totalProduced.coins += production.coins;
      lane.totalProduced.grit += production.grit;
      lane.totalProduced.sparks += production.sparks;
    }
    
    // Emit offline calculation event
    EventBus.getInstance().emit(EventNames.OFFLINE_CALCULATED, {
      timeElapsed: deltaMs,
      timeCapped: cappedMs,
      wasLimited: deltaMs > cappedMs,
      production: totalProduction,
      laneCount: this.lanes.size
    });
    
    return {
      timeElapsed: deltaMs,
      timeCapped: cappedMs,
      wasLimited: deltaMs > cappedMs,
      production: totalProduction,
      laneProductions,
      laneCount: this.lanes.size
    };
  }

  /**
   * Update production for all lanes (called each frame)
   */
  update() {
    const now = Date.now();
    
    for (const [laneId, lane] of this.lanes) {
      const timeSinceProduction = now - lane.lastProduction;
      
      if (timeSinceProduction >= 1000) { // Update every second
        const production = this.calculateLaneProduction(laneId, timeSinceProduction);
        
        // Add to lane totals
        lane.totalProduced.coins += production.coins;
        lane.totalProduced.grit += production.grit;
        lane.totalProduced.sparks += production.sparks;
        
        lane.lastProduction = now;
        
        // Apply decay periodically (every minute)
        if (now - lane.lastDecayUpdate > 60000) {
          this.applyDecayToLane(laneId);
        }
      }
    }
    
    // Clean up expired boosts
    for (const [boostId, boost] of this.activeBoosts) {
      if (boost.endTime < now) {
        this.activeBoosts.delete(boostId);
        if (this.debug) {
          console.log(`[EnhancedCloneManager] Boost ${boostId} expired`);
        }
      }
    }
    
    this.lastUpdateTime = now;
  }

  /**
   * Get all lane statistics
   * @returns {Array} Lane statistics
   */
  getAllLaneStats() {
    const stats = [];
    
    for (const [laneId, lane] of this.lanes) {
      stats.push({
        id: laneId,
        specialty: lane.specialty,
        baseRate: lane.baseRate,
        currentRate: lane.currentRate,
        effectiveRate: this.getEffectiveRate(laneId),
        stability: lane.stability,
        totalProduced: { ...lane.totalProduced },
        age: Date.now() - lane.createdAt,
        decayPercent: (lane.currentRate / lane.baseRate) * 100
      });
    }
    
    return stats;
  }

  /**
   * Reset a lane to refresh decay
   * @param {number} laneId - Lane ID
   */
  refreshLane(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    
    lane.currentRate = lane.baseRate;
    lane.lastDecayUpdate = Date.now();
    
    // Emit decay refresh event
    EventBus.getInstance().emit(EventNames.IDLE_DECAY_APPLIED, {
      laneId,
      action: 'refresh',
      newRate: lane.currentRate
    });
    
    if (this.debug) {
      console.log(`[EnhancedCloneManager] Lane ${laneId} refreshed to ${lane.baseRate}/s`);
    }
  }

  /**
   * Serialize state for saving
   * @returns {Object} Serialized state
   */
  serialize() {
    const baseState = super.serialize ? super.serialize() : {};
    
    return {
      ...baseState,
      lanes: Array.from(this.lanes.entries()),
      activeBoosts: Array.from(this.activeBoosts.entries()),
      lastUpdateTime: this.lastUpdateTime,
      nextLaneId: this.nextLaneId,
      nextBoostId: this.nextBoostId
    };
  }

  /**
   * Deserialize state from save
   * @param {Object} state - Saved state
   */
  deserialize(state) {
    if (super.deserialize) {
      super.deserialize(state);
    }
    
    if (state.lanes) {
      this.lanes = new Map(state.lanes);
    }
    
    if (state.activeBoosts) {
      this.activeBoosts = new Map(state.activeBoosts);
    }
    
    this.lastUpdateTime = state.lastUpdateTime || Date.now();
    this.nextLaneId = state.nextLaneId || 1;
    this.nextBoostId = state.nextBoostId || 1;
    
    // Calculate offline progress
    if (this.lastUpdateTime < Date.now() - 60000) { // More than 1 minute offline
      const offline = this.calculateOfflineProduction(this.lastUpdateTime);
      if (this.debug) {
        console.log('[EnhancedCloneManager] Offline production:', offline.production);
      }
    }
  }
}