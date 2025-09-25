'use strict';

// Validates PhysicsManager counts contacts when a dynamic body falls onto static ground.

const assert = require('assert');

const { PhysicsManager } = require('../src/core/PhysicsManager.js');

console.log('Running PhysicsManager contacts tests...');

(async function () {
  const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
  await RAPIER.init();

  // Minimal scene shim with registry and event bus
  const scene = {
    registry: new Map(),
  };
  scene.registry.set('RAPIER', RAPIER);
  scene.registry.get = function (k) { return Map.prototype.get.call(this, k); };
  const eventBus = { emit: () => {} };

  const pm = PhysicsManager.getInstance();
  await pm.init(scene, eventBus, 0, 9.81);

  const world = pm.getWorld();
  // Create ground
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 1));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2, 0.1), ground);
  // Create dynamic body above ground
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.2), body);

  // Step a few frames
  for (let i = 0; i < 120; i++) {
    pm.update(16.67);
  }

  const cps = pm.getLastContactsPerSec();
  const last = pm.getContactsLastStep();
  assert.ok(cps >= 0, 'contacts/sec should be a number');
  assert.ok(last >= 0, 'contacts in last step should be a number');
  // We expect at least some contacts during the fall/landing after some steps.
  assert.ok(cps > 0 || last > 0, 'should observe at least one contact');

  console.log('PhysicsManager contacts tests passed.');
})();

