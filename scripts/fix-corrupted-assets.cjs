#!/usr/bin/env node
/**
 * Fix Corrupted Assets Script
 * Creates proper replacement assets for corrupted/placeholder images
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Asset specifications
const ASSET_SPECS = {
  'parallax-sky': {
    width: 1024,
    height: 768,
    colors: ['#87CEEB', '#4682B4', '#1e3a8a'], // Sky blue gradient
    description: 'Sky background with gradient'
  },
  'parallax-mountains': {
    width: 1024,
    height: 400,
    colors: ['#8B4513', '#A0522D', '#654321'], // Mountain brown tones
    description: 'Mountain silhouettes'
  },
  'parallax-foreground': {
    width: 1024,
    height: 200,
    colors: ['#228B22', '#32CD32', '#006400'], // Grass green tones
    description: 'Foreground elements'
  },
  'buff-bg': {
    width: 1024,
    height: 768,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], // Energetic buff colors
    description: 'Main buff-themed background'
  }
};

/**
 * Create a gradient background canvas
 */
function createGradientBackground(spec) {
  const canvas = createCanvas(spec.width, spec.height);
  const ctx = canvas.getContext('2d');
  
  // Create vertical gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, spec.height);
  spec.colors.forEach((color, index) => {
    gradient.addColorStop(index / (spec.colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, spec.width, spec.height);
  
  return canvas;
}

/**
 * Create mountain silhouette
 */
function createMountains(spec) {
  const canvas = createCanvas(spec.width, spec.height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, spec.height);
  bgGradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)'); // Light sky
  bgGradient.addColorStop(1, 'rgba(25, 25, 112, 0.1)');   // Dark sky
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, spec.width, spec.height);
  
  // Draw mountain silhouettes
  ctx.fillStyle = spec.colors[0];
  ctx.beginPath();
  ctx.moveTo(0, spec.height);
  
  // Generate mountain peaks
  for (let x = 0; x <= spec.width; x += 50) {
    const peakHeight = Math.random() * 150 + 100;
    ctx.lineTo(x, spec.height - peakHeight);
  }
  
  ctx.lineTo(spec.width, spec.height);
  ctx.closePath();
  ctx.fill();
  
  return canvas;
}

/**
 * Create foreground elements
 */
function createForeground(spec) {
  const canvas = createCanvas(spec.width, spec.height);
  const ctx = canvas.getContext('2d');
  
  // Semi-transparent so it works as overlay
  ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
  
  // Create grass-like shapes
  for (let x = 0; x < spec.width; x += 20) {
    const grassHeight = Math.random() * 80 + 40;
    ctx.fillRect(x, spec.height - grassHeight, 15, grassHeight);
  }
  
  return canvas;
}

/**
 * Create buff-themed background
 */
function createBuffBackground(spec) {
  const canvas = createCanvas(spec.width, spec.height);
  const ctx = canvas.getContext('2d');
  
  // Dynamic gradient background
  const gradient = ctx.createRadialGradient(
    spec.width/2, spec.height/2, 0,
    spec.width/2, spec.height/2, Math.max(spec.width, spec.height)/2
  );
  
  gradient.addColorStop(0, spec.colors[0]);
  gradient.addColorStop(0.5, spec.colors[1]);
  gradient.addColorStop(1, spec.colors[2]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, spec.width, spec.height);
  
  // Add some energy effects (circles)
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * spec.width;
    const y = Math.random() * spec.height;
    const radius = Math.random() * 50 + 10;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = spec.colors[Math.floor(Math.random() * spec.colors.length)];
    ctx.fill();
  }
  
  return canvas;
}

/**
 * Main function to fix corrupted assets
 */
async function fixCorruptedAssets() {
  console.log('[AssetFixer] Fixing corrupted assets...');
  
  const assetsDir = path.join(process.cwd(), 'assets', 'images', 'backgrounds');
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create each asset
  for (const [assetName, spec] of Object.entries(ASSET_SPECS)) {
    const filename = `${assetName}.png`;
    const filepath = path.join(assetsDir, filename);
    
    console.log(`[AssetFixer] Creating ${filename} (${spec.width}x${spec.height})...`);
    
    let canvas;
    
    switch (assetName) {
      case 'parallax-mountains':
        canvas = createMountains(spec);
        break;
      case 'parallax-foreground':
        canvas = createForeground(spec);
        break;
      case 'buff-bg':
        canvas = createBuffBackground(spec);
        break;
      default:
        canvas = createGradientBackground(spec);
        break;
    }
    
    // Write to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    
    console.log(`[AssetFixer] ✓ Created ${filename} (${buffer.length} bytes)`);
  }
  
  console.log('[AssetFixer] All corrupted assets fixed!');
}

// Check if canvas is available
try {
  require('canvas');
  fixCorruptedAssets().catch(error => {
    console.error('[AssetFixer] Error:', error.message);
    console.log('[AssetFixer] Falling back to simple placeholder creation...');
    createSimplePlaceholders();
  });
} catch (error) {
  console.log('[AssetFixer] Canvas not available, creating simple placeholders...');
  createSimplePlaceholders();
}

/**
 * Fallback: Create simple solid color placeholders
 */
function createSimplePlaceholders() {
  console.log('[AssetFixer] Creating simple placeholder assets...');
  
  const assetsDir = path.join(process.cwd(), 'assets', 'images', 'backgrounds');
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create simple SVG placeholders that will work reliably
  const svgTemplates = {
    'parallax-sky': {
      width: 1024,
      height: 768,
      color: '#87CEEB',
      name: 'Sky Background'
    },
    'parallax-mountains': {
      width: 1024,
      height: 400,
      color: '#8B4513',
      name: 'Mountains'
    },
    'parallax-foreground': {
      width: 1024,
      height: 200,
      color: '#228B22',
      name: 'Foreground'
    },
    'buff-bg': {
      width: 1024,
      height: 768,
      color: '#FF6B6B',
      name: 'Buff Background'
    }
  };
  
  Object.entries(svgTemplates).forEach(([assetName, spec]) => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${spec.color}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
        font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.7">
    ${spec.name}
  </text>
</svg>`;
    
    const filepath = path.join(assetsDir, `${assetName}.svg`);
    fs.writeFileSync(filepath, svgContent);
    console.log(`[AssetFixer] ✓ Created ${assetName}.svg placeholder`);
  });
  
  console.log('[AssetFixer] Simple placeholders created!');
}