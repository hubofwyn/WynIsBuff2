/**
 * Level data configurations for WynIsBuff2
 * Based on the MVP Level Design Guide
 */
export const LevelData = {
    // Level 1: "First Steps" - Basic movement and single jumps
    level1: {
        id: 'level1',
        name: 'First Steps',
        description: 'Learn basic movement and single jumps',
        
        // Player starting position
        playerStart: { x: 100, y: 600 },
        
        // Ground configuration
        ground: { width: 1024, height: 50, y: 700 },
        
        // Static platforms - dynamic layout for action-packed gameplay
        platforms: [
            // Starting section - basic jumps
            { x: 200, y: 640, width: 150, height: 20, color: 0x00AA00 },  // First jump
            { x: 400, y: 580, width: 120, height: 20, color: 0x00AA00 },  // Higher jump
            
            // Mid section - requires momentum
            { x: 600, y: 520, width: 100, height: 20, color: 0x00BB00 },  // Smaller platform
            { x: 750, y: 460, width: 80, height: 20, color: 0x00CC00 },   // Even smaller
            
            // Challenge section - requires skill
            { x: 900, y: 400, width: 120, height: 20, color: 0x00DD00 },  // Boss platform
            { x: 1050, y: 350, width: 100, height: 20, color: 0x00FF00 }, // Victory platform
            
            // Bonus platforms for collectibles
            { x: 300, y: 500, width: 60, height: 15, color: 0x44AA44 },   // Optional collectible platform
            { x: 850, y: 550, width: 60, height: 15, color: 0x44AA44 },   // Another optional
        ],
        
        // No moving platforms in level 1
        movingPlatforms: [],
        
        // Collectibles placed to encourage exploration and skillful jumping
        collectibles: [
            // Main path collectibles
            { x: 200, y: 610, type: 'protein', value: 10 },      // On first platform
            { x: 400, y: 550, type: 'protein', value: 10 },      // On second platform
            { x: 600, y: 490, type: 'protein', value: 15 },      // Requires precision
            { x: 750, y: 430, type: 'protein', value: 15 },      // On small platform
            
            // Bonus collectibles on optional platforms
            { x: 300, y: 470, type: 'protein', value: 25 },      // Bonus platform reward
            { x: 850, y: 520, type: 'protein', value: 25 },      // Another bonus
            
            // Final rewards
            { x: 1050, y: 320, type: 'dumbbell', value: 50 },    // Victory platform
            { x: 950, y: 250, type: 'dumbbell', value: 100 },    // Secret high jump reward
        ],
        
        // Level completion trigger - moved past the boss
        completionTrigger: {
            x: 1100, y: 400, width: 60, height: 100,
            requireAllCollectibles: false
        },
        
        // Background elements
        background: {
            color: 0x87CEEB,      // Sky blue fallback
            image: 'buff-bg',     // Buff-themed background image key
            elements: [],
            layers: [             // Parallax layers: key and scrollFactor
                { key: 'parallax-sky', scrollFactor: 0.2 },
                { key: 'parallax-mountains', scrollFactor: 0.5 },
                { key: 'parallax-foreground', scrollFactor: 0.8 }
            ]
        },
        
        // UI elements specific to this level
        ui: {
            instructionText: 'Get Buff! Use WASD or Arrow Keys to pump up and SPACE to jump!',
            themeColor: 0xFFFF00    // Vibrant UI accent for buff theme
        },
        environment: {
            theme: 'wyn-is-buff'
        },
        // Boss enemy - jumping boss at the top of the level
        boss: {
            x: 900,              // X position near the end platforms
            y: 350,              // Y position - higher up, at "top" of level
            key: 'axelface',     // Sprite key for the boss
            type: 'jumping',     // Boss behavior type
            active: true         // Boss is active in this level
        },
        
        // Regular enemies (none for level 1 - boss is the main challenge)
        enemies: []
    },
    
    // Level 2: "Double Trouble" - Introducing double jump
    level2: {
        id: 'level2',
        name: 'Double Trouble',
        description: 'Master the double jump technique',
        
        // Player starting position
        playerStart: { x: 100, y: 600 },
        
        // Ground configuration
        ground: { width: 1024, height: 50, y: 700 },
        
        // Static platforms - gaps too wide for single jump
        platforms: [
            { x: 150, y: 650, width: 200, height: 20, color: 0x00AA00 },  // Green - Starting platform
            { x: 450, y: 650, width: 200, height: 20, color: 0xAAAA00 },  // Yellow - Requires double jump to reach
            { x: 750, y: 650, width: 200, height: 20, color: 0xAAAA00 },  // Yellow - Another double jump
            { x: 900, y: 550, width: 150, height: 20, color: 0xAAAA00 },  // Yellow - Higher platform
        ],
        
        // No moving platforms in level 2
        movingPlatforms: [],
        
        // Collectibles placed in positions requiring double jump
        collectibles: [
            { x: 300, y: 600, type: 'protein', value: 10 },  // Between platforms, requires jump
            { x: 600, y: 600, type: 'protein', value: 10 },  // Between platforms, requires jump
            { x: 825, y: 600, type: 'protein', value: 10 },  // Above platform
            { x: 900, y: 520, type: 'dumbbell', value: 50 },  // On the final platform
        ],
        
        // Level completion trigger
        completionTrigger: {
            x: 900, y: 520, width: 50, height: 50,
            requireAllCollectibles: true
        },
        
        // Background elements
        background: {
            color: 0x87CEEB,  // Sky blue
            elements: []
        },
        
        // UI elements specific to this level
        ui: {
            instructionText: 'Press SPACE twice for a double jump!'
        }
    },
    
    // Level 3: "Triple Threat" - Mastering triple jump
    level3: {
        id: 'level3',
        name: 'Triple Threat',
        description: 'Master the triple jump to reach new heights',
        
        // Player starting position
        playerStart: { x: 100, y: 600 },
        
        // Ground configuration
        ground: { width: 1024, height: 50, y: 700 },
        
        // Static platforms - vertical challenge requiring triple jump
        platforms: [
            { x: 150, y: 650, width: 200, height: 20, color: 0x00AA00 },  // Green - Starting platform
            { x: 350, y: 550, width: 150, height: 20, color: 0xAAAA00 },  // Yellow - Second jump
            { x: 550, y: 450, width: 150, height: 20, color: 0xAA0000 },  // Red - Third jump
            { x: 750, y: 350, width: 150, height: 20, color: 0xAA0000 },  // Red - Requires triple jump
            { x: 900, y: 250, width: 150, height: 20, color: 0xAA0000 },  // Red - Final platform
        ],
        
        // No moving platforms in level 3
        movingPlatforms: [],
        
        // Collectibles placed to encourage triple jumps
        collectibles: [
            { x: 250, y: 600, type: 'protein', value: 10 },  // On first platform
            { x: 350, y: 520, type: 'protein', value: 10 },  // On second platform
            { x: 550, y: 420, type: 'protein', value: 10 },  // On third platform
            { x: 750, y: 320, type: 'protein', value: 10 },  // On fourth platform
            { x: 900, y: 220, type: 'dumbbell', value: 50 },  // On final platform
        ],
        
        // Level completion trigger
        completionTrigger: {
            x: 900, y: 220, width: 50, height: 50,
            requireAllCollectibles: true
        },
        
        // Background elements
        background: {
            color: 0x87CEEB,  // Sky blue
            elements: []
        },
        
        // UI elements specific to this level
        ui: {
            instructionText: 'Press SPACE three times for a triple jump!'
        }
    },
    
    // Level 4: "Momentum Master" - Combining horizontal movement with jumps
    level4: {
        id: 'level4',
        name: 'Momentum Master',
        description: 'Use momentum and timing to navigate moving platforms',
        
        // Player starting position
        playerStart: { x: 100, y: 600 },
        
        // Ground configuration
        ground: { width: 1024, height: 50, y: 700 },
        
        // Static platforms
        platforms: [
            { x: 150, y: 650, width: 200, height: 20, color: 0x00AA00 },  // Green - Starting platform
            { x: 900, y: 650, width: 200, height: 20, color: 0xAA0000 },  // Red - Final platform
        ],
        
        // Moving platforms
        movingPlatforms: [
            { 
                x: 350, y: 650, width: 100, height: 20, color: 0xAAAA00,
                movement: { type: 'horizontal', distance: 100, speed: 100 }
            },
            { 
                x: 550, y: 550, width: 100, height: 20, color: 0xAAAA00,
                movement: { type: 'vertical', distance: 100, speed: 80 }
            },
            { 
                x: 750, y: 650, width: 100, height: 20, color: 0xAAAA00,
                movement: { type: 'horizontal', distance: 100, speed: 120 }
            },
        ],
        
        // Collectibles placed to encourage timing and momentum
        collectibles: [
            { x: 350, y: 620, type: 'protein', value: 10 },  // Above first moving platform
            { x: 550, y: 520, type: 'protein', value: 10 },  // Above second moving platform
            { x: 750, y: 620, type: 'protein', value: 10 },  // Above third moving platform
            { x: 900, y: 620, type: 'dumbbell', value: 50 },  // On final platform
        ],
        
        // Level completion trigger
        completionTrigger: {
            x: 900, y: 620, width: 50, height: 50,
            requireAllCollectibles: true
        },
        
        // Background elements
        background: {
            color: 0x87CEEB,  // Sky blue
            elements: []
        },
        
        // UI elements specific to this level
        ui: {
            instructionText: 'Time your jumps with the moving platforms!'
        }
    },
    
    // Level 5: "The Gauntlet" - Combining all learned skills
    level5: {
        id: 'level5',
        name: 'The Gauntlet',
        description: 'Put all your skills to the test',
        
        // Player starting position
        playerStart: { x: 100, y: 600 },
        
        // Ground configuration
        ground: { width: 1024, height: 50, y: 700 },
        
        // Static platforms - complex combination of all previous challenges
        platforms: [
            { x: 150, y: 650, width: 200, height: 20, color: 0x00AA00 },  // Green - Starting platform
            { x: 900, y: 250, width: 150, height: 20, color: 0xAA0000 },  // Red - Final platform
        ],
        
        // Moving platforms - mix of horizontal and vertical
        movingPlatforms: [
            { 
                x: 350, y: 600, width: 100, height: 20, color: 0xAAAA00,
                movement: { type: 'horizontal', distance: 100, speed: 100 }
            },
            { 
                x: 550, y: 500, width: 100, height: 20, color: 0xAAAA00,
                movement: { type: 'vertical', distance: 100, speed: 80 }
            },
            { 
                x: 750, y: 400, width: 100, height: 20, color: 0xAA0000,
                movement: { type: 'horizontal', distance: 100, speed: 120 }
            },
            { 
                x: 850, y: 300, width: 100, height: 20, color: 0xAA0000,
                movement: { type: 'vertical', distance: 50, speed: 150 }
            },
        ],
        
        // Collectibles placed to test all skills
        collectibles: [
            { x: 350, y: 570, type: 'protein', value: 10 },  // Above first moving platform
            { x: 550, y: 470, type: 'protein', value: 10 },  // Above second moving platform
            { x: 750, y: 370, type: 'protein', value: 10 },  // Above third moving platform
            { x: 850, y: 270, type: 'protein', value: 10 },  // Above fourth moving platform
            { x: 900, y: 220, type: 'dumbbell', value: 100 },  // On final platform
        ],
        
        // Level completion trigger
        completionTrigger: {
            x: 900, y: 220, width: 50, height: 50,
            requireAllCollectibles: true
        },
        
        // Background elements
        background: {
            color: 0x87CEEB,  // Sky blue
            elements: []
        },
        
        // UI elements specific to this level
        ui: {
            instructionText: 'Use all your skills to reach the top!'
        }
    }
};

/**
 * Get all level IDs in order
 * @returns {Array} Array of level IDs
 */
export function getLevelIds() {
    return ['level1', 'level2', 'level3'];
}

/**
 * Get a level configuration by ID
 * @param {string} levelId - The level ID
 * @returns {Object} The level configuration
 */
export function getLevelById(levelId) {
    return LevelData[levelId];
}

/**
 * Get the next level ID
 * @param {string} currentLevelId - The current level ID
 * @returns {string|null} The next level ID or null if there is no next level
 */
export function getNextLevelId(currentLevelId) {
    const levelIds = getLevelIds();
    const currentIndex = levelIds.indexOf(currentLevelId);
    
    if (currentIndex === -1 || currentIndex === levelIds.length - 1) {
        return null;
    }
    
    return levelIds[currentIndex + 1];
}