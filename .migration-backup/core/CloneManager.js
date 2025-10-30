/**
 * CloneManager - Manages the forging, deployment, and evolution of player clones
 * 
 * Clones are autonomous workers created from player performance DNA that:
 * - Inherit traits from their source run (speed, combat, height, resource, buff stats)
 * - Evolve through mutations and breeding
 * - Generate resources while idle based on their traits
 * - Form synergies when deployed together
 * - Can be retroactively buffed when new milestones are reached
 */

import { BaseManager } from './BaseManager.js';
import { EventBus } from './EventBus.js';
import { EventNames } from '../constants/EventNames.js';

export class CloneManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        
        // Clone storage
        this.clones = new Map(); // id -> clone data
        this.deployedClones = new Set(); // Currently active clone IDs
        this.cloneGeneration = 0; // Track generations for evolution
        
        // Forging queue
        this.forgingQueue = [];
        this.currentForge = null;
        this.forgeTimeRemaining = 0;
        
        // Clone templates from runs
        this.runTemplates = new Map(); // runId -> DNA template
        
        // Synergy tracking
        this.activeSynergies = new Set();
        this.synergyMultipliers = new Map();
        
        // Performance metrics
        this.totalClonesForged = 0;
        this.totalMutations = 0;
        this.highestGeneration = 0;
        
        // Clone stat ranges and caps
        this.statCaps = {
            speed: 10,      // S - Movement and action speed
            combat: 10,     // C - Combat effectiveness
            height: 10,     // H - Jump and reach ability
            resource: 10,   // R - Resource generation rate
            buff: 10        // B - Buff strength and duration
        };
        
        // Mutation parameters
        this.mutationChance = 0.15; // 15% base chance per stat
        this.mutationStrength = 0.3; // ±30% variation on mutation
        this.evolutionBonus = 0.05; // 5% bonus per generation
        
        // Resource generation rates (per second while deployed)
        this.baseResourceRate = 1.0;
        this.flowStateMultiplier = 1.0; // Updated by flow state
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSavedClones();
        this.setInitialized();
    }
    
    setupEventListeners() {
        // Listen for run completion to extract DNA
        EventBus.on(EventNames.RUN_STATISTICS_COMPLETE, (data) => {
            this.extractDNAFromRun(data);
        });
        
        // Listen for flow state changes
        EventBus.on(EventNames.FLOW_STATE_CHANGED, (data) => {
            this.updateFlowStateMultiplier(data.multiplier);
        });
        
        // Listen for retroactive buff triggers
        EventBus.on(EventNames.LEVEL_COMPLETE, (data) => {
            this.checkRetroactiveBuff(data);
        });
    }
    
    /**
     * Forge a new clone from a DNA template with optional mutations
     * @param {Object} template - DNA template from a run or breeding
     * @param {Object} options - Forging options (mutations, instant, etc.)
     * @returns {Promise<Object>} - The forged clone
     */
    async forgeClone(template, options = {}) {
        const {
            allowMutations = true,
            instantForge = false,
            parentIds = [],
            generation = 0
        } = options;
        
        // Emit forge start event
        EventBus.emit(EventNames.CLONE_FORGE_START, { template, options });
        
        // Calculate forge time based on generation and stats
        const forgeTime = instantForge ? 0 : this.calculateForgeTime(template, generation);
        
        if (forgeTime > 0) {
            // Add to forge queue
            return new Promise((resolve) => {
                this.forgingQueue.push({
                    template,
                    options,
                    resolve,
                    timeRemaining: forgeTime
                });
                
                // Start forging if not already active
                if (!this.currentForge) {
                    this.processForgeQueue();
                }
            });
        }
        
        // Instant forge
        return this.completeForge(template, options);
    }
    
    /**
     * Complete the forging process and create the clone
     */
    completeForge(template, options) {
        const cloneId = this.generateCloneId();
        const { allowMutations, parentIds, generation } = options;
        
        // Apply mutations if allowed
        const dna = allowMutations ? this.applyMutations(template) : { ...template };
        
        // Apply generation bonuses
        const enhancedDNA = this.applyGenerationBonus(dna, generation);
        
        // Create clone object
        const clone = {
            id: cloneId,
            name: this.generateCloneName(enhancedDNA, generation),
            dna: enhancedDNA,
            generation,
            parentIds,
            level: 1,
            experience: 0,
            deployed: false,
            totalResourcesGenerated: 0,
            forgedAt: Date.now(),
            mutations: this.detectMutations(template, enhancedDNA),
            personality: this.generatePersonality(enhancedDNA),
            specialization: this.determineSpecialization(enhancedDNA)
        };
        
        // Store the clone
        this.clones.set(cloneId, clone);
        this.totalClonesForged++;
        this.highestGeneration = Math.max(this.highestGeneration, generation);
        
        // Emit completion event
        EventBus.emit(EventNames.CLONE_FORGE_COMPLETE, { clone });
        
        // Check for any synergies with existing clones
        this.checkPotentialSynergies(clone);
        
        return clone;
    }
    
    /**
     * Apply mutations to DNA based on mutation chance and strength
     */
    applyMutations(dna) {
        const mutatedDNA = { ...dna };
        const mutations = [];
        
        for (const stat in mutatedDNA.stats) {
            if (Math.random() < this.mutationChance) {
                const originalValue = mutatedDNA.stats[stat];
                const variation = (Math.random() - 0.5) * 2 * this.mutationStrength;
                const newValue = Math.max(0, Math.min(
                    this.statCaps[stat],
                    originalValue * (1 + variation)
                ));
                
                mutatedDNA.stats[stat] = newValue;
                mutations.push({
                    stat,
                    from: originalValue,
                    to: newValue,
                    delta: newValue - originalValue
                });
                
                this.totalMutations++;
            }
        }
        
        if (mutations.length > 0) {
            EventBus.emit(EventNames.CLONE_MUTATION, { mutations, dna: mutatedDNA });
        }
        
        return mutatedDNA;
    }
    
    /**
     * Apply generation bonus to stats
     */
    applyGenerationBonus(dna, generation) {
        const enhancedDNA = { ...dna };
        const bonus = 1 + (generation * this.evolutionBonus);
        
        for (const stat in enhancedDNA.stats) {
            enhancedDNA.stats[stat] = Math.min(
                this.statCaps[stat],
                enhancedDNA.stats[stat] * bonus
            );
        }
        
        return enhancedDNA;
    }
    
    /**
     * Deploy a clone to start generating resources
     */
    deployClone(cloneId) {
        const clone = this.clones.get(cloneId);
        if (!clone || clone.deployed) return false;
        
        clone.deployed = true;
        clone.deployedAt = Date.now();
        this.deployedClones.add(cloneId);
        
        // Start resource generation
        this.startResourceGeneration(clone);
        
        // Check for synergies with other deployed clones
        this.activateSynergies();
        
        EventBus.emit(EventNames.CLONE_DEPLOYED, { clone });
        return true;
    }
    
    /**
     * Recall a deployed clone
     */
    recallClone(cloneId) {
        const clone = this.clones.get(cloneId);
        if (!clone || !clone.deployed) return false;
        
        clone.deployed = false;
        clone.lastRecalledAt = Date.now();
        this.deployedClones.delete(cloneId);
        
        // Stop resource generation
        this.stopResourceGeneration(clone);
        
        // Recalculate synergies
        this.activateSynergies();
        
        EventBus.emit(EventNames.CLONE_RECALLED, { clone });
        return true;
    }
    
    /**
     * Breed two clones to create offspring
     */
    async breedClones(parentId1, parentId2) {
        const parent1 = this.clones.get(parentId1);
        const parent2 = this.clones.get(parentId2);
        
        if (!parent1 || !parent2) return null;
        
        // Combine DNA with crossover
        const offspringDNA = this.combineDNA(parent1.dna, parent2.dna);
        
        // Determine generation
        const generation = Math.max(parent1.generation, parent2.generation) + 1;
        
        // Forge the offspring
        return this.forgeClone(offspringDNA, {
            allowMutations: true,
            parentIds: [parentId1, parentId2],
            generation
        });
    }
    
    /**
     * Combine DNA from two parents using crossover
     */
    combineDNA(dna1, dna2) {
        const combined = {
            stats: {},
            traits: [],
            decisions: []
        };
        
        // Crossover stats - randomly choose from each parent
        for (const stat in dna1.stats) {
            if (Math.random() < 0.5) {
                combined.stats[stat] = dna1.stats[stat];
            } else {
                combined.stats[stat] = dna2.stats[stat];
            }
            
            // Small chance of averaging for hybrid vigor
            if (Math.random() < 0.2) {
                combined.stats[stat] = (dna1.stats[stat] + dna2.stats[stat]) / 2;
            }
        }
        
        // Combine traits
        combined.traits = [...new Set([...dna1.traits, ...dna2.traits])];
        
        // Merge decision patterns
        combined.decisions = this.mergeDecisionPatterns(dna1.decisions, dna2.decisions);
        
        return combined;
    }
    
    /**
     * Calculate resource generation for a deployed clone
     */
    calculateResourceGeneration(clone) {
        const { stats } = clone.dna;
        
        // Base rate modified by resource stat
        let rate = this.baseResourceRate * (1 + stats.resource / 10);
        
        // Apply specialization bonus
        if (clone.specialization === 'gatherer') {
            rate *= 1.25;
        }
        
        // Apply level bonus
        rate *= (1 + clone.level * 0.1);
        
        // Apply flow state multiplier
        rate *= this.flowStateMultiplier;
        
        // Apply synergy multipliers
        const synergyBonus = this.calculateSynergyBonus(clone);
        rate *= synergyBonus;
        
        return rate;
    }
    
    /**
     * Start generating resources for a deployed clone
     */
    startResourceGeneration(clone) {
        // Resource generation happens per frame/tick in the game loop
        clone.resourceTimer = setInterval(() => {
            if (!clone.deployed) {
                clearInterval(clone.resourceTimer);
                return;
            }
            
            const resourceAmount = this.calculateResourceGeneration(clone) / 60; // Per frame at 60fps
            clone.totalResourcesGenerated += resourceAmount;
            
            // Emit resource gained event
            EventBus.emit(EventNames.RESOURCE_GAINED, {
                amount: resourceAmount,
                source: 'clone',
                cloneId: clone.id
            });
            
            // Check for level up
            this.checkCloneLevelUp(clone);
            
        }, 1000 / 60); // 60 FPS tick rate
    }
    
    /**
     * Stop resource generation for a clone
     */
    stopResourceGeneration(clone) {
        if (clone.resourceTimer) {
            clearInterval(clone.resourceTimer);
            clone.resourceTimer = null;
        }
    }
    
    /**
     * Check and activate synergies between deployed clones
     */
    activateSynergies() {
        this.activeSynergies.clear();
        this.synergyMultipliers.clear();
        
        const deployed = Array.from(this.deployedClones).map(id => this.clones.get(id));
        
        // Check for type synergies
        const types = new Set(deployed.map(c => c.specialization));
        
        // Balanced team synergy - all 5 specializations
        if (types.size === 5) {
            this.activeSynergies.add('perfect_harmony');
            this.synergyMultipliers.set('perfect_harmony', 2.0);
        }
        
        // Speed squad - 3+ speed specialists
        const speedsters = deployed.filter(c => c.specialization === 'speedster');
        if (speedsters.length >= 3) {
            this.activeSynergies.add('speed_force');
            this.synergyMultipliers.set('speed_force', 1.5);
        }
        
        // Family synergy - clones with shared parents
        const familyGroups = this.findFamilyGroups(deployed);
        for (const family of familyGroups) {
            if (family.length >= 2) {
                const synergyId = `family_${family.join('_')}`;
                this.activeSynergies.add(synergyId);
                this.synergyMultipliers.set(synergyId, 1.2);
            }
        }
        
        // Generation synergy - mix of different generations
        const generations = new Set(deployed.map(c => c.generation));
        if (generations.size >= 3) {
            this.activeSynergies.add('evolutionary_cascade');
            this.synergyMultipliers.set('evolutionary_cascade', 1.3);
        }
        
        if (this.activeSynergies.size > 0) {
            EventBus.emit(EventNames.CLONE_SYNERGY_ACTIVATED, {
                synergies: Array.from(this.activeSynergies),
                multipliers: Object.fromEntries(this.synergyMultipliers)
            });
        }
    }
    
    /**
     * Calculate total synergy bonus for a clone
     */
    calculateSynergyBonus(clone) {
        let totalBonus = 1.0;
        
        for (const [synergy, multiplier] of this.synergyMultipliers) {
            // Apply synergy if clone qualifies
            if (this.cloneQualifiesForSynergy(clone, synergy)) {
                totalBonus *= multiplier;
            }
        }
        
        return totalBonus;
    }
    
    /**
     * Check if a clone qualifies for a specific synergy
     */
    cloneQualifiesForSynergy(clone, synergyId) {
        // Perfect harmony applies to all
        if (synergyId === 'perfect_harmony') return true;
        
        // Speed force for speedsters
        if (synergyId === 'speed_force' && clone.specialization === 'speedster') return true;
        
        // Family synergies
        if (synergyId.startsWith('family_')) {
            const familyMembers = synergyId.replace('family_', '').split('_');
            return familyMembers.includes(clone.id);
        }
        
        // Evolutionary cascade for all
        if (synergyId === 'evolutionary_cascade') return true;
        
        return false;
    }
    
    /**
     * Find family groups among deployed clones
     */
    findFamilyGroups(clones) {
        const families = [];
        const processed = new Set();
        
        for (const clone of clones) {
            if (processed.has(clone.id)) continue;
            
            const family = [clone.id];
            processed.add(clone.id);
            
            // Find siblings and descendants
            for (const other of clones) {
                if (processed.has(other.id)) continue;
                
                // Check if they share parents
                const sharedParents = clone.parentIds.filter(p => other.parentIds.includes(p));
                if (sharedParents.length > 0) {
                    family.push(other.id);
                    processed.add(other.id);
                }
            }
            
            if (family.length > 1) {
                families.push(family);
            }
        }
        
        return families;
    }
    
    /**
     * Apply retroactive buff to all existing clones
     */
    applyRetroactiveBuff(buffType, magnitude) {
        for (const [id, clone] of this.clones) {
            // Apply buff based on type
            switch (buffType) {
                case 'speed':
                    clone.dna.stats.speed = Math.min(
                        this.statCaps.speed,
                        clone.dna.stats.speed * (1 + magnitude)
                    );
                    break;
                case 'resource':
                    clone.dna.stats.resource = Math.min(
                        this.statCaps.resource,
                        clone.dna.stats.resource * (1 + magnitude)
                    );
                    break;
                case 'all':
                    for (const stat in clone.dna.stats) {
                        clone.dna.stats[stat] = Math.min(
                            this.statCaps[stat],
                            clone.dna.stats[stat] * (1 + magnitude)
                        );
                    }
                    break;
            }
        }
        
        EventBus.emit(EventNames.RETROACTIVE_BUFF, {
            type: buffType,
            magnitude,
            affectedClones: this.clones.size
        });
    }
    
    /**
     * Check if completing a level triggers retroactive buffs
     */
    checkRetroactiveBuff(levelData) {
        // First time beating a boss grants buff to all clones
        if (levelData.firstTime && levelData.bossDefeated) {
            this.applyRetroactiveBuff('all', 0.1); // 10% buff to all stats
        }
        
        // Speed run achievements
        if (levelData.time < levelData.parTime * 0.5) {
            this.applyRetroactiveBuff('speed', 0.15); // 15% speed buff
        }
        
        // No damage run
        if (levelData.damageTaken === 0) {
            this.applyRetroactiveBuff('combat', 0.2); // 20% combat buff
        }
    }
    
    /**
     * Extract DNA from a completed run
     */
    extractDNAFromRun(runData) {
        const dna = {
            stats: {
                speed: this.calculateSpeedStat(runData),
                combat: this.calculateCombatStat(runData),
                height: this.calculateHeightStat(runData),
                resource: this.calculateResourceStat(runData),
                buff: this.calculateBuffStat(runData)
            },
            traits: this.extractTraits(runData),
            decisions: runData.decisions || []
        };
        
        // Store as template
        this.runTemplates.set(runData.runId, dna);
        
        EventBus.emit(EventNames.CLONE_DNA_EXTRACTED, { dna, runId: runData.runId });
        
        return dna;
    }
    
    /**
     * Calculate individual stats from run data
     */
    calculateSpeedStat(runData) {
        const baseSpeed = 5; // Middle value
        const speedBonus = (runData.averageSpeed / runData.expectedSpeed) - 1;
        return Math.max(0, Math.min(10, baseSpeed + speedBonus * 10));
    }
    
    calculateCombatStat(runData) {
        const baseCombat = 5;
        const combatScore = (runData.enemiesDefeated / runData.totalEnemies) * 
                          (runData.damageDealt / Math.max(1, runData.damageTaken));
        return Math.max(0, Math.min(10, baseCombat + (combatScore - 1) * 5));
    }
    
    calculateHeightStat(runData) {
        const baseHeight = 5;
        const jumpScore = (runData.maxJumpHeight / runData.averageJumpHeight) * 
                         (runData.successfulJumps / runData.totalJumps);
        return Math.max(0, Math.min(10, baseHeight + (jumpScore - 1) * 5));
    }
    
    calculateResourceStat(runData) {
        const baseResource = 5;
        const collectScore = (runData.collectiblesGathered / runData.totalCollectibles) * 
                           (runData.secretsFound / Math.max(1, runData.totalSecrets));
        return Math.max(0, Math.min(10, baseResource + collectScore * 5));
    }
    
    calculateBuffStat(runData) {
        const baseBuff = 5;
        const buffScore = (runData.powerUpsUsed / runData.powerUpsCollected) * 
                        (runData.buffUptime / runData.totalTime);
        return Math.max(0, Math.min(10, baseBuff + buffScore * 5));
    }
    
    /**
     * Extract personality traits from run behavior
     */
    extractTraits(runData) {
        const traits = [];
        
        // Movement traits
        if (runData.averageSpeed > runData.expectedSpeed * 1.2) traits.push('speedrunner');
        if (runData.wallJumps > 10) traits.push('acrobat');
        if (runData.ducksPerformed > 20) traits.push('cautious');
        
        // Combat traits
        if (runData.enemiesDefeated === runData.totalEnemies) traits.push('completionist');
        if (runData.damageDealt > runData.expectedDamage * 1.5) traits.push('aggressive');
        if (runData.damageTaken === 0) traits.push('untouchable');
        
        // Collection traits
        if (runData.collectiblesGathered === runData.totalCollectibles) traits.push('collector');
        if (runData.secretsFound > 0) traits.push('explorer');
        
        return traits;
    }
    
    /**
     * Generate a unique personality based on DNA
     */
    generatePersonality(dna) {
        const personalities = {
            speedster: dna.stats.speed > 7,
            warrior: dna.stats.combat > 7,
            acrobat: dna.stats.height > 7,
            gatherer: dna.stats.resource > 7,
            supporter: dna.stats.buff > 7,
            balanced: Math.max(...Object.values(dna.stats)) <= 7
        };
        
        // Find dominant personality
        for (const [type, matches] of Object.entries(personalities)) {
            if (matches) return type;
        }
        
        return 'balanced';
    }
    
    /**
     * Determine clone specialization based on stats
     */
    determineSpecialization(dna) {
        const stats = dna.stats;
        const maxStat = Math.max(...Object.values(stats));
        
        for (const [stat, value] of Object.entries(stats)) {
            if (value === maxStat) {
                return this.getSpecializationForStat(stat);
            }
        }
        
        return 'generalist';
    }
    
    getSpecializationForStat(stat) {
        const specializations = {
            speed: 'speedster',
            combat: 'warrior',
            height: 'acrobat',
            resource: 'gatherer',
            buff: 'supporter'
        };
        return specializations[stat] || 'generalist';
    }
    
    /**
     * Generate a unique name for a clone
     */
    generateCloneName(dna, generation) {
        const prefixes = {
            speedster: ['Swift', 'Quick', 'Flash', 'Rapid'],
            warrior: ['Battle', 'War', 'Strike', 'Fierce'],
            acrobat: ['Sky', 'Leap', 'Jump', 'High'],
            gatherer: ['Harvest', 'Collect', 'Gather', 'Hoard'],
            supporter: ['Boost', 'Amp', 'Power', 'Enhance']
        };
        
        const spec = this.determineSpecialization(dna);
        const prefix = prefixes[spec]?.[Math.floor(Math.random() * 4)] || 'Clone';
        const suffix = generation > 0 ? ` G${generation}` : '';
        const id = Math.floor(Math.random() * 1000);
        
        return `${prefix}-${id}${suffix}`;
    }
    
    /**
     * Calculate forge time based on DNA complexity and generation
     */
    calculateForgeTime(template, generation) {
        const baseTime = 10000; // 10 seconds base
        const statComplexity = Object.values(template.stats).reduce((a, b) => a + b, 0) / 50;
        const generationPenalty = generation * 2000; // 2 seconds per generation
        
        return baseTime * statComplexity + generationPenalty;
    }
    
    /**
     * Process the forge queue
     */
    processForgeQueue() {
        if (this.forgingQueue.length === 0) {
            this.currentForge = null;
            return;
        }
        
        this.currentForge = this.forgingQueue.shift();
        
        // Simulate forging over time
        const forgeInterval = setInterval(() => {
            this.currentForge.timeRemaining -= 100;
            
            if (this.currentForge.timeRemaining <= 0) {
                clearInterval(forgeInterval);
                
                // Complete the forge
                const clone = this.completeForge(
                    this.currentForge.template,
                    this.currentForge.options
                );
                
                // Resolve the promise
                this.currentForge.resolve(clone);
                
                // Process next in queue
                this.processForgeQueue();
            }
        }, 100);
    }
    
    /**
     * Check if a clone should level up
     */
    checkCloneLevelUp(clone) {
        const xpNeeded = clone.level * 100;
        const xpGained = clone.totalResourcesGenerated / 10;
        
        if (xpGained >= xpNeeded) {
            clone.level++;
            clone.experience = 0;
            
            // Small stat boost on level up
            for (const stat in clone.dna.stats) {
                clone.dna.stats[stat] = Math.min(
                    this.statCaps[stat],
                    clone.dna.stats[stat] * 1.02
                );
            }
            
            EventBus.emit(EventNames.CLONE_LEVEL_UP, { clone });
        }
    }
    
    /**
     * Detect what mutations occurred between original and mutated DNA
     */
    detectMutations(original, mutated) {
        const mutations = [];
        
        for (const stat in original.stats) {
            if (Math.abs(original.stats[stat] - mutated.stats[stat]) > 0.01) {
                mutations.push({
                    stat,
                    change: mutated.stats[stat] - original.stats[stat]
                });
            }
        }
        
        return mutations;
    }
    
    /**
     * Merge decision patterns from two parents
     */
    mergeDecisionPatterns(decisions1, decisions2) {
        // Take most common decisions from both parents
        const allDecisions = [...decisions1, ...decisions2];
        const decisionCounts = {};
        
        for (const decision of allDecisions) {
            const key = `${decision.type}_${decision.context}`;
            decisionCounts[key] = (decisionCounts[key] || 0) + 1;
        }
        
        // Return most frequent decisions
        return Object.entries(decisionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key]) => {
                const [type, context] = key.split('_');
                return { type, context };
            });
    }
    
    /**
     * Update flow state multiplier
     */
    updateFlowStateMultiplier(multiplier) {
        this.flowStateMultiplier = multiplier;
    }
    
    /**
     * Generate a unique clone ID
     */
    generateCloneId() {
        return `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Check for potential synergies when a new clone is forged
     */
    checkPotentialSynergies(newClone) {
        // This is called when forging to preview potential synergies
        // Actual synergies are activated when clones are deployed
    }
    
    /**
     * Load saved clones from storage
     */
    loadSavedClones() {
        // Load from localStorage or save system
        const saved = localStorage.getItem('wynisbuff_clones');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                for (const [id, clone] of Object.entries(data.clones || {})) {
                    this.clones.set(id, clone);
                }
                this.totalClonesForged = data.totalClonesForged || 0;
                this.highestGeneration = data.highestGeneration || 0;
            } catch (e) {
                console.error('Failed to load saved clones:', e);
            }
        }
    }
    
    /**
     * Save clones to storage
     */
    saveClones() {
        const data = {
            clones: Object.fromEntries(this.clones),
            totalClonesForged: this.totalClonesForged,
            highestGeneration: this.highestGeneration
        };
        localStorage.setItem('wynisbuff_clones', JSON.stringify(data));
    }
    
    /**
     * Get all clones
     */
    getAllClones() {
        return Array.from(this.clones.values());
    }
    
    /**
     * Get deployed clones
     */
    getDeployedClones() {
        return Array.from(this.deployedClones).map(id => this.clones.get(id));
    }
    
    /**
     * Get clone by ID
     */
    getClone(cloneId) {
        return this.clones.get(cloneId);
    }
    
    /**
     * Get active synergies
     */
    getActiveSynergies() {
        return {
            synergies: Array.from(this.activeSynergies),
            multipliers: Object.fromEntries(this.synergyMultipliers)
        };
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Stop all resource generation
        for (const clone of this.clones.values()) {
            this.stopResourceGeneration(clone);
        }
        
        // Clear all data
        this.clones.clear();
        this.deployedClones.clear();
        this.runTemplates.clear();
        this.activeSynergies.clear();
        this.synergyMultipliers.clear();
        
        super.destroy();
    }
}