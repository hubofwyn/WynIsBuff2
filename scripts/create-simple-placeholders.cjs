#!/usr/bin/env node

/**
 * Creates simple placeholder PNG files for missing assets
 * Uses a base64 encoded 1x1 transparent PNG that can be scaled
 */

const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG
const TRANSPARENT_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
);

// Simple colored 32x32 PNG placeholders (base64 encoded)
const COLORED_PLACEHOLDERS = {
    gray: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAARklEQVRYR+3WMQ4AIAhD0eL9Dw0jg4hGBhfj/4US+BUAkEqlP4BqZmaIGRFhZiIiImJmRISZ8TsiYiYzMyLCzMjMRESY2QM7HwQhT3cj9wAAAABJRU5ErkJggg==', 'base64'),
    gold: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAS0lEQVRYR+3WQQoAIAhE0an7HzpaRIugLdy9mP9XBT4DAJVKfwDVzMwQMyLCzEREREHMjIgwM35HRMxkZkZEmBmZmYgIM3sg5rbgBjEiBCHqPpJ8AAAAAElFTkSuQmCC', 'base64'),
    brown: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAS0lEQVRYR+3WMQ4AIAhD0eL9Dw0bdcHEwcX4v1ACvwIAKpX+AKqZmSFmRISZiYiIgpgZEWFm/I6ImMnMjIgwMzIzERFm9kDMbcENNiMEIZF8UBkAAAAASUVORK5CYII=', 'base64'),
    orange: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAS0lEQVRYR+3WQQoAIAhE0an7HzpaZIsgazH/rwp8BgAqlf4AqpmZIWZEhJmJiIiCmBkRYWb8joiYycyMiDAzMjMREWb2QMxtwQ1OIwQhP7EXXwAAAABJRU5ErkJggg==', 'base64')
};

// Large gradient backgrounds (simplified 100x100 that can be stretched)
const GRADIENT_BACKGROUNDS = {
    green: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAjklEQVR42u3RMQEAAAjDMMC/52ECvlRA00nqs3sAAAAAAAAAAAAAAAAAAAAAAIAb1oKyoKwFZS0oa0FZUNaCshaUtaCsBWUtKGtBWQvKWlDWgrIWlLWgrAVlLShrQVkLylpQ1oKyFpS1oKwFZS0oa0FZC8paUNaCshaUtaCsBWUtKGtBWQvKWlAAAAAAAACfBysGBCFz5j+fAAAAAElFTkSuQmCC', 'base64'),
    blue: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAjklEQVR42u3RMQEAAAjDMMC/52ECvlRA00nqs3sAAAAAAAAAAAAAAAAAAAAAAIAb1oISQQkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhQgkhAAAAAAAAAJ8HKo0EIeF+OvwAAAAASUVORK5CYII=', 'base64'),
    gray: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAjklEQVR42u3RMQEAAAjDMMC/52ECvlRA00nqs3sAAAAAAAAAAAAAAAAAAAAAAIAb1oIioqCIKCgiCoqIgiKioIgoKCIKioiCIqKgiCgoIgqKiIIioqCIKCgiCoqIgiKioIgoKCIKioiCIqKgiCgoIgqKiIIioqCIKCgiCoqIgiKiAAAAAAAAAJ8HKsYEIRJpJxgAAAAASUVORK5CYII=', 'base64'),
    dark: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAjklEQVR42u3RMQEAAAjDMMC/52ECvlRA00nqs3sAAAAAAAAAAAAAAAAAAAAAAIAb1gIFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFAAAAAAAAAJ8HKjEEIUa1oCUAAAAASUVORK5CYII=', 'base64')
};

// Define placeholder assets that need to be created
const placeholderAssets = [
    {
        path: 'assets/spritesheets/items/collectibles/dumbbell.png',
        data: COLORED_PLACEHOLDERS.gray
    },
    {
        path: 'assets/spritesheets/items/collectibles/chest.png',
        data: COLORED_PLACEHOLDERS.brown
    },
    {
        path: 'assets/images/backgrounds/buff-bg.png',
        data: GRADIENT_BACKGROUNDS.green
    },
    {
        path: 'assets/images/backgrounds/parallax-sky.png',
        data: GRADIENT_BACKGROUNDS.blue
    },
    {
        path: 'assets/images/backgrounds/parallax-mountains.png',
        data: GRADIENT_BACKGROUNDS.gray
    },
    {
        path: 'assets/images/backgrounds/parallax-foreground.png',
        data: GRADIENT_BACKGROUNDS.dark
    },
    {
        path: 'assets/images/particles/flares.png',
        data: TRANSPARENT_PNG
    },
    {
        path: 'assets/images/particles/white.png',
        data: TRANSPARENT_PNG
    },
    {
        path: 'assets/spritesheets/items/coin/coin.png',
        data: COLORED_PLACEHOLDERS.gold
    },
    {
        path: 'assets/spritesheets/items/collectibles/protein.png',
        data: COLORED_PLACEHOLDERS.orange
    }
];

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

console.log('🎨 Creating simple placeholder PNG assets...\n');

let created = 0;
let skipped = 0;

placeholderAssets.forEach(asset => {
    const fullPath = path.join(process.cwd(), asset.path);
    
    // Skip if file already exists
    if (fs.existsSync(fullPath)) {
        console.log(`✓ Exists: ${asset.path}`);
        skipped++;
        return;
    }
    
    ensureDirectoryExists(fullPath);
    fs.writeFileSync(fullPath, asset.data);
    console.log(`✅ Created: ${asset.path}`);
    created++;
});

console.log(`\n✨ Asset placeholders ready!`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files (already exist)`);
console.log('\nNote: These are minimal placeholders. Replace with proper assets for production.');