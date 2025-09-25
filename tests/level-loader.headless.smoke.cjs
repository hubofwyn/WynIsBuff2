const assert = require('assert');

const LevelLoader = require('../src/modules/level/LevelLoader.js');
const { ParallaxLayers } = require('../src/systems/ParallaxLayers.js');

function makeMockScene() {
  const images = [];
  return {
    cameras: { main: { width: 800, height: 600, setBackgroundColor: () => {} } },
    add: {
      image: (x, y, key) => ({
        key, x, y,
        setOrigin() { return this; },
        setScrollFactor() { return this; },
        setDepth() { return this; },
        setScale() { return this; }
      })
    },
    tweens: { add: () => {} },
    textures: { exists: () => true },
  };
}

describe('LevelLoader headless background smoke', () => {
  it('does not throw on fallback background', () => {
    const scene = makeMockScene();
    const loader = new LevelLoader.LevelLoader(scene, null, { world: null });
    loader.currentLevelId = 'unknown-biome';
    loader.currentLevelConfig = { environment: { theme: 'unknown' } };
    assert.doesNotThrow(() => loader.setupBackground({ color: 0x000000 }));
  });
  it('does not throw when using generated parallax for supported biomes', () => {
    const biomes = [
      { id: 'protein-plant', theme: 'protein' },
      { id: 'metronome-mines', theme: 'mines' },
      { id: 'factory-floor', theme: 'factory' }
    ];
    biomes.forEach(({ id, theme }) => {
      const scene = makeMockScene();
      const loader = new LevelLoader.LevelLoader(scene, null, { world: null });
      loader.currentLevelId = id;
      loader.currentLevelConfig = { environment: { theme } };
      assert.doesNotThrow(() => loader.setupBackground({ color: 0x000000 }));
    });
  });
});
