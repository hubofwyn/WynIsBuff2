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
    PLAYER_EXPLODE: 'player:explode',
    PLAYER_DUCK: 'player:duck',
    
    // Jump state events
    PLAYER_JUMP_START: 'player:jumpStart',
    PLAYER_JUMP_PEAK: 'player:jumpPeak',
    PLAYER_JUMP_FALL: 'player:jumpFall',
    PLAYER_LAND_IMPACT: 'player:landImpact',
    
    // Physics events
    COLLISION_START: 'physics:collisionStart',
    
    // Boss events
    BOSS_JUMP: 'boss:jump',
    BOSS_LAND: 'boss:land',
    BOSS_DEFEATED: 'boss:defeated',
    
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

// Backwards compatibility adapter for deprecated event names
// Maps old event strings to new EventNames constants
export const DeprecatedEventNames = Object.freeze({
    // Legacy event names that might exist in older code
    'gameInit': EventNames.GAME_INIT,
    'gameStart': EventNames.GAME_START,
    'levelLoad': EventNames.LEVEL_LOAD,
    'levelComplete': EventNames.LEVEL_COMPLETE,
    'playerJump': EventNames.PLAYER_JUMP,
    'playerLand': EventNames.PLAYER_LAND,
    'collectibleCollected': EventNames.COLLECTIBLE_COLLECTED,
    
    // Helper function to get new event name from deprecated one
    get: (deprecatedName) => {
        const newName = DeprecatedEventNames[deprecatedName];
        if (newName && process.env.NODE_ENV !== 'production') {
            console.warn(`[EventNames] Deprecated event name "${deprecatedName}" used. Please use EventNames.${Object.keys(EventNames).find(key => EventNames[key] === newName)} instead.`);
        }
        return newName || deprecatedName;
    }
});