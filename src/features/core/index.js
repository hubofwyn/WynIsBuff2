// Barrel export for Core system managers - now located in src/core/

export { AudioManager } from '../../core/AudioManager.js';
export { EventSystem } from '../../core/EventSystem.js';
export { GameStateManager } from '../../core/GameStateManager.js';
export { InputManager } from '../../core/InputManager.js';
export { PhysicsManager } from '../../core/PhysicsManager.js';
export { UIManager } from '../../core/UIManager.js';

// Backward compatibility wrapper for LevelManager (delegates to the modular implementation)
export { LevelManager } from '../../modules/LevelManager.js';

// Note: PlayerController is NOT exported here - use @features/player instead
// The top-level PlayerController.js is a legacy monolithic implementation
// The preferred approach is the modular PlayerController in @features/player