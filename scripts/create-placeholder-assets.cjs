#!/usr/bin/env node

/**
 * Creates placeholder assets for missing files to ensure the game can run
 * These should be replaced with proper assets later
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Define placeholder assets that need to be created
const placeholderAssets = [
    {
        path: 'assets/spritesheets/items/collectibles/dumbbell.png',
        type: 'sprite',
        width: 32,
        height: 32,
        color: '#888888',
        label: 'DB'
    },
    {
        path: 'assets/spritesheets/items/collectibles/chest.png',
        type: 'sprite',
        width: 32,
        height: 32,
        color: '#8B4513',
        label: 'CH'
    },
    {
        path: 'assets/images/backgrounds/buff-bg.png',
        type: 'background',
        width: 800,
        height: 600,
        gradient: ['#2E7D32', '#81C784']
    },
    {
        path: 'assets/images/backgrounds/parallax-sky.png',
        type: 'background',
        width: 800,
        height: 300,
        gradient: ['#87CEEB', '#E0F6FF']
    },
    {
        path: 'assets/images/backgrounds/parallax-mountains.png',
        type: 'background',
        width: 800,
        height: 400,
        gradient: ['#4A5568', '#718096']
    },
    {
        path: 'assets/images/backgrounds/parallax-foreground.png',
        type: 'background',
        width: 800,
        height: 200,
        gradient: ['#2D3748', '#1A202C']
    },
    {
        path: 'assets/images/particles/flares.png',
        type: 'particle',
        width: 64,
        height: 64,
        shapes: ['circle', 'star']
    },
    {
        path: 'assets/spritesheets/items/coin/coin.png',
        type: 'sprite',
        width: 16,
        height: 16,
        color: '#FFD700',
        label: '$'
    },
    {
        path: 'assets/spritesheets/items/collectibles/protein.png',
        type: 'sprite',
        width: 32,
        height: 32,
        color: '#FFA500',
        label: 'P'
    }
];

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function createSpriteAsset(config) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);
    
    // Draw placeholder sprite
    ctx.fillStyle = config.color;
    ctx.fillRect(2, 2, config.width - 4, config.height - 4);
    
    // Add label if provided
    if (config.label) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.floor(config.height * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.label, config.width / 2, config.height / 2);
    }
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, config.width - 2, config.height - 2);
    
    return canvas.toBuffer('image/png');
}

function createBackgroundAsset(config) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
    gradient.addColorStop(0, config.gradient[0]);
    gradient.addColorStop(1, config.gradient[1]);
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Add some texture
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * config.width;
        const y = Math.random() * config.height;
        const size = Math.random() * 100 + 50;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
    }
    
    return canvas.toBuffer('image/png');
}

function createParticleAsset(config) {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);
    
    // Draw white circle (can be tinted in-game)
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(config.width, config.height) / 2 - 2;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toBuffer('image/png');
}

// Check if canvas is available, if not create simple placeholder files
try {
    const { createCanvas } = require('canvas');
    
    console.log('🎨 Creating placeholder assets with canvas...\n');
    
    placeholderAssets.forEach(asset => {
        const fullPath = path.join(process.cwd(), asset.path);
        
        // Skip if file already exists
        if (fs.existsSync(fullPath)) {
            console.log(`✓ Exists: ${asset.path}`);
            return;
        }
        
        ensureDirectoryExists(fullPath);
        
        let buffer;
        switch (asset.type) {
            case 'sprite':
                buffer = createSpriteAsset(asset);
                break;
            case 'background':
                buffer = createBackgroundAsset(asset);
                break;
            case 'particle':
                buffer = createParticleAsset(asset);
                break;
            default:
                buffer = createSpriteAsset(asset);
        }
        
        fs.writeFileSync(fullPath, buffer);
        console.log(`✅ Created: ${asset.path}`);
    });
    
    console.log('\n✨ Placeholder assets created successfully!');
    console.log('Note: These are temporary placeholders. Replace with proper assets for production.');
    
} catch (error) {
    // If canvas module is not available, create simple text files as placeholders
    console.log('📝 Canvas module not available. Creating text placeholder files...\n');
    
    placeholderAssets.forEach(asset => {
        const fullPath = path.join(process.cwd(), asset.path);
        
        // Skip if file already exists
        if (fs.existsSync(fullPath)) {
            console.log(`✓ Exists: ${asset.path}`);
            return;
        }
        
        ensureDirectoryExists(fullPath);
        
        // Create a simple text file as placeholder
        const content = `PLACEHOLDER: ${path.basename(asset.path)}\nType: ${asset.type}\nSize: ${asset.width}x${asset.height}\n\nReplace this with a proper asset file.`;
        fs.writeFileSync(fullPath, content);
        console.log(`📄 Created text placeholder: ${asset.path}`);
    });
    
    console.log('\n⚠️ Text placeholders created. Install canvas module for proper placeholder images:');
    console.log('  npm install canvas');
}