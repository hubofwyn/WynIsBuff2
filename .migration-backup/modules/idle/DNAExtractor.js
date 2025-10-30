/**
 * DNAExtractor - Analyzes player performance and extracts DNA traits for clone forging
 * 
 * Converts raw gameplay metrics into the S.C.H.R.B. stat system:
 * - S (Speed): Movement velocity, reaction time, speedrun performance
 * - C (Combat): Damage dealt, enemies defeated, combat efficiency
 * - H (Height): Jump mastery, aerial control, verticality usage
 * - R (Resource): Collection efficiency, secret finding, exploration
 * - B (Buff): Power-up usage, buff uptime, enhancement mastery
 */

import { EventBus } from '../../core/EventBus.js';
import { EventNames } from '../../constants/EventNames.js';

export class DNAExtractor {
    constructor() {
        // Current run metrics being tracked
        this.currentRunMetrics = {
            // Speed metrics
            startTime: 0,
            totalDistance: 0,
            maxVelocity: 0,
            averageVelocity: 0,
            velocitySamples: [],
            dashesUsed: 0,
            perfectDashes: 0,
            
            // Combat metrics
            enemiesEncountered: 0,
            enemiesDefeated: 0,
            damageDealt: 0,
            damageTaken: 0,
            criticalHits: 0,
            comboDamage: 0,
            maxCombo: 0,
            
            // Height metrics
            totalJumps: 0,
            successfulJumps: 0,
            maxJumpHeight: 0,
            totalAirTime: 0,
            wallJumps: 0,
            perfectLandings: 0,
            aerialKills: 0,
            
            // Resource metrics
            collectiblesFound: 0,
            totalCollectibles: 0,
            secretsFound: 0,
            totalSecrets: 0,
            bonusObjectives: 0,
            explorationScore: 0,
            
            // Buff metrics
            powerUpsCollected: 0,
            powerUpsUsed: 0,
            totalBuffTime: 0,
            maxBuffStack: 0,
            buffCombos: 0,
            perfectBuffTiming: 0,
            
            // Meta metrics
            deathCount: 0,
            checkpointsReached: 0,
            bossesDefeated: 0,
            perfectSections: 0,
            stylePoints: 0
        };
        
        // Baseline expectations for normalization
        this.baselines = {
            expectedTime: 120,        // 2 minutes for standard level
            expectedSpeed: 5.0,       // Base movement speed
            expectedJumpHeight: 10,   // Standard jump height
            expectedKills: 0.8,       // 80% enemy defeat rate
            expectedCollection: 0.7,  // 70% collectible rate
            expectedBuffUptime: 0.3   // 30% buff uptime
        };
        
        // Weight factors for trait extraction
        this.traitWeights = {
            // Speed trait sources
            speedrunner: { speed: 0.8, minValue: 1.2 },
            dasher: { speed: 0.6, minDashes: 10 },
            momentum: { speed: 0.7, minVelocity: 7 },
            
            // Combat trait sources
            warrior: { combat: 0.8, minKillRate: 0.9 },
            berserker: { combat: 0.7, minDamage: 500 },
            tactician: { combat: 0.6, minCombo: 10 },
            
            // Height trait sources
            acrobat: { height: 0.8, minAirTime: 30 },
            wallRunner: { height: 0.7, minWallJumps: 5 },
            skyDancer: { height: 0.9, minAerialKills: 3 },
            
            // Resource trait sources
            collector: { resource: 0.8, minCollection: 0.9 },
            explorer: { resource: 0.7, minSecrets: 2 },
            completionist: { resource: 0.9, minCompletion: 1.0 },
            
            // Buff trait sources
            enhancer: { buff: 0.8, minBuffTime: 40 },
            combiner: { buff: 0.7, minBuffCombos: 3 },
            optimizer: { buff: 0.9, minEfficiency: 0.8 }
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Track speed metrics
        EventBus.on(EventNames.PLAYER_MOVE, (data) => {
            this.trackMovement(data);
        });
        
        EventBus.on(EventNames.PLAYER_DASH, (data) => {
            this.currentRunMetrics.dashesUsed++;
            if (data.perfect) this.currentRunMetrics.perfectDashes++;
        });
        
        // Track combat metrics
        EventBus.on(EventNames.custom('combat', 'enemyDefeated'), (data) => {
            this.trackCombat(data);
        });
        
        EventBus.on(EventNames.BOSS_DEFEATED, () => {
            this.currentRunMetrics.bossesDefeated++;
            this.currentRunMetrics.stylePoints += 100;
        });
        
        // Track height metrics
        EventBus.on(EventNames.PLAYER_JUMP, (data) => {
            this.trackJump(data);
        });
        
        EventBus.on(EventNames.WALL_JUMP, () => {
            this.currentRunMetrics.wallJumps++;
        });
        
        // Track resource metrics
        EventBus.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
            this.trackCollection(data);
        });
        
        // Track buff metrics
        EventBus.on(EventNames.custom('powerup', 'collected'), (data) => {
            this.trackPowerUp(data);
        });
        
        // Run completion
        EventBus.on(EventNames.LEVEL_COMPLETE, (data) => {
            this.finalizeRunMetrics(data);
        });
    }
    
    /**
     * Track movement for speed calculations
     */
    trackMovement(data) {
        if (data.velocity) {
            this.currentRunMetrics.velocitySamples.push(data.velocity);
            this.currentRunMetrics.maxVelocity = Math.max(
                this.currentRunMetrics.maxVelocity,
                data.velocity
            );
        }
        
        if (data.distance) {
            this.currentRunMetrics.totalDistance += data.distance;
        }
    }
    
    /**
     * Track combat events
     */
    trackCombat(data) {
        this.currentRunMetrics.enemiesDefeated++;
        
        if (data.damage) {
            this.currentRunMetrics.damageDealt += data.damage;
            
            if (data.critical) {
                this.currentRunMetrics.criticalHits++;
            }
            
            if (data.combo) {
                this.currentRunMetrics.comboDamage += data.damage;
                this.currentRunMetrics.maxCombo = Math.max(
                    this.currentRunMetrics.maxCombo,
                    data.combo
                );
            }
        }
        
        if (data.aerial) {
            this.currentRunMetrics.aerialKills++;
        }
    }
    
    /**
     * Track jump performance
     */
    trackJump(data) {
        this.currentRunMetrics.totalJumps++;
        
        if (data.successful !== false) {
            this.currentRunMetrics.successfulJumps++;
        }
        
        if (data.height) {
            this.currentRunMetrics.maxJumpHeight = Math.max(
                this.currentRunMetrics.maxJumpHeight,
                data.height
            );
        }
        
        if (data.airTime) {
            this.currentRunMetrics.totalAirTime += data.airTime;
        }
        
        if (data.perfectLanding) {
            this.currentRunMetrics.perfectLandings++;
        }
    }
    
    /**
     * Track collectible gathering
     */
    trackCollection(data) {
        this.currentRunMetrics.collectiblesFound++;
        
        if (data.secret) {
            this.currentRunMetrics.secretsFound++;
        }
        
        if (data.bonus) {
            this.currentRunMetrics.bonusObjectives++;
        }
        
        if (data.explorationPoints) {
            this.currentRunMetrics.explorationScore += data.explorationPoints;
        }
    }
    
    /**
     * Track power-up usage
     */
    trackPowerUp(data) {
        this.currentRunMetrics.powerUpsCollected++;
        
        if (data.used) {
            this.currentRunMetrics.powerUpsUsed++;
        }
        
        if (data.duration) {
            this.currentRunMetrics.totalBuffTime += data.duration;
        }
        
        if (data.stacked) {
            this.currentRunMetrics.maxBuffStack = Math.max(
                this.currentRunMetrics.maxBuffStack,
                data.stackCount
            );
        }
        
        if (data.combo) {
            this.currentRunMetrics.buffCombos++;
        }
        
        if (data.perfectTiming) {
            this.currentRunMetrics.perfectBuffTiming++;
        }
    }
    
    /**
     * Finalize metrics and extract DNA
     */
    finalizeRunMetrics(levelData) {
        // Calculate averages
        if (this.currentRunMetrics.velocitySamples.length > 0) {
            const sum = this.currentRunMetrics.velocitySamples.reduce((a, b) => a + b, 0);
            this.currentRunMetrics.averageVelocity = sum / this.currentRunMetrics.velocitySamples.length;
        }
        
        // Add level completion data
        const runTime = levelData.completionTime || (Date.now() - this.currentRunMetrics.startTime);
        
        // Create complete run data
        const runData = {
            runId: `run_${Date.now()}`,
            ...this.currentRunMetrics,
            completionTime: runTime,
            perfectRun: levelData.perfectRun || false,
            totalEnemies: levelData.totalEnemies || this.currentRunMetrics.enemiesEncountered,
            totalCollectibles: levelData.totalCollectibles || 10,
            totalSecrets: levelData.totalSecrets || 3,
            damageTaken: levelData.damageTaken || 0
        };
        
        // Extract DNA
        const dna = this.extractDNA(runData);
        
        // Emit extraction complete
        EventBus.emit(EventNames.CLONE_DNA_EXTRACTED, { dna, runData });
        EventBus.emit(EventNames.RUN_STATISTICS_COMPLETE, runData);
        
        // Reset for next run
        this.resetMetrics();
        
        return dna;
    }
    
    /**
     * Extract DNA from run metrics
     */
    extractDNA(runData) {
        const dna = {
            stats: {
                speed: this.calculateSpeedStat(runData),
                combat: this.calculateCombatStat(runData),
                height: this.calculateHeightStat(runData),
                resource: this.calculateResourceStat(runData),
                buff: this.calculateBuffStat(runData)
            },
            traits: this.extractTraits(runData),
            decisions: this.extractDecisions(runData),
            signature: this.generateSignature(runData)
        };
        
        return dna;
    }
    
    /**
     * Calculate Speed stat (0-10)
     */
    calculateSpeedStat(runData) {
        let score = 5; // Base score
        
        // Time performance
        const timeRatio = this.baselines.expectedTime / runData.completionTime;
        score += (timeRatio - 1) * 3; // ±3 points for time
        
        // Velocity performance
        const velocityRatio = runData.averageVelocity / this.baselines.expectedSpeed;
        score += (velocityRatio - 1) * 2; // ±2 points for speed
        
        // Dash mastery
        const dashBonus = (runData.perfectDashes / Math.max(1, runData.dashesUsed)) * 2;
        score += dashBonus;
        
        // Max velocity achievement
        if (runData.maxVelocity > this.baselines.expectedSpeed * 2) {
            score += 1;
        }
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * Calculate Combat stat (0-10)
     */
    calculateCombatStat(runData) {
        let score = 5;
        
        // Kill rate
        const killRate = runData.enemiesDefeated / Math.max(1, runData.totalEnemies);
        score += (killRate - this.baselines.expectedKills) * 5;
        
        // Damage efficiency
        if (runData.damageTaken > 0) {
            const damageRatio = runData.damageDealt / runData.damageTaken;
            score += Math.min(2, damageRatio / 10);
        } else {
            score += 2; // No damage taken bonus
        }
        
        // Combat mastery
        const critRate = runData.criticalHits / Math.max(1, runData.enemiesDefeated);
        score += critRate * 2;
        
        // Combo performance
        if (runData.maxCombo > 10) {
            score += 1;
        }
        
        // Boss performance
        score += runData.bossesDefeated * 0.5;
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * Calculate Height stat (0-10)
     */
    calculateHeightStat(runData) {
        let score = 5;
        
        // Jump success rate
        const jumpSuccess = runData.successfulJumps / Math.max(1, runData.totalJumps);
        score += (jumpSuccess - 0.8) * 5;
        
        // Max jump achievement
        const heightRatio = runData.maxJumpHeight / this.baselines.expectedJumpHeight;
        score += (heightRatio - 1) * 2;
        
        // Air time mastery
        const airTimeRatio = runData.totalAirTime / runData.completionTime;
        score += airTimeRatio * 5;
        
        // Wall jump usage
        if (runData.wallJumps > 5) {
            score += Math.min(2, runData.wallJumps / 10);
        }
        
        // Aerial combat
        const aerialRate = runData.aerialKills / Math.max(1, runData.enemiesDefeated);
        score += aerialRate * 2;
        
        // Perfect landings
        score += Math.min(1, runData.perfectLandings / 10);
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * Calculate Resource stat (0-10)
     */
    calculateResourceStat(runData) {
        let score = 5;
        
        // Collection rate
        const collectRate = runData.collectiblesFound / Math.max(1, runData.totalCollectibles);
        score += (collectRate - this.baselines.expectedCollection) * 5;
        
        // Secret finding
        const secretRate = runData.secretsFound / Math.max(1, runData.totalSecrets);
        score += secretRate * 3;
        
        // Exploration
        score += Math.min(2, runData.explorationScore / 100);
        
        // Completionist bonus
        if (collectRate === 1.0 && secretRate === 1.0) {
            score += 1;
        }
        
        // Bonus objectives
        score += Math.min(1, runData.bonusObjectives / 5);
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * Calculate Buff stat (0-10)
     */
    calculateBuffStat(runData) {
        let score = 5;
        
        // Power-up efficiency
        const useRate = runData.powerUpsUsed / Math.max(1, runData.powerUpsCollected);
        score += useRate * 2;
        
        // Buff uptime
        const buffUptime = runData.totalBuffTime / runData.completionTime;
        score += (buffUptime - this.baselines.expectedBuffUptime) * 5;
        
        // Buff stacking
        if (runData.maxBuffStack > 3) {
            score += Math.min(2, runData.maxBuffStack / 5);
        }
        
        // Buff combos
        score += Math.min(2, runData.buffCombos / 3);
        
        // Perfect timing
        score += Math.min(1, runData.perfectBuffTiming / 5);
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * Extract personality traits from performance
     */
    extractTraits(runData) {
        const traits = [];
        
        // Speed traits
        if (runData.completionTime < this.baselines.expectedTime * 0.8) {
            traits.push('speedrunner');
        }
        if (runData.dashesUsed > 10 && runData.perfectDashes / runData.dashesUsed > 0.5) {
            traits.push('dash_master');
        }
        if (runData.maxVelocity > this.baselines.expectedSpeed * 2.5) {
            traits.push('speed_demon');
        }
        
        // Combat traits
        if (runData.enemiesDefeated === runData.totalEnemies) {
            traits.push('exterminator');
        }
        if (runData.damageTaken === 0) {
            traits.push('untouchable');
        }
        if (runData.maxCombo > 20) {
            traits.push('combo_king');
        }
        if (runData.criticalHits > runData.enemiesDefeated * 0.3) {
            traits.push('critical_striker');
        }
        
        // Height traits
        if (runData.wallJumps > 10) {
            traits.push('wall_runner');
        }
        if (runData.totalAirTime > runData.completionTime * 0.3) {
            traits.push('air_walker');
        }
        if (runData.aerialKills > runData.enemiesDefeated * 0.3) {
            traits.push('sky_warrior');
        }
        
        // Resource traits
        if (runData.collectiblesFound === runData.totalCollectibles) {
            traits.push('completionist');
        }
        if (runData.secretsFound === runData.totalSecrets) {
            traits.push('secret_hunter');
        }
        if (runData.explorationScore > 200) {
            traits.push('explorer');
        }
        
        // Buff traits
        if (runData.totalBuffTime > runData.completionTime * 0.5) {
            traits.push('buff_addict');
        }
        if (runData.maxBuffStack > 5) {
            traits.push('stack_master');
        }
        if (runData.buffCombos > 5) {
            traits.push('synergist');
        }
        
        // Meta traits
        if (runData.deathCount === 0) {
            traits.push('deathless');
        }
        if (runData.perfectSections > 3) {
            traits.push('perfectionist');
        }
        if (runData.stylePoints > 500) {
            traits.push('stylish');
        }
        
        return traits;
    }
    
    /**
     * Extract decision patterns from run
     */
    extractDecisions(runData) {
        const decisions = [];
        
        // Movement decisions
        if (runData.dashesUsed > runData.totalJumps) {
            decisions.push({ type: 'movement', context: 'prefer_dash' });
        } else {
            decisions.push({ type: 'movement', context: 'prefer_jump' });
        }
        
        // Combat decisions
        if (runData.damageDealt / runData.enemiesDefeated > 50) {
            decisions.push({ type: 'combat', context: 'heavy_hitter' });
        }
        if (runData.aerialKills > runData.enemiesDefeated * 0.2) {
            decisions.push({ type: 'combat', context: 'aerial_combat' });
        }
        
        // Collection decisions
        if (runData.secretsFound > 0) {
            decisions.push({ type: 'exploration', context: 'secret_seeker' });
        }
        if (runData.collectiblesFound > runData.totalCollectibles * 0.9) {
            decisions.push({ type: 'collection', context: 'thorough' });
        }
        
        // Risk decisions
        if (runData.damageTaken === 0) {
            decisions.push({ type: 'risk', context: 'cautious' });
        } else if (runData.damageTaken > 100) {
            decisions.push({ type: 'risk', context: 'aggressive' });
        }
        
        return decisions;
    }
    
    /**
     * Generate unique signature for the run
     */
    generateSignature(runData) {
        // Create a unique signature based on key performance indicators
        const signature = {
            playStyle: this.determinePlayStyle(runData),
            expertise: this.calculateExpertise(runData),
            uniquePattern: this.generatePattern(runData)
        };
        
        return signature;
    }
    
    /**
     * Determine overall play style
     */
    determinePlayStyle(runData) {
        const styles = [];
        
        // Check dominant stat
        const stats = {
            speed: this.calculateSpeedStat(runData),
            combat: this.calculateCombatStat(runData),
            height: this.calculateHeightStat(runData),
            resource: this.calculateResourceStat(runData),
            buff: this.calculateBuffStat(runData)
        };
        
        const maxStat = Math.max(...Object.values(stats));
        for (const [stat, value] of Object.entries(stats)) {
            if (value === maxStat) {
                styles.push(stat + '_focused');
                break;
            }
        }
        
        // Check for balanced play
        const variance = Math.max(...Object.values(stats)) - Math.min(...Object.values(stats));
        if (variance < 3) {
            styles.push('balanced');
        }
        
        return styles;
    }
    
    /**
     * Calculate expertise level
     */
    calculateExpertise(runData) {
        let expertise = 0;
        
        // Perfect metrics
        if (runData.damageTaken === 0) expertise += 20;
        if (runData.collectiblesFound === runData.totalCollectibles) expertise += 10;
        if (runData.secretsFound === runData.totalSecrets) expertise += 15;
        if (runData.perfectDashes > 5) expertise += 10;
        if (runData.perfectLandings > 5) expertise += 10;
        
        // Advanced techniques
        if (runData.wallJumps > 10) expertise += 10;
        if (runData.maxCombo > 20) expertise += 15;
        if (runData.buffCombos > 3) expertise += 10;
        
        return Math.min(100, expertise);
    }
    
    /**
     * Generate unique pattern identifier
     */
    generatePattern(runData) {
        // Create a pattern based on key behaviors
        const pattern = [];
        
        // Movement pattern
        pattern.push(runData.dashesUsed > runData.totalJumps ? 'D' : 'J');
        
        // Combat pattern
        pattern.push(runData.enemiesDefeated === runData.totalEnemies ? 'K' : 'S');
        
        // Collection pattern
        pattern.push(runData.collectiblesFound === runData.totalCollectibles ? 'C' : 'P');
        
        // Risk pattern
        pattern.push(runData.damageTaken === 0 ? 'U' : 'R');
        
        // Time pattern
        pattern.push(runData.completionTime < this.baselines.expectedTime ? 'F' : 'N');
        
        return pattern.join('');
    }
    
    /**
     * Reset metrics for new run
     */
    resetMetrics() {
        this.currentRunMetrics = {
            startTime: Date.now(),
            totalDistance: 0,
            maxVelocity: 0,
            averageVelocity: 0,
            velocitySamples: [],
            dashesUsed: 0,
            perfectDashes: 0,
            enemiesEncountered: 0,
            enemiesDefeated: 0,
            damageDealt: 0,
            damageTaken: 0,
            criticalHits: 0,
            comboDamage: 0,
            maxCombo: 0,
            totalJumps: 0,
            successfulJumps: 0,
            maxJumpHeight: 0,
            totalAirTime: 0,
            wallJumps: 0,
            perfectLandings: 0,
            aerialKills: 0,
            collectiblesFound: 0,
            totalCollectibles: 0,
            secretsFound: 0,
            totalSecrets: 0,
            bonusObjectives: 0,
            explorationScore: 0,
            powerUpsCollected: 0,
            powerUpsUsed: 0,
            totalBuffTime: 0,
            maxBuffStack: 0,
            buffCombos: 0,
            perfectBuffTiming: 0,
            deathCount: 0,
            checkpointsReached: 0,
            bossesDefeated: 0,
            perfectSections: 0,
            stylePoints: 0
        };
    }
    
    /**
     * Start tracking a new run
     */
    startRun() {
        this.resetMetrics();
        this.currentRunMetrics.startTime = Date.now();
    }
    
    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        return { ...this.currentRunMetrics };
    }
}