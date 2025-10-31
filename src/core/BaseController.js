/*
 * BaseController – common skeleton for objects that wrap a single GameObject /
 * sprite and contain per-frame logic.  Not strictly required for Step 1 but
 * added for completeness so future controllers can extend it.
 */

export class BaseController {
    /**
     * @param {Phaser.Scene} scene – owning scene (may be `null` in tests)
     */
    constructor(scene) {
        if (new.target === BaseController) {
            throw new TypeError(
                'BaseController is an abstract class and cannot be instantiated directly'
            );
        }

        this.scene = scene;
        this.gameObject = null; // subclasses assign sprite / container / etc.
        this._destroyed = false;
    }

    create(/* ...args */) {
        throw new Error('create() must be implemented by subclass');
    }

    update(/* dt */) {}

    destroy() {
        this._destroyed = true;
        if (this.gameObject && typeof this.gameObject.destroy === 'function') {
            this.gameObject.destroy();
        }
    }

    isDestroyed() {
        return this._destroyed;
    }
}
