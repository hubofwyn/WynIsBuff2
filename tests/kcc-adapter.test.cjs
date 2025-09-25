'use strict';

const assert = require('assert');

console.log('Running KccAdapter probe tests...');

(async function () {
  const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
  await RAPIER.init();

  const { CollisionGroups } = require('../src/constants/CollisionGroups.js');
  const { KccAdapter } = require('../src/modules/player/KccAdapter.js');

  const world = new RAPIER.World({ x: 0, y: 9.81 });

  // Ground at y=1m
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 1));
  const groundCol = world.createCollider(RAPIER.ColliderDesc.cuboid(1, 0.1), ground);
  groundCol.setCollisionGroups(
    CollisionGroups.createMask(CollisionGroups.STATIC, CollisionGroups.PLAYER)
  );

  // Player body at y=0.5m (above ground), kinematic-like usage
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.5));
  const col = world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.4), body);
  col.setCollisionGroups(
    CollisionGroups.createMask(CollisionGroups.PLAYER, CollisionGroups.STATIC)
  );

  const kcc = new KccAdapter({ RAPIER, world, body, collider: col, pxPerMeter: 50 });
  const mask = CollisionGroups.createMask(CollisionGroups.PLAYER, CollisionGroups.STATIC);
  const grounded = kcc.probeGround(20, mask); // 20px probe should reach ground
  assert.strictEqual(grounded, true, 'KccAdapter.probeGround should detect ground');

  console.log('KccAdapter tests passed.');
})();

