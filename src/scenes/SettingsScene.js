import Phaser, { Scene } from 'phaser';
import { UIConfig } from '../constants/UIConfig';
import { AudioManager } from '../modules/AudioManager';
import { GameStateManager } from '../modules/GameStateManager';

/**
 * SettingsScene: placeholder scene for game settings UI.
 */
export class SettingsScene extends Scene {
  constructor() {
    super('Settings');
  }

  /**
   * Create method called when the scene is started.
   */
  create() {
    const { width, height } = this.cameras.main;
    // Semi-transparent full-screen overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
    // Panel background
    const { panel } = UIConfig;
    this.add.rectangle(
      width / 2,
      height / 2,
      width * 0.5,
      height * 0.6,
      panel.backgroundColor,
      panel.backgroundAlpha
    ).setOrigin(0.5);
    // Title text
    const { title: titleStyle } = UIConfig.text;
    this.add.text(width / 2, height / 2 - 140, 'Settings', titleStyle)
      .setOrigin(0.5);
    // Collect focusable interactive elements
    const focusables = [];
    // Volume controls
    const { menuButton } = UIConfig;
    const gameState = new GameStateManager();
    const settings = gameState.settings;
    const volumes = settings.volumes || { master: 0.8, music: 0.7, sfx: 0.9 };
    const volumeKeys = ['master', 'music', 'sfx'];
    const volumeLabels = { master: 'Master Volume', music: 'Music Volume', sfx: 'SFX Volume' };
    volumeKeys.forEach((key, idx) => {
      const y = height / 2 - 60 + idx * 60;
      // Label
      this.add.text(
        width / 2 - 200,
        y,
        volumeLabels[key] + ':',
        UIConfig.text.label
      ).setOrigin(0, 0.5);
      // Minus button
      const minus = this.add.text(
        width / 2 - 50,
        y,
        '<',
        menuButton
      ).setOrigin(0.5).setInteractive();
      focusables.push(minus);
      // Percentage text
      const percText = this.add.text(
        width / 2,
        y,
        `${Math.round((volumes[key] || 0) * 100)}%`,
        UIConfig.text.stats
      ).setOrigin(0.5);
      // Plus button
      const plus = this.add.text(
        width / 2 + 50,
        y,
        '>',
        menuButton
      ).setOrigin(0.5).setInteractive();
      focusables.push(plus);
      // Helper to update volume
      const updateVol = (delta) => {
        let val = Math.round((volumes[key] || 0) * 100) + delta;
        val = Phaser.Math.Clamp(val, 0, 100);
        volumes[key] = val / 100;
        // Apply to AudioManager
        const audio = AudioManager.getInstance();
        if (key === 'master') audio.setMasterVolume(volumes[key]);
        if (key === 'music') audio.setMusicVolume(volumes[key]);
        if (key === 'sfx') audio.setSFXVolume(volumes[key]);
        // Update display
        percText.setText(`${val}%`);
        // Persist settings
        gameState.saveSettings(Object.assign({}, settings, { volumes }));
      };
      // Button interactions
      [minus, plus].forEach((btn, i) => {
        const delta = i === 0 ? -5 : 5;
        btn.on('pointerover', () => {
          btn.setTint(menuButton.hoverTint);
          AudioManager.getInstance().playSFX('hover');
        });
        btn.on('pointerout', () => btn.clearTint());
        btn.on('pointerdown', () => {
          AudioManager.getInstance().playSFX('click');
          updateVol(delta);
        });
      });
    });
    // Keybinding remapping
    const keyBindings = settings.keybindings || {};
    const actionLabels = { jump: 'Jump', left: 'Move Left', right: 'Move Right', pause: 'Pause' };
    const actions = ['jump', 'left', 'right', 'pause'];
    const keyTexts = {};
    actions.forEach((action, idx) => {
      const y = height / 2 + 20 + idx * 40;
      // Action label
      this.add.text(
        width / 2 - 200,
        y,
        `${actionLabels[action]}:`,
        UIConfig.text.label
      ).setOrigin(0, 0.5);
      // Current key text
      const current = keyBindings[action] || '';
      const keyText = this.add.text(
        width / 2,
        y,
        current,
        UIConfig.text.stats
      ).setOrigin(0.5).setInteractive();
      focusables.push(keyText);
      keyTexts[action] = keyText;
      // Hover effect
      keyText.on('pointerover', () => {
        keyText.setTint(UIConfig.menuButton.hoverTint);
        AudioManager.getInstance().playSFX('hover');
      });
      keyText.on('pointerout', () => keyText.clearTint());
      // On click: capture next key
      keyText.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('click');
        keyText.setText('Press any key');
        // Listen for single key press
        this.input.keyboard.once('keydown', (evt) => {
          const newKey = evt.key.toUpperCase();
          // Prevent duplicate assignment
          const already = Object.values(keyBindings).includes(newKey);
          if (!already) {
            keyBindings[action] = newKey;
            keyText.setText(newKey);
            // Persist settings
            gameState.saveSettings(settings);
          } else {
            // Revert display
            keyText.setText(keyBindings[action]);
          }
        });
      });
    });
    // Graphics Quality selector
    const qualityOptions = ['Low', 'Medium', 'High'];
    let currentQuality = settings.graphicsQuality || 'Medium';
    let qualityIndex = qualityOptions.indexOf(currentQuality);
    if (qualityIndex < 0) qualityIndex = 1;
    const gfxY = height / 2 + 180;
    // Label
    this.add.text(
      width / 2 - 200,
      gfxY,
      'Graphics Quality:',
      UIConfig.text.label
    ).setOrigin(0, 0.5);
    // Left arrow
    const leftArrow = this.add.text(
      width / 2 - 50,
      gfxY,
      '<',
      UIConfig.menuButton
    ).setOrigin(0.5).setInteractive();
    focusables.push(leftArrow);
    // Quality text
    const qualityText = this.add.text(
      width / 2,
      gfxY,
      qualityOptions[qualityIndex],
      UIConfig.text.stats
    ).setOrigin(0.5);
    // Right arrow
    const rightArrow = this.add.text(
      width / 2 + 50,
      gfxY,
      '>',
      UIConfig.menuButton
    ).setOrigin(0.5).setInteractive();
    focusables.push(rightArrow);
    // Helper to update quality
    const updateQuality = (delta) => {
      qualityIndex = Phaser.Math.Wrap(qualityIndex + delta, 0, qualityOptions.length);
      currentQuality = qualityOptions[qualityIndex];
      qualityText.setText(currentQuality);
      // Apply to managers
      const gameScene = this.scene.get('Game');
      if (gameScene && gameScene.particleManager) {
        gameScene.particleManager.setQuality(currentQuality);
      }
      if (gameScene && gameScene.cameraManager) {
        gameScene.cameraManager.setQuality(currentQuality);
      }
      // Persist settings
      gameState.saveSettings(Object.assign({}, settings, { graphicsQuality: currentQuality }));
    };
    // Interactions
    [leftArrow, rightArrow].forEach((arrow, i) => {
      const delta = i === 0 ? -1 : 1;
      arrow.on('pointerover', () => {
        arrow.setTint(UIConfig.menuButton.hoverTint);
        AudioManager.getInstance().playSFX('hover');
      });
      arrow.on('pointerout', () => arrow.clearTint());
      arrow.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('click');
        updateQuality(delta);
      });
    });
    // Accessibility Toggles
    const acc = settings.accessibility || { palette: 'Off', highContrast: false, subtitles: false };
    // Color-blind palette selector
    const paletteOptions = ['Off', 'Deuteranopia', 'Protanopia', 'Tritanopia'];
    let paletteIndex = paletteOptions.indexOf(acc.palette);
    if (paletteIndex < 0) paletteIndex = 0;
    const accStartY = height / 2 + 260;
    // Label
    this.add.text(
      width / 2 - 200,
      accStartY,
      'Color-blind Palette:',
      UIConfig.text.label
    ).setOrigin(0, 0.5);
    // Left arrow
    const palLeft = this.add.text(
      width / 2 - 50,
      accStartY,
      '<', UIConfig.menuButton
    ).setOrigin(0.5).setInteractive();
    focusables.push(palLeft);
    // Palette text
    const palText = this.add.text(
      width / 2,
      accStartY,
      paletteOptions[paletteIndex],
      UIConfig.text.stats
    ).setOrigin(0.5);
    // Right arrow
    const palRight = this.add.text(
      width / 2 + 50,
      accStartY,
      '>', UIConfig.menuButton
    ).setOrigin(0.5).setInteractive();
    focusables.push(palRight);
    const updatePalette = (delta) => {
      paletteIndex = Phaser.Math.Wrap(paletteIndex + delta, 0, paletteOptions.length);
      const newPal = paletteOptions[paletteIndex];
      palText.setText(newPal);
      // Apply via ColorManager
      const gameScene = this.scene.get('Game');
      if (gameScene && gameScene.colorManager) {
        gameScene.colorManager.applyPalette(newPal);
      }
      // Persist
      gameState.saveSettings(Object.assign({}, settings, { accessibility: Object.assign({}, acc, { palette: newPal }) }));
    };
    [palLeft, palRight].forEach((btn, i) => {
      const d = i === 0 ? -1 : 1;
      btn.on('pointerover', () => { btn.setTint(UIConfig.menuButton.hoverTint); AudioManager.getInstance().playSFX('hover'); });
      btn.on('pointerout', () => btn.clearTint());
      btn.on('pointerdown', () => { AudioManager.getInstance().playSFX('click'); updatePalette(d); });
    });
    // High-contrast toggle
    const hcY = accStartY + 40;
    this.add.text(width / 2 - 200, hcY, 'High Contrast:', UIConfig.text.label).setOrigin(0, 0.5);
    const hcText = this.add.text(width / 2, hcY, acc.highContrast ? 'On' : 'Off', UIConfig.text.stats)
      .setOrigin(0.5).setInteractive();
    focusables.push(hcText);
    hcText.on('pointerover', () => { hcText.setTint(UIConfig.menuButton.hoverTint); AudioManager.getInstance().playSFX('hover'); });
    hcText.on('pointerout', () => hcText.clearTint());
    hcText.on('pointerdown', () => {
      AudioManager.getInstance().playSFX('click');
      acc.highContrast = !acc.highContrast;
      hcText.setText(acc.highContrast ? 'On' : 'Off');
      // Apply via UIManager
      const gm = this.scene.get('Game');
      if (gm && gm.uiManager) gm.uiManager.applyHighContrast(acc.highContrast);
      // Persist
      gameState.saveSettings(Object.assign({}, settings, { accessibility: acc }));
    });
    // Subtitles toggle
    const subY = hcY + 40;
    this.add.text(width / 2 - 200, subY, 'Subtitles:', UIConfig.text.label).setOrigin(0, 0.5);
    const subText = this.add.text(width / 2, subY, acc.subtitles ? 'On' : 'Off', UIConfig.text.stats)
      .setOrigin(0.5).setInteractive();
    focusables.push(subText);
    subText.on('pointerover', () => { subText.setTint(UIConfig.menuButton.hoverTint); AudioManager.getInstance().playSFX('hover'); });
    subText.on('pointerout', () => subText.clearTint());
    subText.on('pointerdown', () => {
      AudioManager.getInstance().playSFX('click');
      acc.subtitles = !acc.subtitles;
      subText.setText(acc.subtitles ? 'On' : 'Off');
      // Apply via UIManager
      const gm2 = this.scene.get('Game');
      if (gm2 && gm2.uiManager) gm2.uiManager.showSubtitles(acc.subtitles);
      // Persist
      gameState.saveSettings(Object.assign({}, settings, { accessibility: acc }));
    });
    // Back button
    const backBtn = this.add.text(
      width / 2,
      height / 2 + 200,
      'Back',
      menuButton
    )
      .setOrigin(0.5)
      .setInteractive();
    focusables.push(backBtn);
    // Button interactions
    backBtn.on('pointerover', () => {
      backBtn.setTint(menuButton.hoverTint);
      AudioManager.getInstance().playSFX('hover');
    });
    backBtn.on('pointerout', () => backBtn.clearTint());
    backBtn.on('pointerdown', () => {
      AudioManager.getInstance().playSFX('click');
      // Return to pause overlay
      this.scene.stop();
      this.scene.resume('PauseScene');
    });
    // ESC key to go back
    this.input.keyboard.once('keydown-ESC', () => {
      AudioManager.getInstance().playSFX('click');
      this.scene.stop();
      this.scene.resume('PauseScene');
    });
    // --- Input & Navigation Support (031-8) ---
    // Collect all focusable interactive elements in visual order (resetting existing list)
    focusables.length = 0;
    // Volume controls focus handled via explicit pushes above
    // Keybinding text elements
    actions.forEach(action => focusables.push(keyTexts[action]));
    // Graphics quality arrows
    focusables.push(leftArrow, rightArrow);
    // Accessibility palette arrows
    focusables.push(palLeft, palRight);
    // High-contrast and subtitles toggles
    focusables.push(hcText, subText);
    // Back button
    focusables.push(backBtn);
    let currentFocus = 0;
    // Highlight and clear helper
    const highlight = (el) => el.setStyle({ backgroundColor: '#4444aa' });
    const clearHighlight = (el) => el.setStyle({ backgroundColor: null });
    // Initialize focus
    highlight(focusables[currentFocus]);
    // Keyboard navigation
    this.input.keyboard.on('keydown-TAB', (evt) => {
      evt.preventDefault();
      clearHighlight(focusables[currentFocus]);
      currentFocus = evt.shiftKey
        ? (currentFocus - 1 + focusables.length) % focusables.length
        : (currentFocus + 1) % focusables.length;
      highlight(focusables[currentFocus]);
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      focusables[currentFocus].emit('pointerdown');
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      focusables[currentFocus].emit('pointerdown');
    });
    this.input.keyboard.on('keydown-LEFT', () => {
      const el = focusables[currentFocus];
      if (el.text === '<') el.emit('pointerdown');
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      const el = focusables[currentFocus];
      if (el.text === '>') el.emit('pointerdown');
    });
    // Gamepad navigation
    this.input.gamepad.once('connected', (pad) => {
      pad.on('down', (button, value) => {
        const idx = button.index;
        const X360 = Phaser.Input.Gamepad.Configs.XBOX_360;
        if (idx === X360.DPAD_UP) {
          clearHighlight(focusables[currentFocus]);
          currentFocus = (currentFocus - 1 + focusables.length) % focusables.length;
          highlight(focusables[currentFocus]);
        } else if (idx === X360.DPAD_DOWN) {
          clearHighlight(focusables[currentFocus]);
          currentFocus = (currentFocus + 1) % focusables.length;
          highlight(focusables[currentFocus]);
        } else if (idx === X360.DPAD_LEFT) {
          const el = focusables[currentFocus]; if (el.text === '<') el.emit('pointerdown');
        } else if (idx === X360.DPAD_RIGHT) {
          const el = focusables[currentFocus]; if (el.text === '>') el.emit('pointerdown');
        } else if (idx === X360.A) {
          focusables[currentFocus].emit('pointerdown');
        }
      });
    });
  }
  /**
   * Update method called on each frame.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    // Placeholder update
  }
}