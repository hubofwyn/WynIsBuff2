const assert = require('assert');

const { parallaxKeysFor } = require('../src/modules/level/ParallaxMap.js');
const { ImageAssets } = require('../src/constants/Assets.js');

describe('ParallaxMap', () => {
  it('maps protein-plant to generated backdrops', () => {
    const keys = parallaxKeysFor('protein-plant');
    assert(Array.isArray(keys) && keys.length === 4);
    keys.forEach(k => assert.ok(k in ImageAssets || typeof k === 'string'));
  });
  it('maps metronome-mines to generated backdrops', () => {
    const keys = parallaxKeysFor('metronome-mines');
    assert(Array.isArray(keys) && keys.length === 4);
  });
  it('maps factory-floor to generated backdrops', () => {
    const keys = parallaxKeysFor('factory-floor');
    assert(Array.isArray(keys) && keys.length === 4);
  });
  it('returns null for unknown', () => {
    const keys = parallaxKeysFor('unknown-biome');
    assert.strictEqual(keys, null);
  });
});

