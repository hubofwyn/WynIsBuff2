/**
 * Mock implementation of RAPIER physics for testing
 */

export class MockRigidBody {
    constructor(desc) {
        this.translation = desc.translation || { x: 0, y: 0 };
        this.rotation = desc.rotation || 0;
        this.linvel = { x: 0, y: 0 };
        this.angvel = 0;
        this.linearDamping = desc.linearDamping || 0;
        this.angularDamping = desc.angularDamping || 0;
        this.mass = 1;
        this.isEnabled = true;
        this.userData = {};
    }

    translation() {
        return this.translation;
    }

    setTranslation(vector) {
        this.translation = vector;
    }

    rotation() {
        return this.rotation;
    }

    setRotation(angle) {
        this.rotation = angle;
    }

    linvel() {
        return this.linvel;
    }

    setLinvel(vector) {
        this.linvel = vector;
    }

    angvel() {
        return this.angvel;
    }

    setAngvel(velocity) {
        this.angvel = velocity;
    }

    mass() {
        return this.mass;
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    userData() {
        return this.userData;
    }
}

export class MockCollider {
    constructor(shape) {
        this.shape = shape;
        this.friction = 0.5;
        this.restitution = 0;
        this.isSensor = false;
        this.userData = {};
    }

    setFriction(friction) {
        this.friction = friction;
    }

    setRestitution(restitution) {
        this.restitution = restitution;
    }

    setSensor(isSensor) {
        this.isSensor = isSensor;
    }

    shape() {
        return this.shape;
    }
}

export class MockWorld {
    constructor() {
        this.bodies = [];
        this.colliders = [];
        this.gravity = { x: 0, y: 9.81 };
        this.timestep = 1 / 60;
    }

    createRigidBody(desc) {
        const body = new MockRigidBody(desc);
        this.bodies.push(body);
        return body;
    }

    createCollider(shape, body) {
        const collider = new MockCollider(shape);
        collider.parent = body;
        this.colliders.push(collider);
        return collider;
    }

    removeRigidBody(body) {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }

    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index !== -1) {
            this.colliders.splice(index, 1);
        }
    }

    step() {
        // Simulate physics step
        this.bodies.forEach((body) => {
            if (body.isEnabled) {
                // Apply gravity
                body.linvel.y += this.gravity.y * this.timestep;

                // Update position
                body.translation.x += body.linvel.x * this.timestep;
                body.translation.y += body.linvel.y * this.timestep;

                // Apply damping
                body.linvel.x *= 1 - body.linearDamping * this.timestep;
                body.linvel.y *= 1 - body.linearDamping * this.timestep;
                body.angvel *= 1 - body.angularDamping * this.timestep;
            }
        });
    }

    gravity() {
        return this.gravity;
    }

    intersectionPair(_collider1, _collider2) {
        // Simple mock intersection check
        return false;
    }
}

export class MockRigidBodyDesc {
    constructor(type) {
        this.type = type;
        this.translation = { x: 0, y: 0 };
        this.rotation = 0;
        this.linearDamping = 0;
        this.angularDamping = 0;
        this.gravityScale = 1;
    }

    setTranslation(x, y) {
        this.translation = { x, y };
        return this;
    }

    setRotation(angle) {
        this.rotation = angle;
        return this;
    }

    setLinearDamping(damping) {
        this.linearDamping = damping;
        return this;
    }

    setAngularDamping(damping) {
        this.angularDamping = damping;
        return this;
    }

    setGravityScale(scale) {
        this.gravityScale = scale;
        return this;
    }

    setCanSleep(canSleep) {
        this.canSleep = canSleep;
        return this;
    }

    setCcdEnabled(enabled) {
        this.ccdEnabled = enabled;
        return this;
    }

    static dynamic() {
        return new MockRigidBodyDesc('dynamic');
    }

    static kinematicPositionBased() {
        return new MockRigidBodyDesc('kinematic');
    }

    static fixed() {
        return new MockRigidBodyDesc('fixed');
    }
}

export class MockColliderDesc {
    constructor(shape) {
        this.shape = shape;
        this.friction = 0.5;
        this.restitution = 0;
    }

    setFriction(friction) {
        this.friction = friction;
        return this;
    }

    setRestitution(restitution) {
        this.restitution = restitution;
        return this;
    }

    static cuboid(halfWidth, halfHeight) {
        return new MockColliderDesc({ type: 'cuboid', halfWidth, halfHeight });
    }

    static ball(radius) {
        return new MockColliderDesc({ type: 'ball', radius });
    }
}

export class MockEventQueue {
    constructor(autoDrain) {
        this.autoDrain = autoDrain;
        this.events = [];
    }

    drainContactForceEvents(_callback) {
        // Mock implementation
    }

    drainCollisionEvents(_callback) {
        // Mock implementation
    }
}

// Create mock RAPIER namespace
const RAPIER = {
    World: MockWorld,
    RigidBody: MockRigidBody,
    RigidBodyDesc: MockRigidBodyDesc,
    Collider: MockCollider,
    ColliderDesc: MockColliderDesc,
    EventQueue: MockEventQueue,
    init: () => Promise.resolve(RAPIER),
};

export default RAPIER;
