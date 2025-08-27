import { BaseManager, EventBus, EconomyManager } from '@features/core';
import { EventNames } from '../../constants/EventNames.js';

/**
 * BossRewardSystem - Manages rewards for defeating bosses
 * 
 * Rewards include:
 * - Movement tech unlocks
 * - Bulk DNA traits
 * - Clone mutations
 * - Resource bonuses
 */
export class BossRewardSystem extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.init();
  }

  init() {
    // Debug flag
    this.debug = process.env.NODE_ENV !== 'production';
    
    // Boss reward configurations
    this.bossRewards = new Map([
      ['the-clumper', {
        id: 'the-clumper',
        name: 'The Clumper',
        tier: 1,
        rewards: {
          firstClear: {
            movementTech: 'tripleJump',
            buffDNA: 10,
            gritShards: 5,
            coins: 1000,
            cloneMutation: 'protein_synthesis'
          },
          repeat: {
            buffDNA: 3,
            gritShards: 1,
            coins: 500
          }
        }
      }],
      ['the-pulsar', {
        id: 'the-pulsar',
        name: 'The Pulsar',
        tier: 2,
        rewards: {
          firstClear: {
            movementTech: 'wallDash',
            buffDNA: 20,
            gritShards: 10,
            coins: 2500,
            cloneMutation: 'rhythm_sync'
          },
          repeat: {
            buffDNA: 5,
            gritShards: 2,
            coins: 1000
          }
        }
      }],
      ['the-bulk', {
        id: 'the-bulk',
        name: 'The Bulk',
        tier: 3,
        rewards: {
          firstClear: {
            movementTech: 'momentumVault',
            buffDNA: 50,
            gritShards: 25,
            coins: 10000,
            cloneMutation: 'mass_production'
          },
          repeat: {
            buffDNA: 10,
            gritShards: 5,
            coins: 2500
          }
        }
      }]
    ]);
    
    // Track defeated bosses (for first clear vs repeat)
    this.defeatedBosses = new Set();
    
    // Event listeners
    this.setupEventListeners();
    
    this.setInitialized();
  }

  setupEventListeners() {
    const eventBus = EventBus.getInstance();
    
    // Listen for boss defeats
    eventBus.on(EventNames.BOSS_DEFEATED, this.handleBossDefeated.bind(this));
  }

  /**
   * Handle boss defeat event
   * @param {Object} data - Boss defeat data
   */
  handleBossDefeated(data) {
    const { bossId, runScore, timeElapsed, hitsTaken } = data;
    
    const bossConfig = this.bossRewards.get(bossId);
    if (!bossConfig) {
      if (this.debug) {
        console.warn(`[BossRewardSystem] Unknown boss: ${bossId}`);
      }
      return;
    }
    
    // Determine if first clear or repeat
    const isFirstClear = !this.defeatedBosses.has(bossId);
    const rewards = isFirstClear ? bossConfig.rewards.firstClear : bossConfig.rewards.repeat;
    
    // Calculate reward multipliers based on performance
    const multipliers = this.calculateMultipliers(runScore, timeElapsed, hitsTaken);
    
    // Grant rewards
    const grantedRewards = this.grantRewards(rewards, multipliers, isFirstClear);
    
    // Mark boss as defeated
    if (isFirstClear) {
      this.defeatedBosses.add(bossId);
      
      // Emit first clear event
      EventBus.getInstance().emit(EventNames.BOSS_FIRST_CLEAR, {
        bossId,
        bossName: bossConfig.name,
        tier: bossConfig.tier,
        rewards: grantedRewards
      });
    }
    
    // Emit reward claimed event
    EventBus.getInstance().emit(EventNames.BOSS_REWARD_CLAIMED, {
      bossId,
      bossName: bossConfig.name,
      isFirstClear,
      rewards: grantedRewards,
      multipliers
    });
    
    if (this.debug) {
      console.log(`[BossRewardSystem] ${bossConfig.name} defeated (${isFirstClear ? 'first clear' : 'repeat'})`);
      console.log('[BossRewardSystem] Rewards granted:', grantedRewards);
    }
  }

  /**
   * Calculate reward multipliers based on performance
   * @param {Object} runScore - Performance score (S,C,H,R,B)
   * @param {number} timeElapsed - Time to defeat boss (ms)
   * @param {number} hitsTaken - Number of hits taken
   * @returns {Object} Multipliers for different reward types
   */
  calculateMultipliers(runScore = {}, timeElapsed = 0, hitsTaken = 0) {
    const multipliers = {
      coins: 1.0,
      buffDNA: 1.0,
      gritShards: 1.0
    };
    
    // Speed bonus (under 2 minutes = up to 50% bonus)
    if (timeElapsed > 0 && timeElapsed < 120000) {
      const speedBonus = Math.max(0, 1.5 - (timeElapsed / 120000));
      multipliers.coins *= speedBonus;
    }
    
    // No-hit bonus (100% bonus for perfect run)
    if (hitsTaken === 0) {
      multipliers.buffDNA *= 2.0;
      multipliers.gritShards *= 1.5;
    } else if (hitsTaken <= 3) {
      // Small bonus for low hits
      multipliers.buffDNA *= 1.25;
    }
    
    // Combo bonus from runScore
    if (runScore.C) {
      const comboBonus = Math.min(2.0, 1.0 + (runScore.C / 100));
      multipliers.coins *= comboBonus;
    }
    
    // Style bonus from S and B scores
    if (runScore.S && runScore.B) {
      const styleBonus = 1.0 + ((runScore.S + runScore.B) / 200);
      multipliers.buffDNA *= styleBonus;
    }
    
    return multipliers;
  }

  /**
   * Grant rewards to the player
   * @param {Object} rewards - Base reward configuration
   * @param {Object} multipliers - Performance multipliers
   * @param {boolean} isFirstClear - First clear or repeat
   * @returns {Object} Granted rewards with final amounts
   */
  grantRewards(rewards, multipliers, isFirstClear) {
    const economyManager = EconomyManager.getInstance();
    const eventBus = EventBus.getInstance();
    const grantedRewards = {};
    
    // Grant resources with multipliers
    if (rewards.coins) {
      const amount = Math.floor(rewards.coins * multipliers.coins);
      economyManager.addResource('coins', amount);
      grantedRewards.coins = amount;
    }
    
    if (rewards.buffDNA) {
      const amount = Math.floor(rewards.buffDNA * multipliers.buffDNA);
      economyManager.addResource('buffDNA', amount);
      grantedRewards.buffDNA = amount;
    }
    
    if (rewards.gritShards) {
      const amount = Math.floor(rewards.gritShards * multipliers.gritShards);
      economyManager.addResource('gritShards', amount);
      grantedRewards.gritShards = amount;
    }
    
    // Grant movement tech (first clear only, no multiplier)
    if (isFirstClear && rewards.movementTech) {
      eventBus.emit(EventNames.MOVEMENT_UNLOCKED, {
        tech: rewards.movementTech
      });
      grantedRewards.movementTech = rewards.movementTech;
    }
    
    // Grant clone mutation (first clear only, no multiplier)
    if (isFirstClear && rewards.cloneMutation) {
      eventBus.emit(EventNames.CLONE_MUTATION, {
        mutation: rewards.cloneMutation,
        source: 'boss_reward'
      });
      grantedRewards.cloneMutation = rewards.cloneMutation;
    }
    
    return grantedRewards;
  }

  /**
   * Get reward preview for a boss
   * @param {string} bossId - Boss identifier
   * @param {boolean} firstClear - Preview first clear or repeat rewards
   * @returns {Object} Reward configuration
   */
  getRewardPreview(bossId, firstClear = true) {
    const bossConfig = this.bossRewards.get(bossId);
    if (!bossConfig) return null;
    
    return {
      boss: {
        id: bossConfig.id,
        name: bossConfig.name,
        tier: bossConfig.tier
      },
      rewards: firstClear ? bossConfig.rewards.firstClear : bossConfig.rewards.repeat,
      isFirstClear: firstClear && !this.defeatedBosses.has(bossId)
    };
  }

  /**
   * Check if boss has been defeated before
   * @param {string} bossId - Boss identifier
   * @returns {boolean} Has been defeated
   */
  hasBeenDefeated(bossId) {
    return this.defeatedBosses.has(bossId);
  }

  /**
   * Get all defeated bosses
   * @returns {Array} List of defeated boss IDs
   */
  getDefeatedBosses() {
    return Array.from(this.defeatedBosses);
  }

  /**
   * Serialize state for saving
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      defeatedBosses: Array.from(this.defeatedBosses)
    };
  }

  /**
   * Deserialize state from save
   * @param {Object} state - Saved state
   */
  deserialize(state) {
    if (state.defeatedBosses) {
      this.defeatedBosses = new Set(state.defeatedBosses);
    }
  }
}