export class EventSystem {
    constructor() {
        this.events = new Map();
        this.debugMode = false;
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (!this.events.has(event)) return;
        const callbacks = this.events.get(event);
        this.events.set(event, callbacks.filter(cb => cb !== callback));
        if (this.events.get(event).length === 0) {
            this.events.delete(event);
        }
    }
    
    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventSystem] Event emitted: ${event}`, data);
        }
        if (!this.events.has(event)) return;
        this.events.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventSystem] Error in event handler for ${event}:`, error);
            }
        });
    }
    
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        return this.on(event, onceCallback);
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}