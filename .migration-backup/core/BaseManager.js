/*
 * BaseManager – simple lifecycle + singleton helper that other managers extend.
 *
 * Usage:
 *   class AudioManager extends BaseManager {
 *       constructor() {
 *           super(); // important – ensures the singleton guard is respected
 *           // custom initialisation …
 *       }
 *   }
 *   const audio = AudioManager.getInstance();
 */

export class BaseManager {
  constructor() {
    // Make sure subclasses call `super()` – capture the first created instance.
    const DerivedClass = this.constructor;

    if (DerivedClass._instance) {
      // eslint-disable-next-line no-constructor-return
      return DerivedClass._instance;
    }

    this._initialized = false;
    DerivedClass._instance = this; // cache singleton
  }

  /**
   * Shorthand to retrieve (or lazily create) the singleton of the subclass.
   *
   * @returns {this}
   */
  static getInstance() {
    // `this` refers to the derived class object.
    if (!this._instance) {
      // eslint-disable-next-line new-cap
      new this();
    }
    return this._instance;
  }

  /**
   * Whether `init` has been successfully called.
   * @returns {boolean}
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Mark this manager as initialized.
   */
  setInitialized() {
    this._initialized = true;
  }

  /**
   * Framework method – subclasses should perform their expensive set-up here
   * and set `this._initialized = true` when done.
   * Accepts arbitrary arguments so managers can receive a Phaser.Scene or
   * config objects.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  init(/* ...args */) {
    // To be implemented by subclass
    this._initialized = true;
  }

  /**
   * Tear-down resources.  Subclasses must override when they hold references
   * to textures, DOM elements, timers, etc.
   */
  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._initialized = false;
  }
}

