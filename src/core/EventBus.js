/*
 * Core EventBus – a central event hub used across gameplay, UI and managers.
 * It tries to use Phaser's own EventEmitter when available (browser build),
 * and silently falls back to Node's `events` module when running in a pure
 * Node environment (unit-tests / CI).
 */

/* eslint-disable import/no-extraneous-dependencies */

// Determine the best available EventEmitter implementation.
let EventEmitterClass = null;

// Prefer Phaser's built-in event emitter when running in the browser with
// Phaser already loaded.
if (typeof window !== 'undefined' && window.Phaser && window.Phaser.Events && window.Phaser.Events.EventEmitter) {
  EventEmitterClass = window.Phaser.Events.EventEmitter;
}

// Fallback: a super-tiny emitter implemented locally so we avoid a `require`
// call that breaks when this file is treated as an ES module under Node.
if (!EventEmitterClass) {
  // Minimal dependency-free implementation (on/off/once/emit).
  class MiniEmitter {
    constructor() {
      this._events = new Map();
    }

    on(event, cb) {
      const list = this._events.get(event) || [];
      list.push(cb);
      this._events.set(event, list);
      return () => this.off(event, cb);
    }

    off(event, cb) {
      const list = this._events.get(event);
      if (!list) return;
      this._events.set(
        event,
        list.filter((fn) => fn !== cb),
      );
    }

    once(event, cb) {
      const wrap = (payload) => {
        this.off(event, wrap);
        cb(payload);
      };
      this.on(event, wrap);
      return wrap;
    }

    emit(event, payload) {
      const list = this._events.get(event);
      if (!list) return;
      // copy to avoid mutation during iteration
      [...list].forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          /* eslint-disable no-console */
          console.error(`[EventBus] listener for '${event}' threw`, e);
        }
      });
    }

    removeAllListeners() {
      this._events.clear();
    }
  }

  EventEmitterClass = MiniEmitter;
}

// Single, shared instance exported for the entire app.
export const EventBus = new EventEmitterClass();

// Add removeAllListeners method if not present (for compatibility)
if (!EventBus.removeAllListeners) {
  EventBus.removeAllListeners = function() {
    if (this._events && this._events.clear) {
      this._events.clear();
    } else if (this.removeAllListeners) {
      // Phaser's EventEmitter already has this method
      this.removeAllListeners();
    }
  };
}
