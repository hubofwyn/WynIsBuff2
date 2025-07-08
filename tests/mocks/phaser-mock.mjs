/**
 * Mock implementation of Phaser for testing
 */

export class MockSprite {
    constructor(x, y, texture) {
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.depth = 0;
        this.visible = true;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.effects = [];
    }

    setDisplaySize(width, height) {
        this.displayWidth = width;
        this.displayHeight = height;
        return this;
    }

    setDepth(depth) {
        this.depth = depth;
        return this;
    }

    setVisible(visible) {
        this.visible = visible;
        return this;
    }

    setRotation(rotation) {
        this.rotation = rotation;
        return this;
    }

    setScale(x, y) {
        this.scaleX = x;
        this.scaleY = y ?? x;
        return this;
    }

    destroy() {
        this.destroyed = true;
    }

    preFX = {
        addGlow: (color, outerStrength, innerStrength) => {
            this.effects.push({ type: 'glow', color, outerStrength, innerStrength });
            return {};
        },
    };
}

export class MockRectangle extends MockSprite {
    constructor(x, y, width, height, color) {
        super(x, y, null);
        this.width = width;
        this.height = height;
        this.fillColor = color;
    }
}

export class MockScene {
    constructor() {
        this.textures = new MockTextureManager();
        this.add = new MockGameObjectFactory();
        this.input = new MockInput();
        this.tweens = new MockTweenManager();
        this.events = new MockEventEmitter();
        this.physics = new MockPhysics();
        this.cameras = new MockCameraManager();
    }
}

export class MockTextureManager {
    constructor() {
        this.textures = new Map();
    }

    exists(key) {
        return this.textures.has(key);
    }

    addTexture(key) {
        this.textures.set(key, true);
    }
}

export class MockGameObjectFactory {
    constructor() {
        this.objects = [];
    }

    sprite(x, y, texture) {
        const sprite = new MockSprite(x, y, texture);
        this.objects.push(sprite);
        return sprite;
    }

    rectangle(x, y, width, height, color) {
        const rect = new MockRectangle(x, y, width, height, color);
        this.objects.push(rect);
        return rect;
    }

    tween(config) {
        return new MockTween(config);
    }
}

export class MockInput {
    constructor() {
        this.keyboard = new MockKeyboard();
    }
}

export class MockKeyboard {
    constructor() {
        this.keys = new Map();
        this.events = new MockEventEmitter();
    }

    addKeys(keys) {
        const result = {};
        Object.keys(keys).forEach((key) => {
            const mockKey = new MockKey(keys[key]);
            this.keys.set(keys[key], mockKey);
            result[key] = mockKey;
        });
        return result;
    }

    on(event, callback) {
        this.events.on(event, callback);
    }
}

export class MockKey {
    constructor(keyCode) {
        this.keyCode = keyCode;
        this.isDown = false;
        this.isUp = true;
        this.timeDown = 0;
        this.timeUp = 0;
    }

    press() {
        this.isDown = true;
        this.isUp = false;
        this.timeDown = Date.now();
    }

    release() {
        this.isDown = false;
        this.isUp = true;
        this.timeUp = Date.now();
    }
}

export class MockTweenManager {
    constructor() {
        this.tweens = [];
    }

    add(config) {
        const tween = new MockTween(config);
        this.tweens.push(tween);
        return tween;
    }
}

export class MockTween {
    constructor(config) {
        this.config = config;
        this.isPlaying = false;
        this.isPaused = false;
    }

    play() {
        this.isPlaying = true;
        this.isPaused = false;
        return this;
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        return this;
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        return this;
    }
}

export class MockEventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => callback(...args));
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}

export class MockPhysics {
    constructor() {
        this.world = new MockPhysicsWorld();
    }
}

export class MockPhysicsWorld {
    constructor() {
        this.bodies = [];
    }

    enable(object) {
        object.body = new MockPhysicsBody();
        this.bodies.push(object.body);
    }
}

export class MockPhysicsBody {
    constructor() {
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.gravity = { x: 0, y: 0 };
    }

    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }
}

export class MockCameraManager {
    constructor() {
        this.main = new MockCamera();
    }
}

export class MockCamera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }

    shake(duration, intensity) {
        this.shakeEffect = { duration, intensity };
    }

    flash(duration, r, g, b) {
        this.flashEffect = { duration, r, g, b };
    }
}

// Create a mock Phaser namespace
const Phaser = {
    Scene: MockScene,
    GameObjects: {
        Sprite: MockSprite,
        Rectangle: MockRectangle,
    },
    Input: {
        Keyboard: {
            KeyCodes: {
                A: 65,
                D: 68,
                W: 87,
                LEFT: 37,
                RIGHT: 39,
                UP: 38,
                SPACE: 32,
            },
        },
    },
};

export default Phaser;
