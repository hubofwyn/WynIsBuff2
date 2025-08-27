// Barrel export for Core system managers - now located in src/core/

export { AudioManager } from '../../core/AudioManager.js';
export { EventBus } from '../../core/EventBus.js';
export { EventSystem } from '../../core/EventSystem.js';
export { GameStateManager } from '../../core/GameStateManager.js';
export { InputManager } from '../../core/InputManager.js';
export { PhysicsManager } from '../../core/PhysicsManager.js';
export { UIManager } from '../../core/UIManager.js';
export { PerformanceMonitor } from '../../core/PerformanceMonitor.js';
export { AgentOrchestrator } from '../../core/AgentOrchestrator.js';
export { CloneManager } from '../../core/CloneManager.js';
export { EconomyManager } from '../../core/EconomyManager.js';

// Physics constants and configuration
export { PIXELS_PER_METER, METERS_PER_PIXEL, pixelsToMeters, metersToPixels } from '../../constants/PhysicsConstants.js';
export { PhysicsConfig } from '../../constants/PhysicsConfig.js';