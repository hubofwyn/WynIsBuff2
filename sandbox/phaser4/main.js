// Phaser 4 sandbox boot (planning stub)
// Tries to import Phaser (v4). If unavailable, logs and exits gracefully.

export async function bootPhaser4Sandbox() {
  let Phaser;
  try {
    Phaser = await import('phaser');
  } catch (e) {
    console.log('[Phaser4 Sandbox] Phaser 4 not installed. Skipping sandbox boot.');
    return false;
  }

  const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 200,
    parent: undefined,
    scene: {
      create() {
        this.add.text(10, 10, 'Phaser 4 Sandbox', { font: '16px Arial', color: '#ffffff' });
      }
    }
  };
  try {
    const game = new Phaser.Game(config);
    // Allow a brief tick, then destroy to avoid hanging tests
    setTimeout(() => game.destroy(true), 100);
    return true;
  } catch (e) {
    console.warn('[Phaser4 Sandbox] Failed to boot:', e?.message || e);
    return false;
  }
}

export async function runParallaxSmoke() {
  let Phaser;
  try {
    Phaser = await import('phaser');
  } catch (e) {
    console.log('[Phaser4 Sandbox] Phaser 4 not installed. Skipping parallax smoke.');
    return false;
  }
  const sceneDef = {
    create() {
      // Create three simple colored layer textures
      const makeLayer = (key, color, w, h) => {
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
        return key;
      };
      makeLayer('layer-sky', 0x0b0f14, 320, 200);
      makeLayer('layer-mid', 0x121923, 320, 200);
      makeLayer('layer-fore', 0x203042, 320, 200);
      this.sky = this.add.image(160, 100, 'layer-sky').setAlpha(1);
      this.mid = this.add.image(160, 100, 'layer-mid').setAlpha(0.8);
      this.fore = this.add.image(160, 100, 'layer-fore').setAlpha(0.6);
      // Simulate parallax with small offsets
      this.tweens.add({ targets: this.sky, x: '+=10', duration: 1000, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.mid, x: '+=20', duration: 1000, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.fore, x: '+=30', duration: 1000, yoyo: true, repeat: -1 });
    }
  };
  const game = new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 320, height: 200, scene: sceneDef });
  setTimeout(() => game.destroy(true), 150);
  return true;
}

export async function rapierSmoke() {
  try {
    const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
    await RAPIER.init?.();
    const gravity = { x: 0.0, y: -9.81 };
    const world = new RAPIER.World(gravity);
    // Step the world a tick
    world.timestep = 1 / 60;
    world.step();
    return true;
  } catch (e) {
    console.log('[Phaser4 Sandbox] Rapier not available or failed to init, skipping smoke.');
    return false;
  }
}

function makeRNG(seed) {
  let s = Number(seed) || 1337;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export async function runStochasticPlayer(durationMs = 300, seed = 1337) {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  const rand = makeRNG(seed);
  const sceneDef = {
    preload() {},
    create() {
      this.player = this.add.rectangle(20, 100, 10, 10, 0x00ff00);
      this.timeStart = Date.now();
    },
    update() {
      const t = Date.now() - this.timeStart;
      if (t > durationMs) {
        this.game.destroy(true);
        return;
      }
      // Random walk
      const dx = (rand() - 0.5) * 4;
      const dy = (rand() - 0.5) * 2;
      this.player.x = Math.max(0, Math.min(320, this.player.x + dx));
      this.player.y = Math.max(0, Math.min(200, this.player.y + dy));
    }
  };
  new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 320, height: 200, scene: sceneDef });
  return true;
}

export async function runGoalAgent(goalX = 280, maxMs = 500) {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  return new Promise((resolve) => {
    const sceneDef = {
      create() {
        this.player = this.add.rectangle(20, 100, 10, 10, 0x00ff00);
        this.start = Date.now();
      },
      update() {
        const now = Date.now();
        if (this.player.x < goalX) this.player.x += 5; else {
          this.game.destroy(true); resolve(true); return;
        }
        if (now - this.start > maxMs) { this.game.destroy(true); resolve(false); }
      }
    };
    new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 320, height: 200, scene: sceneDef });
  });
}

export async function runParallaxLayersPort() {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  const { createParallax } = await import('./parallaxLayers.js');
  const sceneDef = {
    create() {
      // make simple textures
      const mk = (k, c) => { const g = this.add.graphics(); g.fillStyle(c, 1); g.fillRect(0,0,320,200); g.generateTexture(k,320,200); g.destroy(); };
      mk('p4-sky', 0x0b0f14); mk('p4-mid', 0x121923); mk('p4-fore', 0x203042);
      createParallax(this, ['p4-sky', 'p4-mid', 'p4-fore'], [0.1, 0.3, 0.6]);
    }
  };
  const game = new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 320, height: 200, scene: sceneDef });
  setTimeout(()=>game.destroy(true), 120);
  return true;
}

export async function runParallaxCameraSmoke() {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  return new Promise((resolve) => {
    const sceneDef = {
      create() {
        const mk = (k, c) => { const g = this.add.graphics(); g.fillStyle(c, 1); g.fillRect(0,0,320,200); g.generateTexture(k,320,200); g.destroy(); };
        mk('cam-sky', 0x0b0f14); mk('cam-mid', 0x121923); mk('cam-fore', 0x203042);
        this.sky = this.add.image(160, 100, 'cam-sky');
        this.mid = this.add.image(160, 100, 'cam-mid');
        this.fore = this.add.image(160, 100, 'cam-fore');
        // Emulate scroll factors by moving camera; smaller effective movement for sky
        this.sf = { sky: 0.2, mid: 0.5, fore: 0.8 };
        this.tick = 0;
      },
      update() {
        this.tick++;
        if (this.tick > 30) { this.game.destroy(true); resolve(true); return; }
        const dx = 2;
        // Move layers inversely to simulate camera scroll
        this.sky.x -= dx * (1 - this.sf.sky);
        this.mid.x -= dx * (1 - this.sf.mid);
        this.fore.x -= dx * (1 - this.sf.fore);
      }
    };
    new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 320, height: 200, scene: sceneDef });
  });
}

export async function runLoaderSmoke() {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  return new Promise((resolve) => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAQAAAC1HAwCAAAAD0lEQVQYV2P4z8DwHwAEKQH7T/3mUQAAAABJRU5ErkJggg==';
    const sceneDef = {
      preload() { this.load.image('tiny', dataUri); },
      create() { this.add.image(2, 2, 'tiny'); this.game.destroy(true); resolve(true); },
    };
    new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 4, height: 4, scene: sceneDef });
  });
}

export async function runLoaderManifestSmoke() {
  // Attempts to load one real image from assets/manifest via Phaser loader.
  // Guarded by env; returns false if fails or manifest not found.
  if (!process.env.PH4_LOAD_MANIFEST) return false;
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  let ImagePaths;
  try {
    const mod = await import('../../src/constants/Assets.js');
    ImagePaths = mod.ImagePaths;
  } catch { return false; }
  // Pick a generated asset if available, else any image path
  const keys = Object.keys(ImagePaths || {});
  const genKey = keys.find(k => k.startsWith('GEN_')) || keys[0];
  if (!genKey) return false;
  const relPath = ImagePaths[genKey];
  const url = `assets/${relPath}`; // relative to repo root when run via bun
  return new Promise((resolve) => {
    const sceneDef = {
      preload() { this.load.image('fromManifest', url); },
      create() { this.add.image(4, 4, 'fromManifest'); this.game.destroy(true); resolve(true); },
      load: null
    };
    new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 8, height: 8, scene: sceneDef });
  });
}

export async function runLoaderGeneratedSmoke(constName = 'GEN_BACKDROP_FACTORY_SKY') {
  let Phaser;
  try { Phaser = await import('phaser'); } catch { return false; }
  let ImagePaths, ImageAssets;
  try {
    const mod = await import('../../src/constants/Assets.js');
    ImagePaths = mod.ImagePaths; ImageAssets = mod.ImageAssets;
  } catch { return false; }
  if (!ImageAssets[constName]) return false;
  const relPath = ImagePaths[constName];
  if (!relPath) return false;
  const url = `assets/${relPath}`;
  return new Promise((resolve) => {
    const sceneDef = {
      preload() { this.load.image('gen', url); },
      create() { this.add.image(8, 8, 'gen').setScale(0.01); this.game.destroy(true); resolve(true); }
    };
    new Phaser.Game({ type: Phaser.HEADLESS ?? Phaser.AUTO, width: 16, height: 16, scene: sceneDef });
  });
}

// If executed directly, try to boot
if (import.meta.url === `file://${process.argv[1]}`) {
  bootPhaser4Sandbox();
}
