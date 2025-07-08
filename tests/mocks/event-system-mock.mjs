/**
 * Mock EventSystem for testing
 */
export class MockEventSystem {
    constructor() {
        this.events = new Map();
        this.emittedEvents = [];
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        // Track emitted events for testing
        this.emittedEvents.push({ event, data });

        if (this.events.has(event)) {
            this.events.get(event).forEach((callback) => callback(data));
        }
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    // Test helper methods
    getEmittedEvents(eventName) {
        return this.emittedEvents.filter((e) => e.event === eventName);
    }

    clearEmittedEvents() {
        this.emittedEvents = [];
    }

    hasListener(event) {
        return this.events.has(event) && this.events.get(event).length > 0;
    }
}
