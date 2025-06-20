// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from assets/manifest.json by scripts/generate-assets.js
// Run 'npm run generate-assets' to regenerate this file

/**
 * Asset constants generated from manifest.json
 * Use these constants instead of hard-coded asset keys
 */

export const ImageAssets = Object.freeze({
  BACKGROUND: 'background',
  LOGO: 'logo',
  PLAYER_FULL: 'playerFull',
  PLAYER: 'player',
  DUNGEON_TILES: 'dungeonTiles',
  ARROW1: 'arrow1',
  ARROW2: 'arrow2',
  ARROW3: 'arrow3',
  ARROW4: 'arrow4',
  COIN: 'coin',
  CHEST: 'chest',
  COLLECTIBLE_PROTEIN: 'collectibleProtein',
  COLLECTIBLE_DUMBBELL: 'collectibleDumbbell',
  TORCH: 'torch',
  AXELFACE: 'axelface',
  WYNFACE: 'wynface',
  ILA_SPRITE: 'ilaSprite',
  AXEL_SPRITE: 'axelSprite',
  WYN_SPRITE: 'wynSprite',
  BUFF_BG: 'buffBg',
  PARALLAX_SKY: 'parallaxSky',
  PARALLAX_MOUNTAINS: 'parallaxMountains',
  PARALLAX_FOREGROUND: 'parallaxForeground',
});

export const ImagePaths = Object.freeze({
  BACKGROUND: 'images/characters/mainlogo.png',
  LOGO: 'images/characters/mainlogo.png',
  PLAYER_FULL: '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png',
  PLAYER: '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png',
  DUNGEON_TILES: 'images/tilesets/Dungeon_Tileset.png',
  ARROW1: 'images/ui/interface/arrow_1.png',
  ARROW2: 'images/ui/interface/arrow_2.png',
  ARROW3: 'images/ui/interface/arrow_3.png',
  ARROW4: 'images/ui/interface/arrow_4.png',
  COIN: 'spritesheets/items/coin.png',
  CHEST: 'spritesheets/items/chest.png',
  COLLECTIBLE_PROTEIN: 'spritesheets/items/flasks/flasks_2.png',
  COLLECTIBLE_DUMBBELL: 'spritesheets/items/chest.png',
  TORCH: 'spritesheets/effects/torch/torch.png',
  AXELFACE: 'images/characters/axelface.png',
  WYNFACE: 'images/characters/wynface.png',
  ILA_SPRITE: 'images/characters/ila_sprite.png',
  AXEL_SPRITE: 'images/characters/axel_sprite.png',
  WYN_SPRITE: 'images/characters/wyn_sprite.png',
  BUFF_BG: 'images/characters/mainlogo.png',
  PARALLAX_SKY: 'images/characters/mainlogo.png',
  PARALLAX_MOUNTAINS: 'images/characters/mainlogo.png',
  PARALLAX_FOREGROUND: 'images/characters/mainlogo.png',
});

export const AudioAssets = Object.freeze({
  // Music
  PROTEIN_PIXEL_ANTHEM: 'proteinPixelAnthem',
  HYPER_BUFF_BLITZ: 'hyperBuffBlitz',

  // Sound Effects
  SFX_LAND1: 'sfxLand1',
  SFX_LAND2: 'sfxLand2',
  SFX_LAND3: 'sfxLand3',
  SFX_LAND4: 'sfxLand4',
  SFX_PICKUP1: 'sfxPickup1',
  SFX_PICKUP2: 'sfxPickup2',
  SFX_PICKUP3: 'sfxPickup3',
  SFX_PICKUP4: 'sfxPickup4',
  SFX_CLICK1: 'sfxClick1',
  SFX_CLICK2: 'sfxClick2',
  SFX_CLICK3: 'sfxClick3',
  SFX_CLICK4: 'sfxClick4',
  SFX_HOVER1: 'sfxHover1',
  SFX_HOVER2: 'sfxHover2',
  SFX_HOVER3: 'sfxHover3',
  SFX_HOVER4: 'sfxHover4',
});

export const AudioPaths = Object.freeze({
  PROTEIN_PIXEL_ANTHEM: 'sounds/opener/protein-pixel-anthem.mp3',
  HYPER_BUFF_BLITZ: 'sounds/background/hyper-buff-blitz.mp3',
  SFX_LAND1: 'sounds/land-effects/land1.mp3',
  SFX_LAND2: 'sounds/land-effects/land2.mp3',
  SFX_LAND3: 'sounds/land-effects/land3.mp3',
  SFX_LAND4: 'sounds/land-effects/land4.mp3',
  SFX_PICKUP1: 'sounds/pickup-effects/pickup1.mp3',
  SFX_PICKUP2: 'sounds/pickup-effects/pickup2.mp3',
  SFX_PICKUP3: 'sounds/pickup-effects/pickup3.mp3',
  SFX_PICKUP4: 'sounds/pickup-effects/pickup4.mp3',
  SFX_CLICK1: 'sounds/primary-click/click1.mp3',
  SFX_CLICK2: 'sounds/primary-click/click2.mp3',
  SFX_CLICK3: 'sounds/primary-click/click3.mp3',
  SFX_CLICK4: 'sounds/primary-click/click4.mp3',
  SFX_HOVER1: 'sounds/ui-hover/hover1.mp3',
  SFX_HOVER2: 'sounds/ui-hover/hover2.mp3',
  SFX_HOVER3: 'sounds/ui-hover/hover3.mp3',
  SFX_HOVER4: 'sounds/ui-hover/hover4.mp3',
});

export const SpritesheetConfigs = Object.freeze({
  PLAYER: {
    frameWidth: 16,
    frameHeight: 16,
    margin: 0,
    spacing: 0
  },
});

/**
 * Helper functions for asset management
 */

/**
 * Get all assets of a specific type
 * @param {string} type - Asset type ('image', 'audio', 'spritesheet')
 * @returns {Object} Object containing assets of the specified type
 */
export function getAssetsByType(type) {
  const assets = {};
  
  if (type === 'image') {
    return ImageAssets;
  }
  
  if (type === 'audio') {
    return AudioAssets;
  }
  
  if (type === 'spritesheet') {
    const spritesheets = {};
    Object.entries(ImageAssets).forEach(([key, value]) => {
      if (SpritesheetConfigs[key]) {
        spritesheets[key] = value;
      }
    });
    return spritesheets;
  }
  
  return assets;
}

/**
 * Get asset path by key
 * @param {string} key - Asset key
 * @returns {string|null} Asset path or null if not found
 */
export function getAssetPath(key) {
  // Check image paths
  const imageKey = Object.keys(ImageAssets).find(k => ImageAssets[k] === key);
  if (imageKey && ImagePaths[imageKey]) {
    return ImagePaths[imageKey];
  }
  
  // Check audio paths
  const audioKey = Object.keys(AudioAssets).find(k => AudioAssets[k] === key);
  if (audioKey && AudioPaths[audioKey]) {
    return AudioPaths[audioKey];
  }
  
  return null;
}

/**
 * Validate that all required assets are present
 * @returns {boolean} True if all assets are valid
 */
export function validateAssets() {
  // This could be extended to check if files actually exist
  // For now, just check that we have the expected asset categories
  const hasImages = Object.keys(ImageAssets).length > 0;
  const hasAudio = Object.keys(AudioAssets).length > 0;
  
  return hasImages && hasAudio;
}
