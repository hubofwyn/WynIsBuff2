import { BaseManager } from '@features/core';

/**
 * DeterministicRNG - Seedable random number generator with multiple streams
 * 
 * Uses a Linear Congruential Generator (LCG) for deterministic random numbers.
 * Supports multiple independent streams for different game systems.
 * 
 * Streams:
 * - main: General gameplay randomness
 * - level: Level generation and layouts
 * - ai: Enemy AI decisions
 * - particles: Visual effects randomness
 * - loot: Item drops and rewards
 */
export class DeterministicRNG extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.init();
  }

  init(seed = 1138) {
    // Master seed
    this.masterSeed = seed;
    
    // Individual streams with their own state
    this.streams = new Map();
    
    // LCG constants (from Numerical Recipes)
    this.a = 1664525;
    this.c = 1013904223;
    this.m = Math.pow(2, 32);
    
    // Initialize default streams
    this.createStream('main', seed);
    this.createStream('level', seed + 1);
    this.createStream('ai', seed + 2);
    this.createStream('particles', seed + 3);
    this.createStream('loot', seed + 4);
    
    this.setInitialized();
  }

  /**
   * Create a new stream with its own seed
   * @param {string} name - Name of the stream
   * @param {number} seed - Initial seed for the stream
   */
  createStream(name, seed) {
    this.streams.set(name, {
      seed: seed,
      state: seed,
      callCount: 0
    });
  }

  /**
   * Reset a stream to its initial state
   * @param {string} stream - Name of the stream to reset
   */
  resetStream(stream) {
    const s = this.streams.get(stream);
    if (s) {
      s.state = s.seed;
      s.callCount = 0;
    }
  }

  /**
   * Reset all streams to their initial states
   */
  resetAll() {
    for (const [name, stream] of this.streams) {
      stream.state = stream.seed;
      stream.callCount = 0;
    }
  }

  /**
   * Get the next random value from a stream (0-1)
   * @param {string} stream - Stream name
   * @returns {number} Random value between 0 and 1
   */
  next(stream = 'main') {
    const s = this.streams.get(stream);
    if (!s) {
      console.warn(`[DeterministicRNG] Stream '${stream}' not found, using 'main'`);
      return this.next('main');
    }
    
    // Linear Congruential Generator
    s.state = (this.a * s.state + this.c) % this.m;
    s.callCount++;
    
    // Return normalized value [0, 1)
    return s.state / this.m;
  }

  /**
   * Get a random float in range [min, max)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @param {string} stream - Stream name
   * @returns {number} Random float
   */
  range(min, max, stream = 'main') {
    return min + this.next(stream) * (max - min);
  }

  /**
   * Get a random integer in range [min, max]
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @param {string} stream - Stream name
   * @returns {number} Random integer
   */
  int(min, max, stream = 'main') {
    return Math.floor(this.range(min, max + 1, stream));
  }

  /**
   * Get a random boolean with optional probability
   * @param {number} probability - Probability of true (0-1)
   * @param {string} stream - Stream name
   * @returns {boolean} Random boolean
   */
  bool(probability = 0.5, stream = 'main') {
    return this.next(stream) < probability;
  }

  /**
   * Pick a random element from an array
   * @param {Array} array - Array to pick from
   * @param {string} stream - Stream name
   * @returns {*} Random element
   */
  pick(array, stream = 'main') {
    if (!array || array.length === 0) return null;
    return array[this.int(0, array.length - 1, stream)];
  }

  /**
   * Shuffle an array in place (Fisher-Yates)
   * @param {Array} array - Array to shuffle
   * @param {string} stream - Stream name
   * @returns {Array} The shuffled array
   */
  shuffle(array, stream = 'main') {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i, stream);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Get weighted random selection
   * @param {Array} items - Array of {value, weight} objects
   * @param {string} stream - Stream name
   * @returns {*} Selected value
   */
  weighted(items, stream = 'main') {
    if (!items || items.length === 0) return null;
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) return null;
    
    let random = this.range(0, totalWeight, stream);
    
    for (const item of items) {
      random -= item.weight || 0;
      if (random <= 0) {
        return item.value;
      }
    }
    
    return items[items.length - 1].value;
  }

  /**
   * Generate Gaussian/normal distribution using Box-Muller transform
   * @param {number} mean - Mean of the distribution
   * @param {number} stdDev - Standard deviation
   * @param {string} stream - Stream name
   * @returns {number} Random value from normal distribution
   */
  gaussian(mean = 0, stdDev = 1, stream = 'main') {
    // Box-Muller transform
    const u1 = this.next(stream);
    const u2 = this.next(stream);
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Get the current state of a stream (for saving)
   * @param {string} stream - Stream name
   * @returns {Object} Stream state
   */
  getStreamState(stream = 'main') {
    const s = this.streams.get(stream);
    return s ? { ...s } : null;
  }

  /**
   * Set the state of a stream (for loading)
   * @param {string} stream - Stream name
   * @param {Object} state - State to restore
   */
  setStreamState(stream, state) {
    if (state && this.streams.has(stream)) {
      this.streams.set(stream, { ...state });
    }
  }

  /**
   * Get serializable state of all streams
   * @returns {Object} All stream states
   */
  serialize() {
    const state = {
      masterSeed: this.masterSeed,
      streams: {}
    };
    
    for (const [name, stream] of this.streams) {
      state.streams[name] = { ...stream };
    }
    
    return state;
  }

  /**
   * Restore state from serialized data
   * @param {Object} state - Serialized state
   */
  deserialize(state) {
    if (!state) return;
    
    this.masterSeed = state.masterSeed || 1138;
    
    if (state.streams) {
      for (const [name, streamState] of Object.entries(state.streams)) {
        this.streams.set(name, { ...streamState });
      }
    }
  }

  /**
   * Generate a hash from current state (for verification)
   * @returns {number} Hash of current state
   */
  getStateHash() {
    let hash = this.masterSeed;
    
    for (const [name, stream] of this.streams) {
      hash = hash ^ stream.state;
      hash = hash ^ stream.callCount;
      // Rotate left
      hash = (hash << 1) | (hash >>> 31);
    }
    
    return hash >>> 0; // Convert to unsigned 32-bit
  }
}

// Export singleton getter for convenience
export function getRNG() {
  return DeterministicRNG.getInstance();
}