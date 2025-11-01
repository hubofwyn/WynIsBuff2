import { BaseManager, EventBus } from '@features/core';

import { EventNames } from '../../constants/EventNames.js';

/**
 * PerformanceAnalyzer - Analyzes run performance and maps to clone statistics
 *
 * Performance Vector (S, C, H, R, B):
 * - S: Speed (time efficiency)
 * - C: Combo (skill chaining)
 * - H: Hits taken (survival)
 * - R: Rarity (collectibles found)
 * - B: Boss bonus (boss defeats)
 */
export class PerformanceAnalyzer extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        // Initialize event system
        this.eventSystem = EventBus.getInstance();

        // Performance weights for clone stat calculation
        this.performanceWeights = {
            speed: 0.12, // 12% boost per speed grade
            combo: 0.03, // 3% boost per combo grade
            hitless: 0.15, // 15% bonus for no hits
            rarity: 0.05, // 5% boost per rare collected
            boss: 1.0, // 100% of boss bonuses
        };

        // Base generation rates by route tier
        this.routeTierBases = {
            tutorial: 10,
            easy: 20,
            normal: 40,
            hard: 80,
            expert: 160,
            master: 320,
        };

        // Thresholds for performance grading
        this.thresholds = {
            speed: {
                S: 0.9, // Top 10% time
                A: 0.75, // Top 25% time
                B: 0.5, // Top 50% time
                C: 0.25, // Top 75% time
                D: 0, // Any completion
            },
            combo: {
                S: 0.8, // 80%+ possible combos
                A: 0.6, // 60%+ possible combos
                B: 0.4, // 40%+ possible combos
                C: 0.2, // 20%+ possible combos
                D: 0, // Any combos
            },
        };

        this.setInitialized();
    }

    /**
     * Analyze a completed run and generate performance metrics
     * @param {Object} runData - Complete run data from game
     * @returns {Object} Performance vector {S, C, H, R, B}
     */
    analyzeRun(runData) {
        const {
            time = 0,
            deaths = 0,
            maxCombo = 0,
            possibleCombo = 100,
            pickups = { coin: 0, grit: 0, relics: [] },
            bosses = {},
            parTime = 120,
        } = runData;

        // Calculate Speed score (0-1, where 1 is perfect time)
        const S = this.calculateSpeed(time, parTime);

        // Calculate Combo score (0-1, based on max combo achieved)
        const C = this.calculateCombo(maxCombo, possibleCombo);

        // Calculate Hit avoidance (0 for no deaths, negative for deaths)
        const H = this.calculateHitAvoidance(deaths);

        // Calculate Rarity score (number of rare items collected)
        const R = this.calculateRarity(pickups.relics || []);

        // Calculate Boss bonus (sum of all boss defeat bonuses)
        const B = this.calculateBossBonus(bosses);

        const performance = { S, C, H, R, B };

        // Emit performance metrics for tracking
        this.eventSystem.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
            runId: runData.runId,
            performance,
            time,
            deaths,
        });

        return performance;
    }

    /**
     * Calculate speed score based on completion time
     * @param {number} time - Actual completion time in seconds
     * @param {number} parTime - Expected/par time for the route
     * @returns {number} Speed score (0-1)
     */
    calculateSpeed(time, parTime) {
        if (time <= 0 || parTime <= 0) return 0;

        // Perfect time gets 1.0, 2x par time gets 0
        const ratio = time / parTime;

        if (ratio <= 0.5) return 1.0; // Exceptional (half par time)
        if (ratio <= 0.75) return 0.9; // S rank
        if (ratio <= 1.0) return 0.75; // A rank
        if (ratio <= 1.25) return 0.5; // B rank
        if (ratio <= 1.5) return 0.25; // C rank
        if (ratio <= 2.0) return 0.1; // D rank
        return 0; // Too slow
    }

    /**
     * Calculate combo score based on max combo achieved
     * @param {number} maxCombo - Maximum combo achieved
     * @param {number} possibleCombo - Maximum possible combo for the route
     * @returns {number} Combo score (0-1)
     */
    calculateCombo(maxCombo, possibleCombo) {
        if (possibleCombo <= 0) return 0;

        const ratio = maxCombo / possibleCombo;
        return Math.min(1.0, Math.max(0, ratio));
    }

    /**
     * Calculate hit avoidance score
     * @param {number} deaths - Number of deaths/hits taken
     * @returns {number} Hit score (0 for no hits, negative for hits)
     */
    calculateHitAvoidance(deaths) {
        // 0 deaths = 0 (will give hitless bonus)
        // Each death reduces score
        return deaths;
    }

    /**
     * Calculate rarity score based on collectibles found
     * @param {Array} relics - Array of relic IDs collected
     * @returns {number} Rarity score (count of rare items)
     */
    calculateRarity(relics) {
        if (!Array.isArray(relics)) return 0;

        // Each relic is worth 1 point
        // Could add rarity tiers later
        return relics.length;
    }

    /**
     * Calculate boss bonus from defeated bosses
     * @param {Object} bosses - Map of bossId to defeat status/score
     * @returns {number} Total boss bonus (0-1 per boss)
     */
    calculateBossBonus(bosses) {
        if (!bosses || typeof bosses !== 'object') return 0;

        let bonus = 0;
        for (const [_bossId, defeated] of Object.entries(bosses)) {
            if (defeated) {
                // Each boss gives 0.2 bonus (5 bosses = 1.0 total possible)
                bonus += 0.2;
            }
        }

        return bonus;
    }

    /**
     * Map performance vector to clone statistics
     * @param {Object} performance - Performance vector {S, C, H, R, B}
     * @param {string} routeTier - Difficulty tier of the route
     * @returns {Object} Clone stats {rate, stability, specialty}
     */
    mapToCloneStats(performance, routeTier = 'normal') {
        const { S, C, H, R, B } = performance;

        // Get base generation rate for route tier
        const base = this.routeTierBases[routeTier] || this.routeTierBases.normal;

        // Calculate production rate with performance modifiers
        const rate =
            base *
            (1 + this.performanceWeights.speed * S) * // Speed bonus
            (1 + this.performanceWeights.combo * C) * // Combo bonus
            (H === 0 ? 1 + this.performanceWeights.hitless : 1) * // Hitless bonus
            (1 + this.performanceWeights.rarity * R) * // Rarity bonus
            (1 + B); // Boss bonus (direct multiplier)

        // Calculate stability (how resistant to decay)
        // Better performance = higher stability
        const stability = Math.min(
            0.95,
            Math.max(
                0.5,
                0.6 + // Base stability
                    0.08 * S + // Speed improves stability
                    0.02 * C - // Combo slightly improves
                    0.05 * H // Deaths reduce stability
            )
        );

        // Determine specialty based on highest performance aspect
        const specialty = this.determineSpecialty(performance);

        return {
            rate: Math.round(rate * 100) / 100, // Round to 2 decimals
            stability: Math.round(stability * 100) / 100,
            specialty,
        };
    }

    /**
     * Determine clone specialty based on performance strengths
     * @param {Object} performance - Performance vector
     * @returns {string} Specialty type
     */
    determineSpecialty(performance) {
        const { S, C, H, R, B } = performance;

        // Find the strongest aspect
        const scores = {
            speedster: S,
            comboist: C,
            survivor: H === 0 ? 1 : 0,
            explorer: R,
            warrior: B,
        };

        // Get the highest scoring specialty
        let maxScore = 0;
        let specialty = 'balanced';

        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                specialty = type;
            }
        }

        // If no clear winner, it's balanced
        if (maxScore < 0.3) {
            specialty = 'balanced';
        }

        return specialty;
    }

    /**
     * Calculate performance grade for display
     * @param {Object} performance - Performance vector
     * @returns {string} Letter grade (S, A, B, C, D, F)
     */
    calculateGrade(performance) {
        const { S, C, H, R, B } = performance;

        // Normalize rarity score (assume max 5 relics for perfect score)
        const normalizedR = Math.min(1, R / 5);

        // Weight the scores
        const totalScore =
            S * 0.3 + // Speed is 30%
            C * 0.2 + // Combo is 20%
            (H === 0 ? 1 : 0.5) * 0.2 + // Hitless is 20%
            normalizedR * 0.2 + // Rarity is 20%
            B * 0.1; // Boss is 10%

        if (totalScore >= 0.9) return 'S';
        if (totalScore >= 0.8) return 'A';
        if (totalScore >= 0.65) return 'B';
        if (totalScore >= 0.5) return 'C';
        if (totalScore >= 0.3) return 'D';
        return 'F';
    }

    /**
     * Generate a detailed performance report
     * @param {Object} runData - Complete run data
     * @returns {Object} Detailed performance report
     */
    generateReport(runData) {
        const performance = this.analyzeRun(runData);
        const cloneStats = this.mapToCloneStats(performance, runData.routeTier);
        const grade = this.calculateGrade(performance);

        return {
            runId: runData.runId,
            timestamp: Date.now(),
            performance,
            cloneStats,
            grade,
            summary: {
                time: runData.time,
                deaths: runData.deaths,
                maxCombo: runData.maxCombo,
                relicsFound: runData.pickups?.relics?.length || 0,
                bossesDefeated: Object.values(runData.bosses || {}).filter((b) => b).length,
            },
        };
    }
}
