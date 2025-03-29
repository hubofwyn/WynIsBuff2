export const EventNames = {
    // Game state events
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    LEVEL_COMPLETE: 'level:complete',
    
    // Player events
    PLAYER_SPAWN: 'player:spawn',
    PLAYER_JUMP: 'player:jump',
    PLAYER_LAND: 'player:land',
    PLAYER_MOVE: 'player:move',
    
    // Jump state events
    PLAYER_JUMP_START: 'player:jumpStart',
    PLAYER_JUMP_PEAK: 'player:jumpPeak',
    PLAYER_JUMP_FALL: 'player:jumpFall',
    PLAYER_LAND_IMPACT: 'player:landImpact',
    
    // Physics events
    COLLISION_START: 'physics:collisionStart',
    
    // UI events
    UI_UPDATE: 'ui:update',
    
    // Camera effect events
    CAMERA_SHAKE: 'camera:shake',
    
    // Particle effect events
    EMIT_PARTICLES: 'fx:emitParticles',
    
    // Audio events
    PLAY_SOUND: 'audio:playSound',
    
    // Helper function for custom events
    custom: (category, action) => `${category}:${action}`
};