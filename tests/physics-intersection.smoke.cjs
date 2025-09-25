'use strict';

// Validates that intersection (sensor) events emit COLLISION_START via PhysicsManager.

const assert = require('assert');

console.log('Running physics intersection smoke...');

(async function () {
  const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
  await RAPIER.init();

  // Stub scene with registry and event bus
  const events = [];
  const scene = {
    registry: new Map(),
  };
  scene.registry.set('RAPIER', RAPIER);
  scene.registry.get = function (k) { return Map.prototype.get.call(this, k); };
  const eventSystem = { emit: (name, data) => { if (name) events.push({ name, data }); } };

  const { PhysicsManager } = require('../src/core/PhysicsManager.js');
  const pm = PhysicsManager.getInstance();
  await pm.init(scene, eventSystem, 0, 9.81);
  const world = pm.getWorld();

  // Player dynamic body at (0,0)
  const player = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 0));
  const playerCol = world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.4)
    .setActiveEvents((RAPIER.ActiveEvents.COLLISION_EVENTS|RAPIER.ActiveEvents.INTERSECTION_EVENTS)), player);

  // Sensor trigger at same position to ensure intersection
  const sensor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0));
  const sensorCol = world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5)
    .setSensor(true)
    .setActiveEvents(RAPIER.ActiveEvents.INTERSECTION_EVENTS), sensor);

  // Let physics step so intersections are processed
  for (let i = 0; i < 3; i++) pm.update(16.67);

  const got = events.find(e => e.name && e.name.includes('COLLISION_START'));
  assert.ok(got, 'Expected an intersection-based COLLISION_START event');
  console.log('physics intersection smoke passed.');
})();

