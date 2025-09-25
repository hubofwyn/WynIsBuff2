import { ImageAssets } from '../../constants/Assets.js';

export function parallaxKeysFor(levelIdOrBiome = '') {
  const s = String(levelIdOrBiome).toLowerCase();
  if (s.includes('protein')) {
    return [
      ImageAssets.GEN_BACKDROP_PROTEIN_SKY,
      ImageAssets.GEN_BACKDROP_PROTEIN_MID,
      ImageAssets.GEN_BACKDROP_PROTEIN_FORE,
      ImageAssets.GEN_BACKDROP_PROTEIN_FG,
    ];
  }
  if (s.includes('mine')) {
    return [
      ImageAssets.GEN_BACKDROP_MINES_SKY,
      ImageAssets.GEN_BACKDROP_MINES_MID,
      ImageAssets.GEN_BACKDROP_MINES_FORE,
      ImageAssets.GEN_BACKDROP_MINES_FG,
    ];
  }
  if (s.includes('factory')) {
    return [
      ImageAssets.GEN_BACKDROP_FACTORY_SKY,
      ImageAssets.GEN_BACKDROP_FACTORY_MID,
      ImageAssets.GEN_BACKDROP_FACTORY_FORE,
      ImageAssets.GEN_BACKDROP_FACTORY_FG,
    ];
  }
  return null;
}

