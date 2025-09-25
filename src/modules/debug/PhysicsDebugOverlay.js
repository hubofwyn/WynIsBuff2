// Minimal physics/debug overlay scaffold.
// Provides an enable/disable toggle and a simple text display hook.

export class PhysicsDebugOverlay {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.label = null;
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.label) {
      this.label = this.scene.add.text(8, 8, 'Debug: on', { fontFamily: 'monospace', fontSize: '12px', color: '#00ff88' }).setScrollFactor(0);
    } else {
      this.label.setText('Debug: on').setVisible(true);
    }
  }

  disable() {
    this.enabled = false;
    if (this.label) this.label.setVisible(false);
  }

  /**
   * Update overlay text with a small status snippet.
   * @param {object} data
   */
  update(data) {
    if (!this.enabled || !this.label) return;
    const parts = [];
    if (data && typeof data.grounded === 'boolean') parts.push(`grounded:${data.grounded ? 'Y' : 'N'}`);
    if (data && data.fps != null) parts.push(`fps:${data.fps}`);
    if (data && data.contacts != null) parts.push(`contacts:${data.contacts}`);
    if (data && data.bodies != null) parts.push(`bodies:${data.bodies}`);
    this.label.setText('Debug: on ' + (parts.length ? `(${parts.join(' ')})` : ''));
  }
}
