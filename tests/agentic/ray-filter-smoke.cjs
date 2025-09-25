'use strict';

// Rapier raycast filter smoke: verify CollisionGroups mask influences a simple ray hit.

const fs = require('fs');
const path = require('path');
const { CollisionGroups } = require('../../src/constants/CollisionGroups.js');

function appendSummary(entry) {
  const outDir = path.join(process.cwd(), '.reports', 'agentic');
  const file = path.join(outDir, 'summary.json');
  const base = { runs: [], flaky: false };
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      data.runs.push(entry);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } else {
      base.runs.push(entry);
      fs.writeFileSync(file, JSON.stringify(base, null, 2));
    }
  } catch {}
}

(async function main() {
  const entry = { name: 'agentic.ray-filter-smoke', ok: false, timestamp: new Date().toISOString() };
  try {
    const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
    await RAPIER.init();

    const world = new RAPIER.World({ x: 0, y: 9.81 });

    // Ground at y=1, width 2m, height 0.2m
    const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 1));
    const groundCollider = world.createCollider(RAPIER.ColliderDesc.cuboid(1, 0.1), groundBody);
    // STATIC colliding with PLAYER only
    const groups = CollisionGroups.createMask(CollisionGroups.STATIC, CollisionGroups.PLAYER);
    groundCollider.setCollisionGroups(groups);

    // Cast ray from origin (0,0) downward 5m, ray belongs to PLAYER colliding with STATIC
    const ray = new RAPIER.Ray({ x: 0, y: 0 }, { x: 0, y: 1 });
    const maxToi = 5;
    const solid = true;
    const rayGroups = CollisionGroups.createMask(CollisionGroups.PLAYER, CollisionGroups.STATIC);
    const hit = world.castRay(ray, maxToi, solid, undefined, rayGroups);

    entry.ok = !!hit && hit.toi > 0 && hit.toi < 5;
    entry.details = { toi: hit?.toi ?? null };
  } catch (e) {
    entry.error = e?.message || String(e);
  } finally {
    appendSummary(entry);
    console.log('[agentic] ray-filter-smoke:', entry);
  }
})();

