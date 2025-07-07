import { EventBus } from './EventBus.js';

/**
 * EventSystem provides a debug-enabled wrapper around EventBus
 * for game-wide event handling with consistent API.
 */
export class EventSystem {
    constructor() {
        this.eventBus = EventBus;
        this.debugMode = false;
    }
    
    on(event, callback) {
        return this.eventBus.on(event, callback);
    }
    
    off(event, callback) {
        this.eventBus.off(event, callback);
    }
    
    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventSystem] Event emitted: ${event}`, data);
        }
        this.eventBus.emit(event, data);
    }
    
    once(event, callback) {
        return this.eventBus.once(event, callback);
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}