// Minimal parallax helper for Phaser 4 sandbox
export function createParallax(scene, keys, factors) {
  const cam = scene.cameras.main;
  const cx = cam.width / 2, cy = cam.height / 2;
  const layers = keys.map((k, i) => {
    const img = scene.add.image(cx, cy, k).setOrigin(0.5);
    const sf = Number(factors[i] ?? (i/keys.length));
    const scale = Math.max(cam.width / img.width, cam.height / img.height);
    img.setScale(scale);
    // Simulate scroll effect by tweening x at different speeds
    scene.tweens.add({ targets: img, x: `+=${10 + i*10}`, duration: 1000, yoyo: true, repeat: -1 });
    img.scrollFactorX = sf; // marker
    return img;
  });
  return layers;
}

