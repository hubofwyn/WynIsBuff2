/**
 * TimeEchoRecorder - Records and plays back player decisions for clone AI
 *
 * Creates "Time Echoes" - recordings of player inputs and decisions that:
 * - Capture the exact timing and context of player actions
 * - Record decision-making patterns in different situations
 * - Store successful strategies and combos
 * - Enable clones to replay and learn from player behavior
 * - Allow mutation and evolution of recorded patterns
 */

import { EventBus } from '../../core/EventBus.js';
import { EventNames } from '../../constants/EventNames.js';

export class TimeEchoRecorder {
    constructor() {
        // Current recording session
        this.currentRecording = null;
        this.isRecording = false;
        this.recordingStartTime = 0;

        // Stored echo library
        this.echoLibrary = new Map(); // echoId -> echo data

        // Playback state
        this.activePlaybacks = new Map(); // cloneId -> playback state

        // Decision patterns
        this.decisionPatterns = {
            combat: new Map(), // situation -> action patterns
            movement: new Map(), // context -> movement patterns
            collection: new Map(), // item type -> collection strategy
            evasion: new Map(), // threat -> evasion pattern
        };

        // Recording configuration
        this.config = {
            maxEchoLength: 300000, // 5 minutes max recording
            compressionLevel: 0.5, // How much to compress patterns
            mutationRate: 0.1, // Chance of mutation on playback
            learningRate: 0.05, // How much clones adapt patterns
            decisionWindow: 500, // ms window for decision grouping
            contextRadius: 100, // Distance to consider for context
        };

        // Statistics
        this.stats = {
            totalEchoes: 0,
            totalDecisions: 0,
            successfulPatterns: 0,
            mutatedPatterns: 0,
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Input recording
        EventBus.on(EventNames.MOVE_LEFT, (data) => this.recordInput('move_left', data));
        EventBus.on(EventNames.MOVE_RIGHT, (data) => this.recordInput('move_right', data));
        EventBus.on(EventNames.JUMP, (data) => this.recordInput('jump', data));
        EventBus.on(EventNames.PLAYER_DASH, (data) => this.recordInput('dash', data));
        EventBus.on(EventNames.PLAYER_DUCK, (data) => this.recordInput('duck', data));

        // Decision recording
        EventBus.on(EventNames.custom('decision', 'combat'), (data) => {
            this.recordDecision('combat', data);
        });

        EventBus.on(EventNames.custom('decision', 'route'), (data) => {
            this.recordDecision('route', data);
        });

        // Context recording
        EventBus.on(EventNames.COLLISION_START, (data) => {
            this.recordContext('collision', data);
        });

        EventBus.on(EventNames.custom('enemy', 'spotted'), (data) => {
            this.recordContext('enemy', data);
        });

        EventBus.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
            this.recordContext('collectible', data);
        });

        // Pattern success/failure
        EventBus.on(EventNames.custom('pattern', 'success'), (data) => {
            this.reinforcePattern(data);
        });

        EventBus.on(EventNames.custom('pattern', 'failure'), (data) => {
            this.weakenPattern(data);
        });
    }

    /**
     * Start recording a new echo
     */
    startRecording(metadata = {}) {
        if (this.isRecording) {
            this.stopRecording(); // Stop current recording
        }

        this.currentRecording = {
            id: this.generateEchoId(),
            metadata: {
                ...metadata,
                startTime: Date.now(),
                level: metadata.level || 'unknown',
                character: metadata.character || 'default',
            },
            timeline: [], // Chronological list of all events
            inputs: [], // Raw input sequence
            decisions: [], // High-level decisions
            contexts: [], // Environmental contexts
            patterns: [], // Recognized patterns
            keyframes: [], // Important moments for quick reference
            compressed: false,
        };

        this.isRecording = true;
        this.recordingStartTime = Date.now();

        EventBus.emit(EventNames.ECHO_RECORDING_START, {
            echoId: this.currentRecording.id,
        });

        return this.currentRecording.id;
    }

    /**
     * Stop recording and save the echo
     */
    stopRecording() {
        if (!this.isRecording || !this.currentRecording) return null;

        this.isRecording = false;

        // Finalize recording
        this.currentRecording.metadata.endTime = Date.now();
        this.currentRecording.metadata.duration =
            this.currentRecording.metadata.endTime - this.currentRecording.metadata.startTime;

        // Compress the recording
        this.compressRecording();

        // Extract patterns
        this.extractPatterns();

        // Store in library
        this.echoLibrary.set(this.currentRecording.id, this.currentRecording);
        this.stats.totalEchoes++;

        EventBus.emit(EventNames.ECHO_RECORDING_STOP, {
            echoId: this.currentRecording.id,
            duration: this.currentRecording.metadata.duration,
            eventCount: this.currentRecording.timeline.length,
        });

        const echoId = this.currentRecording.id;
        this.currentRecording = null;

        return echoId;
    }

    /**
     * Record an input event
     */
    recordInput(inputType, data) {
        if (!this.isRecording) return;

        const timestamp = Date.now() - this.recordingStartTime;

        const inputEvent = {
            type: 'input',
            inputType,
            timestamp,
            data: this.sanitizeData(data),
            context: this.getCurrentContext(),
        };

        this.currentRecording.timeline.push(inputEvent);
        this.currentRecording.inputs.push(inputEvent);

        // Check if this forms a pattern with recent inputs
        this.checkForPattern(inputEvent);
    }

    /**
     * Record a high-level decision
     */
    recordDecision(decisionType, data) {
        if (!this.isRecording) return;

        const timestamp = Date.now() - this.recordingStartTime;

        const decision = {
            type: 'decision',
            decisionType,
            timestamp,
            data: this.sanitizeData(data),
            context: this.getCurrentContext(),
            inputs: this.getRecentInputs(this.config.decisionWindow),
        };

        this.currentRecording.timeline.push(decision);
        this.currentRecording.decisions.push(decision);
        this.stats.totalDecisions++;

        // Mark as keyframe if important
        if (this.isKeyframeDecision(decision)) {
            this.currentRecording.keyframes.push({
                timestamp,
                type: 'decision',
                ref: decision,
            });
        }

        EventBus.emit(EventNames.ECHO_DECISION_CAPTURED, {
            decisionType,
            timestamp,
        });
    }

    /**
     * Record environmental context
     */
    recordContext(contextType, data) {
        if (!this.isRecording) return;

        const timestamp = Date.now() - this.recordingStartTime;

        const context = {
            type: 'context',
            contextType,
            timestamp,
            data: this.sanitizeData(data),
        };

        this.currentRecording.timeline.push(context);
        this.currentRecording.contexts.push(context);
    }

    /**
     * Check if recent inputs form a recognized pattern
     */
    checkForPattern(newInput) {
        const recentInputs = this.currentRecording.inputs.slice(-10);
        if (recentInputs.length < 3) return;

        // Look for common patterns
        const patterns = this.detectPatterns(recentInputs);

        for (const pattern of patterns) {
            if (!this.currentRecording.patterns.some((p) => p.signature === pattern.signature)) {
                this.currentRecording.patterns.push({
                    ...pattern,
                    timestamp: newInput.timestamp,
                    occurrences: 1,
                });
            } else {
                // Increment occurrence count
                const existing = this.currentRecording.patterns.find(
                    (p) => p.signature === pattern.signature
                );
                existing.occurrences++;
                existing.lastSeen = newInput.timestamp;
            }
        }
    }

    /**
     * Detect patterns in input sequence
     */
    detectPatterns(inputs) {
        const patterns = [];

        // Jump-dash combo
        if (this.matchesSequence(inputs, ['jump', 'dash'])) {
            patterns.push({
                name: 'jump_dash',
                signature: 'jd',
                inputs: ['jump', 'dash'],
                effectiveness: 0.8,
            });
        }

        // Wall jump sequence
        if (
            this.matchesSequence(inputs, ['jump', 'move_left', 'jump']) ||
            this.matchesSequence(inputs, ['jump', 'move_right', 'jump'])
        ) {
            patterns.push({
                name: 'wall_jump',
                signature: 'wj',
                inputs: ['jump', 'move', 'jump'],
                effectiveness: 0.9,
            });
        }

        // Duck-jump (super jump)
        if (this.matchesSequence(inputs, ['duck', 'jump'])) {
            patterns.push({
                name: 'super_jump',
                signature: 'sj',
                inputs: ['duck', 'jump'],
                effectiveness: 0.7,
            });
        }

        // Rapid movement (strafing)
        if (this.matchesAlternating(inputs, ['move_left', 'move_right'])) {
            patterns.push({
                name: 'strafe',
                signature: 'st',
                inputs: ['move_left', 'move_right'],
                effectiveness: 0.6,
            });
        }

        return patterns;
    }

    /**
     * Check if inputs match a sequence
     */
    matchesSequence(inputs, sequence) {
        if (inputs.length < sequence.length) return false;

        const recent = inputs.slice(-sequence.length);
        return sequence.every(
            (action, i) =>
                recent[i].inputType === action ||
                (action === 'move' &&
                    (recent[i].inputType === 'move_left' || recent[i].inputType === 'move_right'))
        );
    }

    /**
     * Check if inputs alternate between actions
     */
    matchesAlternating(inputs, actions) {
        if (inputs.length < 4) return false;

        const recent = inputs.slice(-4);
        return (
            recent[0].inputType === actions[0] &&
            recent[1].inputType === actions[1] &&
            recent[2].inputType === actions[0] &&
            recent[3].inputType === actions[1]
        );
    }

    /**
     * Compress the recording to save space
     */
    compressRecording() {
        if (!this.currentRecording || this.currentRecording.compressed) return;

        // Remove redundant move events (keep only changes)
        const compressedInputs = [];
        let lastInput = null;

        for (const input of this.currentRecording.inputs) {
            if (
                !lastInput ||
                input.inputType !== lastInput.inputType ||
                input.timestamp - lastInput.timestamp > 100
            ) {
                compressedInputs.push(input);
                lastInput = input;
            }
        }

        this.currentRecording.inputs = compressedInputs;

        // Compress timeline by removing non-essential events
        const essentialTypes = ['input', 'decision', 'keyframe'];
        this.currentRecording.timeline = this.currentRecording.timeline.filter(
            (event) =>
                essentialTypes.includes(event.type) ||
                (event.type === 'context' && event.contextType === 'collision')
        );

        this.currentRecording.compressed = true;
    }

    /**
     * Extract reusable patterns from the recording
     */
    extractPatterns() {
        if (!this.currentRecording) return;

        // Group decisions by context
        for (const decision of this.currentRecording.decisions) {
            const patternKey = `${decision.decisionType}_${decision.context.situation}`;

            if (!this.decisionPatterns[decision.decisionType]) {
                this.decisionPatterns[decision.decisionType] = new Map();
            }

            const pattern = {
                decision: decision.data,
                inputs: decision.inputs,
                timestamp: decision.timestamp,
                success: true, // Will be updated based on outcomes
            };

            if (!this.decisionPatterns[decision.decisionType].has(patternKey)) {
                this.decisionPatterns[decision.decisionType].set(patternKey, [pattern]);
            } else {
                this.decisionPatterns[decision.decisionType].get(patternKey).push(pattern);
            }
        }

        // Identify successful combo patterns
        const successfulPatterns = this.currentRecording.patterns.filter(
            (p) => p.occurrences > 2 && p.effectiveness > 0.7
        );

        for (const pattern of successfulPatterns) {
            this.stats.successfulPatterns++;
        }
    }

    /**
     * Start playing back an echo for a clone
     */
    startPlayback(echoId, cloneId, options = {}) {
        const echo = this.echoLibrary.get(echoId);
        if (!echo) return false;

        const playback = {
            echoId,
            cloneId,
            echo,
            currentIndex: 0,
            startTime: Date.now(),
            speed: options.speed || 1.0,
            loop: options.loop || false,
            mutate: options.mutate || false,
            adapt: options.adapt || false,
            paused: false,
        };

        this.activePlaybacks.set(cloneId, playback);

        EventBus.emit(EventNames.ECHO_PLAYBACK_START, {
            echoId,
            cloneId,
        });

        // Start playback loop
        this.processPlayback(cloneId);

        return true;
    }

    /**
     * Process playback for a clone
     */
    processPlayback(cloneId) {
        const playback = this.activePlaybacks.get(cloneId);
        if (!playback || playback.paused) return;

        const elapsed = (Date.now() - playback.startTime) * playback.speed;
        const echo = playback.echo;

        // Find events that should be played
        while (playback.currentIndex < echo.timeline.length) {
            const event = echo.timeline[playback.currentIndex];

            if (event.timestamp <= elapsed) {
                // Apply mutation if enabled
                const processedEvent = playback.mutate ? this.mutateEvent(event) : event;

                // Emit the event for the clone
                this.emitPlaybackEvent(processedEvent, cloneId);

                playback.currentIndex++;
            } else {
                break;
            }
        }

        // Check if playback is complete
        if (playback.currentIndex >= echo.timeline.length) {
            if (playback.loop) {
                // Reset for loop
                playback.currentIndex = 0;
                playback.startTime = Date.now();
            } else {
                // Complete playback
                this.stopPlayback(cloneId);
                return;
            }
        }

        // Continue playback
        setTimeout(() => this.processPlayback(cloneId), 16); // ~60fps
    }

    /**
     * Stop playback for a clone
     */
    stopPlayback(cloneId) {
        const playback = this.activePlaybacks.get(cloneId);
        if (!playback) return;

        this.activePlaybacks.delete(cloneId);

        EventBus.emit(EventNames.ECHO_PLAYBACK_COMPLETE, {
            echoId: playback.echoId,
            cloneId,
        });
    }

    /**
     * Mutate an event for variation
     */
    mutateEvent(event) {
        if (Math.random() > this.config.mutationRate) {
            return event; // No mutation
        }

        const mutated = { ...event };

        // Mutate based on event type
        switch (event.type) {
            case 'input':
                // Slight timing variation
                mutated.timestamp += (Math.random() - 0.5) * 100;

                // Chance to skip or double
                if (Math.random() < 0.1) {
                    mutated.skip = true;
                } else if (Math.random() < 0.05) {
                    mutated.double = true;
                }
                break;

            case 'decision':
                // Chance to choose alternative
                if (Math.random() < 0.2) {
                    mutated.data = this.getAlternativeDecision(event);
                }
                break;
        }

        this.stats.mutatedPatterns++;
        return mutated;
    }

    /**
     * Get alternative decision for mutation
     */
    getAlternativeDecision(event) {
        const alternatives = this.decisionPatterns[event.decisionType]?.get(
            `${event.decisionType}_${event.context.situation}`
        );

        if (alternatives && alternatives.length > 1) {
            // Choose a different decision
            const filtered = alternatives.filter((a) => a.decision !== event.data);
            if (filtered.length > 0) {
                return filtered[Math.floor(Math.random() * filtered.length)].decision;
            }
        }

        return event.data;
    }

    /**
     * Emit a playback event for a clone
     */
    emitPlaybackEvent(event, cloneId) {
        if (event.skip) return;

        const baseEvent = {
            source: 'echo',
            cloneId,
            timestamp: event.timestamp,
        };

        switch (event.type) {
            case 'input':
                // Emit clone input event
                EventBus.emit(EventNames.custom('clone', event.inputType), {
                    ...baseEvent,
                    ...event.data,
                });

                if (event.double) {
                    // Emit again for double
                    setTimeout(() => {
                        EventBus.emit(EventNames.custom('clone', event.inputType), {
                            ...baseEvent,
                            ...event.data,
                        });
                    }, 50);
                }
                break;

            case 'decision':
                // Emit clone decision event
                EventBus.emit(EventNames.custom('clone', 'decision'), {
                    ...baseEvent,
                    decisionType: event.decisionType,
                    decision: event.data,
                });
                break;
        }
    }

    /**
     * Reinforce a successful pattern
     */
    reinforcePattern(data) {
        const { patternType, context, success } = data;

        if (!this.decisionPatterns[patternType]) return;

        const patterns = this.decisionPatterns[patternType].get(context);
        if (patterns && patterns.length > 0) {
            // Increase effectiveness of recent pattern
            const recent = patterns[patterns.length - 1];
            if (recent) {
                recent.effectiveness = Math.min(
                    1.0,
                    (recent.effectiveness || 0.5) + this.config.learningRate
                );
            }
        }
    }

    /**
     * Weaken a failed pattern
     */
    weakenPattern(data) {
        const { patternType, context } = data;

        if (!this.decisionPatterns[patternType]) return;

        const patterns = this.decisionPatterns[patternType].get(context);
        if (patterns && patterns.length > 0) {
            // Decrease effectiveness of recent pattern
            const recent = patterns[patterns.length - 1];
            if (recent) {
                recent.effectiveness = Math.max(
                    0.0,
                    (recent.effectiveness || 0.5) - this.config.learningRate * 2
                );
            }
        }
    }

    /**
     * Get current context for decision making
     */
    getCurrentContext() {
        // This would normally query the game state
        // For now, return a simple context
        return {
            situation: 'normal',
            threats: 0,
            opportunities: 0,
            health: 100,
            position: { x: 0, y: 0 },
        };
    }

    /**
     * Get recent inputs within a time window
     */
    getRecentInputs(windowMs) {
        if (!this.currentRecording) return [];

        const currentTime = Date.now() - this.recordingStartTime;
        return this.currentRecording.inputs.filter(
            (input) => currentTime - input.timestamp <= windowMs
        );
    }

    /**
     * Check if a decision should be a keyframe
     */
    isKeyframeDecision(decision) {
        // Mark important decisions as keyframes
        const importantTypes = ['combat', 'boss', 'secret', 'powerup'];
        return importantTypes.includes(decision.decisionType);
    }

    /**
     * Sanitize data for storage
     */
    sanitizeData(data) {
        // Remove circular references and limit data size
        if (!data) return null;

        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                // Skip complex objects
                continue;
            }
            sanitized[key] = value;
        }

        return sanitized;
    }

    /**
     * Generate unique echo ID
     */
    generateEchoId() {
        return `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get echo by ID
     */
    getEcho(echoId) {
        return this.echoLibrary.get(echoId);
    }

    /**
     * Get all echoes
     */
    getAllEchoes() {
        return Array.from(this.echoLibrary.values());
    }

    /**
     * Get playback state for a clone
     */
    getPlaybackState(cloneId) {
        return this.activePlaybacks.get(cloneId);
    }

    /**
     * Pause/resume playback
     */
    togglePlayback(cloneId) {
        const playback = this.activePlaybacks.get(cloneId);
        if (playback) {
            playback.paused = !playback.paused;
            if (!playback.paused) {
                this.processPlayback(cloneId);
            }
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            totalEchoes: this.echoLibrary.size,
            activePlaybacks: this.activePlaybacks.size,
        };
    }
}
