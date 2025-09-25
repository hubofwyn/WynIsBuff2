import { ImageAssets } from '../constants/Assets.js';

// Options: { scale?: number, tint?: number, iconKey?: string, iconScale?: number, focusRing?: boolean }
export function createUIButton(scene, x, y, label, onClick, scaleOrOptions = 0.4) {
  const opts = typeof scaleOrOptions === 'number' ? { scale: scaleOrOptions } : (scaleOrOptions || {});
  const scale = typeof opts.scale === 'number' ? opts.scale : 0.4;
  const tint = typeof opts.tint === 'number' ? opts.tint : null;
  const iconKey = opts.iconKey || null;
  const iconScale = typeof opts.iconScale === 'number' ? opts.iconScale : scale * 0.6;
  const showFocusRing = !!opts.focusRing;

  const btn = scene.add.image(x, y, ImageAssets.GEN_UI_BUTTON_PRIMARY)
    .setScale(scale)
    .setInteractive({ useHandCursor: true });
  if (tint) btn.setTint(tint);
  const txt = scene.add.text(x, y, label, {
    fontFamily: 'Arial Black',
    fontSize: `${Math.round(28 * scale)}px`,
    color: '#ffffff',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);

  let icon = null;
  if (iconKey) {
    icon = scene.add.image(x, y, iconKey).setScale(iconScale).setDepth((btn.depth || 0) + 1).setOrigin(0.5);
  }

  // Optional focus ring
  let ring = null;
  if (showFocusRing) {
    ring = scene.add.graphics();
    ring.lineStyle(3, 0x00ffff, 0.8);
    const w = 256 * scale, h = 128 * scale; // approximate base size
    ring.strokeRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 12);
    ring.setVisible(false);
  }

  const applyScale = (s) => {
    btn.setScale(s);
    txt.setScale(s);
    if (icon) icon.setScale((iconScale / scale) * s);
  };

  const hoverScale = scale * 1.05;
  btn.on('pointerdown', () => {
    scene.tweens.add({ targets: [btn, txt, icon].filter(Boolean), scaleX: scale * 0.95, scaleY: scale * 0.95, duration: 80, yoyo: true });
    onClick && onClick();
  });
  btn.on('pointerover', () => {
    btn.setTint(tint ?? 0xddddff);
    scene.tweens.add({ targets: [btn, txt, icon].filter(Boolean), scaleX: hoverScale, scaleY: hoverScale, duration: 120, ease: 'Power2' });
    if (ring) ring.setVisible(true);
  });
  btn.on('pointerout', () => {
    if (!tint) btn.clearTint();
    scene.tweens.add({ targets: [btn, txt, icon].filter(Boolean), scaleX: scale, scaleY: scale, duration: 120, ease: 'Power2' });
    if (ring) ring.setVisible(false);
  });
  return { btn, txt, icon, ring };
}

export function createPrimaryButton(scene, x, y, label, onClick, options = {}) {
  const opts = Object.assign({ scale: 0.4, tint: 0x66ccff, focusRing: true }, options);
  return createUIButton(scene, x, y, label, onClick, opts);
}

export function createSecondaryButton(scene, x, y, label, onClick, options = {}) {
  const opts = Object.assign({ scale: 0.35, tint: 0x85a8c7, focusRing: false }, options);
  return createUIButton(scene, x, y, label, onClick, opts);
}

export function createTertiaryButton(scene, x, y, label, onClick, options = {}) {
  // Ghost style: no tint, smaller scale, optional focus ring
  const opts = Object.assign({ scale: 0.32, focusRing: false }, options);
  return createUIButton(scene, x, y, label, onClick, opts);
}
