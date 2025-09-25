// Simple parallax background helper using generated backdrops
// Usage:
// import { ParallaxLayers } from '../systems/ParallaxLayers.js';
// const layers = ParallaxLayers.create(this, [
//   ImageAssets.GEN_BACKDROP_PROTEIN_SKY,
//   ImageAssets.GEN_BACKDROP_PROTEIN_MID,
//   ImageAssets.GEN_BACKDROP_PROTEIN_FORE,
//   ImageAssets.GEN_BACKDROP_PROTEIN_FG
// ], [0.1, 0.3, 0.6, 0.9]);
// this.add.existing(layers.container);

import Phaser from 'phaser';
import { ImageAssets } from '../constants/Assets.js';

function clamp01(v){ return Math.max(0, Math.min(1, v)); }

export const ParallaxLayers = {
  create(scene, imageKeys, scrollFactors) {
    const container = scene.add.container(0, 0);
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const layers = imageKeys.map((key, i) => {
      const sf = clamp01(scrollFactors[i] ?? (i / imageKeys.length));
      const img = scene.add.image(cx, cy, key).setOrigin(0.5);
      // Scale to cover while keeping aspect (assets are 1024x1024)
      const scale = Math.max(cam.width / img.width, cam.height / img.height);
      img.setScale(scale);
      img.setScrollFactor(sf, sf);
      img.setDepth(-100 + i); // behind world
      container.add(img);
      return img;
    });

    return { container, layers };
  }
};

