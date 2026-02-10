// Barrel export for Core system managers - now located in src/core/

export { AgentOrchestrator } from '../../core/AgentOrchestrator.js';
export { AudioManager } from '../../core/AudioManager.js';
export { AudioUnlockManager } from '../../core/AudioUnlockManager.js';
export { createAudioUnlockOverlay, removeAudioUnlockOverlay } from '../../core/AudioUnlockUI.js';
export { BaseManager } from '../../core/BaseManager.js';
export { BaseScene } from '../../core/BaseScene.js';
export { CloneManager } from '../../core/CloneManager.js';
export { DeterministicRNG, getRNG } from '../../core/DeterministicRNG.js';
export { EconomyManager } from '../../core/EconomyManager.js';
export { EventBus } from '../../core/EventBus.js';
export { EventSystem } from '../../core/EventSystem.js';
export { GameStateManager } from '../../core/GameStateManager.js';
export { GoldenSeedTester } from '../../core/GoldenSeedTester.js';
export { InputManager } from '../../core/InputManager.js';
export { LoadingScreenManager } from '../../core/LoadingScreenManager.js';
export { PerformanceMonitor } from '../../core/PerformanceMonitor.js';
export { PhysicsManager } from '../../core/PhysicsManager.js';
export { UIManager } from '../../core/UIManager.js';

// Physics types and helpers (Rapier abstractions)
export {
    // Type exports
    World,
    RigidBodyType,
    RigidBodyDesc,
    RigidBody,
    RigidBodyHandle,
    ColliderDesc,
    Vector2,
    Ray,
    QueryFilterFlags,
    ActiveEvents,
    KinematicCharacterController,
    CharacterCollision,
    // Helper functions
    createDynamicBody,
    createKinematicBody,
    createKinematicVelocityBody,
    createFixedBody,
    createBoxCollider,
    createCircleCollider,
    createCapsuleCollider,
    createCharacterController,
    createVector2,
    createRay,
    attachCollider,
    setCollisionGroups,
    setSensor,
    setFriction,
    setRestitution,
    setDensity,
} from '../../core/PhysicsTypes.js';

// Physics constants and configuration
export {
    PIXELS_PER_METER,
    METERS_PER_PIXEL,
    pixelsToMeters,
    metersToPixels,
} from '../../constants/PhysicsConstants.js';
export { PhysicsConfig } from '../../constants/PhysicsConfig.js';
