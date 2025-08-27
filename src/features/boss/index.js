/**
 * Boss System Feature Module
 * 
 * Central barrel export for all boss-related managers and controllers.
 * Handles boss encounters, AI, rewards, and progression.
 */

// Core Boss System
export { BossManager } from '../../modules/boss/BossManager.js';
export { BossController } from '../../modules/boss/BossController.js';
export { BossSpawner } from '../../modules/boss/BossSpawner.js';

// Boss AI and Behavior
export { BossAI } from '../../modules/boss/BossAI.js';
export { BossPhaseController } from '../../modules/boss/BossPhaseController.js';
export { BossAttackPatterns } from '../../modules/boss/BossAttackPatterns.js';

// Boss Rewards and Progression
export { BossRewardSystem } from '../../modules/boss/BossRewardSystem.js';
export { BossProgressionTracker } from '../../modules/boss/BossProgressionTracker.js';

// Boss Health and Damage
export { BossHealthManager } from '../../modules/boss/BossHealthManager.js';
export { BossDamageCalculator } from '../../modules/boss/BossDamageCalculator.js';

// Boss Timer System
export { BossTimerManager } from '../../modules/boss/BossTimerManager.js';

// Boss Data Definitions
export { BossDefinitions } from '../../modules/boss/data/BossDefinitions.js';
export { BossRewardTables } from '../../modules/boss/data/BossRewardTables.js';
export { BossScalingFormulas } from '../../modules/boss/data/BossScalingFormulas.js';