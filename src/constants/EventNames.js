export const EventNames = {
    // Game state events
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    
    // Level events
    LEVEL_LOAD: 'level:load',
    LEVEL_LOADED: 'level:loaded',
    LEVEL_RESET: 'level:reset',
    LEVEL_COMPLETE: 'level:complete',
    LEVEL_TRANSITION_START: 'level:transitionStart',
    LEVEL_TRANSITION_COMPLETE: 'level:transitionComplete',
    COLLECTIBLE_COLLECTED: 'level:collectibleCollected',
    COLLECTIBLE_EFFECT: 'level:collectibleEffect',
    PLATFORM_MOVE: 'level:platformMove',
    
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
    
    // Input events
    MOVE_LEFT: 'input:moveLeft',
    MOVE_RIGHT: 'input:moveRight',
    MOVE_UP: 'input:moveUp',
    MOVE_DOWN: 'input:moveDown',
    JUMP: 'input:jump',
    PAUSE: 'input:pause',
    // Character selection
    SELECT_CHARACTER: 'ui:selectCharacter',
    // Helper function for custom events
    custom: (category, action) => `${category}:${action}`
};