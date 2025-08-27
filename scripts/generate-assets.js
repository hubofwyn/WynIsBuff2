#!/usr/bin/env node

/**
 * Generate assets.js constants file from assets/manifest.json
 * 
 * This script reads the asset manifest and generates a constants file
 * that can be imported and used throughout the game to avoid hard-coded
 * asset keys and paths.
 * 
 * Usage: node scripts/generate-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../assets/manifest.json');
const OUTPUT_PATH = path.join(__dirname, '../src/constants/Assets.js');

function generateAssetsConstants() {
    try {
        console.log('📦 Generating assets constants...');
        
        // Read the manifest file
        const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
        const manifest = JSON.parse(manifestData);
        
        // Generate the constants file content
        let output = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from assets/manifest.json by scripts/generate-assets.js
// Run 'npm run generate-assets' to regenerate this file

/**
 * Asset constants generated from manifest.json
 * Use these constants instead of hard-coded asset keys
 */

`;

        // Generate image constants
        output += `export const ImageAssets = Object.freeze({\n`;
        
        const images = manifest.assets.images;
        for (const [key, asset] of Object.entries(images)) {
            const constName = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${key}',\n`;
        }
        
        output += `});\n\n`;

        // Generate image paths
        output += `export const ImagePaths = Object.freeze({\n`;
        
        for (const [key, asset] of Object.entries(images)) {
            const constName = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${asset.path}',\n`;
        }
        
        output += `});\n\n`;

        // Generate audio constants
        output += `export const AudioAssets = Object.freeze({\n`;
        
        // Music
        const music = manifest.assets.audio.music;
        output += `  // Music\n`;
        for (const [key, asset] of Object.entries(music)) {
            const constName = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${key}',\n`;
        }
        
        // SFX variants
        const sfx = manifest.assets.audio.sfx;
        output += `\n  // Sound Effects\n`;
        
        // Handle land SFX
        sfx.land.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.key}',\n`;
        });
        
        // Handle pickup SFX
        sfx.pickup.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.key}',\n`;
        });
        
        // Handle UI SFX
        sfx.ui.click.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.key}',\n`;
        });
        
        sfx.ui.hover.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.key}',\n`;
        });
        
        // Handle special SFX if present
        if (sfx.special) {
            sfx.special.forEach((sound, index) => {
                const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
                output += `  ${constName}: '${sound.key}',\n`;
            });
        }
        
        output += `});\n\n`;

        // Generate audio paths
        output += `export const AudioPaths = Object.freeze({\n`;
        
        // Music paths
        for (const [key, asset] of Object.entries(music)) {
            const constName = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${asset.path}',\n`;
        }
        
        // SFX paths
        sfx.land.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.path}',\n`;
        });
        
        sfx.pickup.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.path}',\n`;
        });
        
        sfx.ui.click.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.path}',\n`;
        });
        
        sfx.ui.hover.forEach((sound, index) => {
            const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
            output += `  ${constName}: '${sound.path}',\n`;
        });
        
        // Handle special SFX paths if present
        if (sfx.special) {
            sfx.special.forEach((sound, index) => {
                const constName = sound.key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
                output += `  ${constName}: '${sound.path}',\n`;
            });
        }
        
        output += `});\n\n`;

        // Generate spritesheet configs
        output += `export const SpritesheetConfigs = Object.freeze({\n`;
        
        for (const [key, asset] of Object.entries(images)) {
            if (asset.type === 'spritesheet') {
                const constName = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
                output += `  ${constName}: {\n`;
                output += `    frameWidth: ${asset.frameWidth},\n`;
                output += `    frameHeight: ${asset.frameHeight},\n`;
                output += `    margin: ${asset.margin},\n`;
                output += `    spacing: ${asset.spacing}\n`;
                output += `  },\n`;
            }
        }
        
        output += `});\n\n`;

        // Generate convenience functions
        output += `/**
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
`;

        // Write the output file
        fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
        
        console.log(`✅ Generated assets constants: ${OUTPUT_PATH}`);
        console.log(`📊 Generated ${Object.keys(manifest.assets.images).length} image assets`);
        console.log(`🎵 Generated ${Object.keys(manifest.assets.audio.music).length} music assets`);
        
        // Count SFX
        let sfxCount = 0;
        sfxCount += manifest.assets.audio.sfx.land.length;
        sfxCount += manifest.assets.audio.sfx.pickup.length;
        sfxCount += manifest.assets.audio.sfx.ui.click.length;
        sfxCount += manifest.assets.audio.sfx.ui.hover.length;
        if (manifest.assets.audio.sfx.special) {
            sfxCount += manifest.assets.audio.sfx.special.length;
        }
        
        console.log(`🔊 Generated ${sfxCount} sound effect assets`);
        
    } catch (error) {
        console.error('❌ Error generating assets constants:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateAssetsConstants();