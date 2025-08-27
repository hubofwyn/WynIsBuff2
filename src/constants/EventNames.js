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
    SCENE_TRANSITION: 'scene:transition',
    
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
    BOSS_ATTACK_START: 'boss:attackStart',
    BOSS_HIT_PLAYER: 'boss:hitPlayer',
    BOSS_DAMAGED: 'boss:damaged',
    
    // Enhanced movement events
    PLAYER_STATE_CHANGE: 'player:stateChange',
    PLAYER_DASH: 'player:dash',
    PLAYER_DASH_END: 'player:dashEnd',
    PLAYER_JUMP_PHASE: 'player:jumpPhase',
    
    // Wall interaction events
    WALL_SLIDE_START: 'wall:slideStart',
    WALL_SLIDE_END: 'wall:slideEnd',
    WALL_JUMP: 'wall:jump',
    
    // Enhanced movement physics events
    PLAYER_FAST_FALL: 'player:fastFall',
    PLAYER_HIGH_MOMENTUM: 'player:highMomentum',
    PLAYER_MOMENTUM_CHANGE: 'player:momentumChange',
    PLAYER_WALL_CONTACT: 'player:wallContact',
    PLAYER_WALL_SLIDE_ACTIVE: 'player:wallSlideActive',
    
    // Precision timing events
    TIMING_INPUT_TRACKED: 'timing:inputTracked',
    TIMING_METRICS_UPDATE: 'timing:metricsUpdate',
    TIMING_ACTION_RECORDED: 'timing:actionRecorded',
    
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
    
    // Clone System events
    CLONE_FORGE_START: 'clone:forgeStart',
    CLONE_FORGE_COMPLETE: 'clone:forgeComplete',
    CLONE_DNA_EXTRACTED: 'clone:dnaExtracted',
    CLONE_MUTATION: 'clone:mutation',
    CLONE_DEPLOYED: 'clone:deployed',
    CLONE_RECALLED: 'clone:recalled',
    CLONE_LEVEL_UP: 'clone:levelUp',
    CLONE_WORK_COMPLETE: 'clone:workComplete',
    CLONE_SYNERGY_ACTIVATED: 'clone:synergyActivated',
    
    // Economy events
    RESOURCE_GAINED: 'economy:resourceGained',
    RESOURCE_SPENT: 'economy:resourceSpent',
    FLOW_STATE_CHANGED: 'economy:flowStateChanged',
    MULTIPLIER_UPDATED: 'economy:multiplierUpdated',
    RETROACTIVE_BUFF: 'economy:retroactiveBuff',
    
    // Time Echo events
    ECHO_RECORDING_START: 'echo:recordingStart',
    ECHO_RECORDING_STOP: 'echo:recordingStop',
    ECHO_DECISION_CAPTURED: 'echo:decisionCaptured',
    ECHO_PLAYBACK_START: 'echo:playbackStart',
    ECHO_PLAYBACK_COMPLETE: 'echo:playbackComplete',
    
    // Performance tracking events
    PERFORMANCE_METRIC_RECORDED: 'performance:metricRecorded',
    RUN_STATISTICS_COMPLETE: 'performance:runComplete',
    
    // Idle/Automation System Events (Additional)
    // Idle progression events
    IDLE_TICK: 'idle:tick',
    IDLE_PROGRESS: 'idle:progress',
    IDLE_REWARD: 'idle:reward',
    OFFLINE_PROGRESS_CALCULATED: 'idle:offlineProgressCalculated',
    
    // Upgrade system events
    UPGRADE_PURCHASED: 'upgrade:purchased',
    UPGRADE_UNLOCKED: 'upgrade:unlocked',
    UPGRADE_MAXED: 'upgrade:maxed',
    UPGRADE_AVAILABLE: 'upgrade:available',
    
    // Automation events
    AUTOMATION_STARTED: 'automation:started',
    AUTOMATION_STOPPED: 'automation:stopped',
    AUTOMATION_UPGRADED: 'automation:upgraded',
    AUTOMATION_TICK: 'automation:tick',
    
    // Additional Boss system events
    BOSS_SPAWNED: 'boss:spawned',
    BOSS_PHASE_CHANGE: 'boss:phaseChange',
    BOSS_REWARD_CLAIMED: 'boss:rewardClaimed',
    BOSS_TIMER_UPDATE: 'boss:timerUpdate',
    BOSS_HEALTH_UPDATE: 'boss:healthUpdate',
    
    // Combo system events
    COMBO_START: 'combo:start',
    COMBO_INCREASE: 'combo:increase',
    COMBO_BREAK: 'combo:break',
    COMBO_MILESTONE: 'combo:milestone',
    COMBO_MULTIPLIER_CHANGE: 'combo:multiplierChange',
    
    // Run system events - using past tense for consistency
    RUN_STARTED: 'run:started',
    RUN_ENDED: 'run:ended',
    RUN_PAUSED: 'run:paused',
    RUN_RESUMED: 'run:resumed',
    RUN_SCORE_UPDATE: 'run:scoreUpdate',
    RUN_DISTANCE_UPDATE: 'run:distanceUpdate',
    RUN_RESULT_CALCULATED: 'run:resultCalculated',
    
    // Movement unlock events
    MOVEMENT_UNLOCKED: 'movement:unlocked',
    
    // Reward system events
    REWARD_GRANTED: 'reward:granted',
    
    // Offline/Idle calculation events
    OFFLINE_CALCULATED: 'offline:calculated',
    IDLE_BOOST_APPLIED: 'idle:boostApplied', // Fixed to namespace:action format
    IDLE_DECAY_APPLIED: 'idle:decayApplied', // Fixed to namespace:action format
    
    // Factory/Production events
    FACTORY_UNLOCK: 'factory:unlock',
    FACTORY_UPGRADE: 'factory:upgrade',
    FACTORY_PRODUCE: 'factory:produce',
    FACTORY_COLLECT: 'factory:collect',
    PRODUCTION_COMPLETE: 'factory:productionComplete',
    PRODUCTION_BOOST_ACTIVE: 'factory:boostActive',
    
    // Achievement/Milestone events
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
    MILESTONE_REACHED: 'milestone:reached',
    STAT_TRACKED: 'achievement:statTracked',
    
    // Prestige system events
    PRESTIGE_AVAILABLE: 'prestige:available',
    PRESTIGE_ACTIVATED: 'prestige:activated',
    PRESTIGE_CURRENCY_GAINED: 'prestige:currencyGained',
    PRESTIGE_BONUS_APPLIED: 'prestige:bonusApplied',
    
    // Scene transition events for idle system
    HUB_ENTERED: 'scene:hubEntered',
    HUB_EXITED: 'scene:hubExited',
    FACTORY_ENTERED: 'scene:factoryEntered',
    FACTORY_EXITED: 'scene:factoryExited',
    RUN_SCENE_ENTERED: 'scene:runEntered',
    RESULTS_DISPLAYED: 'scene:resultsDisplayed',
    
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