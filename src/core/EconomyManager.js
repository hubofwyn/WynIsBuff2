/**
 * EconomyManager - Manages resources, flow states, and economic progression
 *
 * Handles:
 * - Multiple resource types (Energy, Matter, Time Crystals)
 * - Flow state multipliers based on performance
 * - Resource exchange and conversion
 * - Upgrade purchasing and progression
 * - Prestige mechanics and meta-currencies
 */

import { EventNames } from '../constants/EventNames.js';
import { LOG } from '../observability/core/LogSystem.js';

import { BaseManager } from './BaseManager.js';
import { EventBus } from './EventBus.js';

export class EconomyManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;

        // Resource pools
        this.resources = {
            energy: 0, // Basic resource from clone work
            matter: 0, // Advanced resource from breeding
            timeCrystals: 0, // Premium resource from perfect runs
            flux: 0, // Meta-currency from prestige
            essence: 0, // Clone essence from recycling
        };

        // Resource caps (can be upgraded)
        this.resourceCaps = {
            energy: 1000,
            matter: 100,
            timeCrystals: 10,
            flux: 1000,
            essence: 500,
        };

        // Flow state tracking
        this.flowState = {
            level: 0, // Current flow level (0-10)
            multiplier: 1.0, // Current multiplier
            momentum: 0, // Build up to next level
            decay: 0.01, // How fast flow decays
            lastAction: 0, // Timestamp of last flow-building action
        };

        // Flow state thresholds and multipliers
        this.flowLevels = [
            { threshold: 0, multiplier: 1.0, name: 'Idle' },
            { threshold: 10, multiplier: 1.2, name: 'Active' },
            { threshold: 25, multiplier: 1.5, name: 'Focused' },
            { threshold: 50, multiplier: 2.0, name: 'In Flow' },
            { threshold: 100, multiplier: 3.0, name: 'Deep Flow' },
            { threshold: 200, multiplier: 5.0, name: 'Zen State' },
            { threshold: 400, multiplier: 8.0, name: 'Transcendent' },
            { threshold: 800, multiplier: 12.0, name: 'Omniscient' },
            { threshold: 1600, multiplier: 20.0, name: 'Godlike' },
            { threshold: 3200, multiplier: 50.0, name: 'Reality Bender' },
            { threshold: 6400, multiplier: 100.0, name: 'Infinity' },
        ];

        // Exchange rates
        this.exchangeRates = {
            energyToMatter: 100, // 100 energy = 1 matter
            matterToTimeCrystal: 50, // 50 matter = 1 time crystal
            essenceToEnergy: 10, // 1 essence = 10 energy
            fluxMultiplier: 0.01, // Flux adds 1% per point to all gains
        };

        // Upgrade tracks
        this.upgrades = {
            resourceCaps: {
                energy: { level: 0, cost: 100, multiplier: 2 },
                matter: { level: 0, cost: 50, multiplier: 2 },
                timeCrystals: { level: 0, cost: 10, multiplier: 2 },
            },
            flowDecay: { level: 0, cost: 200, reduction: 0.1 },
            exchangeRates: { level: 0, cost: 500, improvement: 0.9 },
            autoConvert: { level: 0, cost: 1000, unlocked: false },
        };

        // Statistics
        this.statistics = {
            totalEnergyGenerated: 0,
            totalMatterCreated: 0,
            totalTimeCrystalsForged: 0,
            highestFlowLevel: 0,
            longestFlowStreak: 0,
            totalPrestige: 0,
        };

        // Auto-conversion settings
        this.autoConvert = {
            enabled: false,
            energyThreshold: 0.8, // Convert at 80% cap
            matterThreshold: 0.8,
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedEconomy();
        this.startFlowDecay();
        this.setInitialized();
    }

    setupEventListeners() {
        // Resource generation from clones
        EventBus.on(EventNames.RESOURCE_GAINED, (data) => {
            this.gainResource(data.amount, data.source, data.resourceType);
        });

        // Flow state builders
        EventBus.on(EventNames.CLONE_FORGE_COMPLETE, () => {
            this.buildFlow(5, 'clone_forged');
        });

        EventBus.on(EventNames.CLONE_SYNERGY_ACTIVATED, (data) => {
            this.buildFlow(10 * data.synergies.length, 'synergy');
        });

        EventBus.on(EventNames.LEVEL_COMPLETE, (data) => {
            const flowGain = data.perfectRun ? 50 : 20;
            this.buildFlow(flowGain, 'level_complete');
        });

        EventBus.on(EventNames.BOSS_DEFEATED, () => {
            this.buildFlow(100, 'boss_defeated');
        });

        // Player actions build flow
        EventBus.on(EventNames.PLAYER_JUMP, () => {
            this.buildFlow(0.5, 'jump');
        });

        EventBus.on(EventNames.COLLECTIBLE_COLLECTED, () => {
            this.buildFlow(2, 'collect');
        });
    }

    /**
     * Gain resources with flow state multiplier
     */
    gainResource(amount, source = 'unknown', resourceType = 'energy') {
        // Apply flow state multiplier
        const multipliedAmount = amount * this.flowState.multiplier;

        // Apply flux bonus
        const fluxBonus = 1 + this.resources.flux * this.exchangeRates.fluxMultiplier;
        const finalAmount = multipliedAmount * fluxBonus;

        // Add to appropriate resource pool
        const previousAmount = this.resources[resourceType];
        this.resources[resourceType] = Math.min(
            this.resourceCaps[resourceType],
            this.resources[resourceType] + finalAmount
        );

        // Track statistics
        this.updateStatistics(resourceType, finalAmount);

        // Check for auto-conversion
        if (this.autoConvert.enabled) {
            this.checkAutoConversion();
        }

        // Emit update event
        EventBus.emit(EventNames.RESOURCE_GAINED, {
            type: resourceType,
            amount: finalAmount,
            newTotal: this.resources[resourceType],
            source,
            flowMultiplier: this.flowState.multiplier,
        });

        return this.resources[resourceType] - previousAmount;
    }

    /**
     * Spend resources
     */
    spendResource(amount, resourceType = 'energy') {
        if (this.resources[resourceType] < amount) {
            return false;
        }

        this.resources[resourceType] -= amount;

        EventBus.emit(EventNames.RESOURCE_SPENT, {
            type: resourceType,
            amount,
            newTotal: this.resources[resourceType],
        });

        return true;
    }

    /**
     * Check if player can afford something
     */
    canAfford(costs) {
        for (const [resource, amount] of Object.entries(costs)) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }

    /**
     * Pay multiple resource costs
     */
    payCosts(costs) {
        if (!this.canAfford(costs)) return false;

        for (const [resource, amount] of Object.entries(costs)) {
            this.spendResource(amount, resource);
        }

        return true;
    }

    /**
     * Build flow state momentum
     */
    buildFlow(amount, _source = 'unknown') {
        this.flowState.momentum += amount;
        this.flowState.lastAction = Date.now();

        // Check for level up
        const newLevel = this.calculateFlowLevel();
        if (newLevel !== this.flowState.level) {
            this.setFlowLevel(newLevel);
        }

        // Track highest flow
        this.statistics.highestFlowLevel = Math.max(
            this.statistics.highestFlowLevel,
            this.flowState.level
        );
    }

    /**
     * Calculate current flow level based on momentum
     */
    calculateFlowLevel() {
        for (let i = this.flowLevels.length - 1; i >= 0; i--) {
            if (this.flowState.momentum >= this.flowLevels[i].threshold) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Set flow level and update multiplier
     */
    setFlowLevel(level) {
        const previousLevel = this.flowState.level;
        this.flowState.level = level;
        this.flowState.multiplier = this.flowLevels[level].multiplier;

        EventBus.emit(EventNames.FLOW_STATE_CHANGED, {
            level,
            multiplier: this.flowState.multiplier,
            name: this.flowLevels[level].name,
            previousLevel,
            momentum: this.flowState.momentum,
        });
    }

    /**
     * Start flow state decay timer
     */
    startFlowDecay() {
        setInterval(() => {
            const timeSinceAction = Date.now() - this.flowState.lastAction;

            // Only decay after 2 seconds of inactivity
            if (timeSinceAction > 2000 && this.flowState.momentum > 0) {
                const decayAmount = this.flowState.momentum * this.getDecayRate();
                this.flowState.momentum = Math.max(0, this.flowState.momentum - decayAmount);

                // Update level if changed
                const newLevel = this.calculateFlowLevel();
                if (newLevel !== this.flowState.level) {
                    this.setFlowLevel(newLevel);
                }
            }
        }, 100); // Check every 100ms
    }

    /**
     * Get current decay rate (can be upgraded)
     */
    getDecayRate() {
        const baseDecay = this.flowState.decay;
        const upgradeReduction = this.upgrades.flowDecay.level * 0.002;
        return Math.max(0.001, baseDecay - upgradeReduction);
    }

    /**
     * Exchange resources at current rates
     */
    exchangeResources(fromType, toType, amount) {
        const rate = this.getExchangeRate(fromType, toType);
        if (!rate) return false;

        const cost = amount * rate;
        if (!this.spendResource(cost, fromType)) return false;

        this.gainResource(amount, 'exchange', toType);
        return true;
    }

    /**
     * Get exchange rate between two resource types
     */
    getExchangeRate(fromType, toType) {
        // Direct rates
        if (fromType === 'energy' && toType === 'matter') {
            return this.exchangeRates.energyToMatter * this.getExchangeModifier();
        }
        if (fromType === 'matter' && toType === 'timeCrystals') {
            return this.exchangeRates.matterToTimeCrystal * this.getExchangeModifier();
        }
        if (fromType === 'essence' && toType === 'energy') {
            return 1 / this.exchangeRates.essenceToEnergy; // Inverse for essence to energy
        }

        return null;
    }

    /**
     * Get exchange rate modifier from upgrades
     */
    getExchangeModifier() {
        const upgradeLevel = this.upgrades.exchangeRates.level;
        return Math.pow(0.9, upgradeLevel); // 10% better each level
    }

    /**
     * Check and perform auto-conversion if thresholds are met
     */
    checkAutoConversion() {
        if (!this.autoConvert.enabled) return;

        // Auto-convert energy to matter
        const energyPercent = this.resources.energy / this.resourceCaps.energy;
        if (energyPercent >= this.autoConvert.energyThreshold) {
            const convertAmount = Math.floor(
                this.resources.energy / this.exchangeRates.energyToMatter
            );
            if (convertAmount > 0) {
                this.exchangeResources('energy', 'matter', convertAmount);
            }
        }

        // Auto-convert matter to time crystals
        const matterPercent = this.resources.matter / this.resourceCaps.matter;
        if (matterPercent >= this.autoConvert.matterThreshold) {
            const convertAmount = Math.floor(
                this.resources.matter / this.exchangeRates.matterToTimeCrystal
            );
            if (convertAmount > 0) {
                this.exchangeResources('matter', 'timeCrystals', convertAmount);
            }
        }
    }

    /**
     * Purchase an upgrade
     */
    purchaseUpgrade(upgradeType, subType = null) {
        let upgrade;
        let cost;

        if (subType) {
            upgrade = this.upgrades[upgradeType][subType];
            cost = { energy: upgrade.cost * Math.pow(2, upgrade.level) };
        } else {
            upgrade = this.upgrades[upgradeType];
            cost = { energy: upgrade.cost * Math.pow(2, upgrade.level) };
        }

        if (!this.payCosts(cost)) return false;

        upgrade.level++;

        // Apply upgrade effects
        this.applyUpgrade(upgradeType, subType);

        return true;
    }

    /**
     * Apply upgrade effects
     */
    applyUpgrade(upgradeType, subType) {
        if (upgradeType === 'resourceCaps' && subType) {
            // Double resource cap
            this.resourceCaps[subType] *= 2;
        } else if (upgradeType === 'autoConvert') {
            // Unlock auto-conversion
            this.autoConvert.enabled = true;
            this.upgrades.autoConvert.unlocked = true;
        }

        EventBus.emit(EventNames.custom('economy', 'upgradeApplied'), {
            type: upgradeType,
            subType,
            newLevel: subType
                ? this.upgrades[upgradeType][subType].level
                : this.upgrades[upgradeType].level,
        });
    }

    /**
     * Prestige - reset progress for meta-currency
     */
    prestige() {
        // Calculate flux gain based on current progress
        const fluxGain = this.calculatePrestigeReward();

        // Reset resources but keep flux
        const previousFlux = this.resources.flux;
        this.resources = {
            energy: 0,
            matter: 0,
            timeCrystals: 0,
            flux: previousFlux + fluxGain,
            essence: 0,
        };

        // Reset flow state
        this.flowState = {
            level: 0,
            multiplier: 1.0,
            momentum: 0,
            decay: 0.01,
            lastAction: 0,
        };

        // Keep some upgrades, reset others
        this.softResetUpgrades();

        // Track prestige
        this.statistics.totalPrestige++;

        EventBus.emit(EventNames.custom('economy', 'prestige'), {
            fluxGained: fluxGain,
            totalFlux: this.resources.flux,
            prestigeCount: this.statistics.totalPrestige,
        });

        return fluxGain;
    }

    /**
     * Calculate prestige reward based on progress
     */
    calculatePrestigeReward() {
        let reward = 0;

        // Base reward from resources
        reward += this.resources.energy / 100;
        reward += this.resources.matter;
        reward += this.resources.timeCrystals * 10;

        // Bonus from statistics
        reward += this.statistics.highestFlowLevel * 5;
        reward += Math.sqrt(this.statistics.totalEnergyGenerated) / 100;

        // Minimum reward
        return Math.max(1, Math.floor(reward));
    }

    /**
     * Soft reset upgrades for prestige
     */
    softResetUpgrades() {
        // Reset resource cap upgrades but keep 10% of levels
        for (const resource in this.upgrades.resourceCaps) {
            const currentLevel = this.upgrades.resourceCaps[resource].level;
            this.upgrades.resourceCaps[resource].level = Math.floor(currentLevel * 0.1);
        }

        // Keep flow decay upgrades
        // Keep exchange rate upgrades at 50%
        this.upgrades.exchangeRates.level = Math.floor(this.upgrades.exchangeRates.level * 0.5);

        // Keep auto-convert if unlocked
    }

    /**
     * Recycle a clone for essence
     */
    recycleClone(cloneData) {
        // Calculate essence based on clone stats and level
        const statTotal = Object.values(cloneData.dna.stats).reduce((a, b) => a + b, 0);
        const essenceGain = Math.floor((statTotal * cloneData.level) / 10);

        this.gainResource(essenceGain, 'recycle', 'essence');

        return essenceGain;
    }

    /**
     * Update statistics
     */
    updateStatistics(resourceType, amount) {
        switch (resourceType) {
            case 'energy':
                this.statistics.totalEnergyGenerated += amount;
                break;
            case 'matter':
                this.statistics.totalMatterCreated += amount;
                break;
            case 'timeCrystals':
                this.statistics.totalTimeCrystalsForged += amount;
                break;
        }
    }

    /**
     * Get current economy state
     */
    getState() {
        return {
            resources: { ...this.resources },
            resourceCaps: { ...this.resourceCaps },
            flowState: { ...this.flowState },
            flowLevel: this.flowLevels[this.flowState.level],
            statistics: { ...this.statistics },
        };
    }

    /**
     * Get upgrade costs
     */
    getUpgradeCost(upgradeType, subType = null) {
        let upgrade;
        if (subType) {
            upgrade = this.upgrades[upgradeType][subType];
        } else {
            upgrade = this.upgrades[upgradeType];
        }

        return upgrade.cost * Math.pow(2, upgrade.level);
    }

    /**
     * Check if an upgrade is available
     */
    isUpgradeAvailable(upgradeType, subType = null) {
        const cost = this.getUpgradeCost(upgradeType, subType);
        return this.resources.energy >= cost;
    }

    /**
     * Load saved economy data
     */
    loadSavedEconomy() {
        const saved = localStorage.getItem('wynisbuff_economy');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.resources = { ...this.resources, ...data.resources };
                this.resourceCaps = { ...this.resourceCaps, ...data.resourceCaps };
                this.statistics = { ...this.statistics, ...data.statistics };
                this.upgrades = { ...this.upgrades, ...data.upgrades };
            } catch (e) {
                LOG.error('ECONOMYMANAGER_LOAD_FAILED', {
                    subsystem: 'economy',
                    message: 'Failed to load saved economy',
                    error: e,
                    errorMessage: e.message,
                });
            }
        }
    }

    /**
     * Save economy data
     */
    saveEconomy() {
        const data = {
            resources: this.resources,
            resourceCaps: this.resourceCaps,
            statistics: this.statistics,
            upgrades: this.upgrades,
        };
        localStorage.setItem('wynisbuff_economy', JSON.stringify(data));
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.saveEconomy();
        super.destroy();
    }
}
