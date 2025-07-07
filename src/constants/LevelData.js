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
        
        // Player starting position - adjusted for larger sprite
        playerStart: { x: 100, y: 580 },
        
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
            
            // Additional challenge platforms
            { x: 1250, y: 450, width: 80, height: 20, color: 0x00FFFF },  // Post-boss bonus area
            { x: 1400, y: 400, width: 100, height: 20, color: 0x00FFFF }, // Final stretch
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
        
        // Boss configuration
        boss: {
            type: 'pulsating',
            x: 900,
            y: 370,  // Just above the boss platform
            size: 80
        },
        
        // Decorative elements to make level more interesting
        decorations: [
            // Motivational signs
            { x: 150, y: 550, type: 'text', text: 'GET BUFF!', style: { fontSize: '24px', color: '#FFD700' } },
            { x: 500, y: 450, type: 'text', text: 'KEEP GOING!', style: { fontSize: '20px', color: '#00FF00' } },
            { x: 800, y: 350, type: 'text', text: 'DANGER AHEAD!', style: { fontSize: '20px', color: '#FF0000' } },
            { x: 1200, y: 350, type: 'text', text: 'VICTORY!', style: { fontSize: '32px', color: '#FFD700' } },
            
            // Workout equipment decorations
            { x: 250, y: 650, type: 'emoji', emoji: '🏋️', scale: 1.5 },
            { x: 450, y: 650, type: 'emoji', emoji: '💪', scale: 1.5 },
            { x: 650, y: 650, type: 'emoji', emoji: '🥤', scale: 1.5 }, // Protein shake
            { x: 1300, y: 350, type: 'emoji', emoji: '🏆', scale: 2 }, // Trophy
            
            // Background gym equipment
            { x: 100, y: 650, type: 'rect', width: 30, height: 60, color: 0x666666 }, // Weight rack
            { x: 350, y: 650, type: 'rect', width: 40, height: 40, color: 0x888888 }, // Bench
        ],
        
        // Level completion trigger - moved past the boss
        completionTrigger: {
            x: 1150, y: 400, width: 60, height: 100,
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
    
    // Level 1 Scene 2: "Victory Lap" - After defeating the boss
    level1_scene2: {
        id: 'level1_scene2',
        name: 'Victory Lap',
        description: 'You dodged the boss! Time for a victory lap!',
        
        // Player starting position - left side of new scene
        playerStart: { x: 100, y: 580 },
        
        // Ground configuration
        ground: { width: 1600, height: 50, y: 700 },
        
        // Victory platforms - celebratory layout
        platforms: [
            // Stairway to victory
            { x: 250, y: 620, width: 120, height: 20, color: 0xFFD700 },  // Gold platform
            { x: 450, y: 540, width: 120, height: 20, color: 0xFFD700 },
            { x: 650, y: 460, width: 120, height: 20, color: 0xFFD700 },
            { x: 850, y: 380, width: 120, height: 20, color: 0xFFD700 },
            
            // Victory dance floor
            { x: 1100, y: 300, width: 300, height: 20, color: 0xFF69B4 }, // Pink party platform
            
            // Bonus collectible platforms
            { x: 300, y: 420, width: 80, height: 20, color: 0x00FFFF },
            { x: 500, y: 340, width: 80, height: 20, color: 0x00FFFF },
            { x: 700, y: 260, width: 80, height: 20, color: 0x00FFFF },
        ],
        
        // Celebratory moving platforms
        movingPlatforms: [
            {
                x: 950, y: 500, width: 100, height: 20, color: 0xFFFFFF,
                movement: { type: 'vertical', distance: 150, speed: 60 }
            }
        ],
        
        // Victory collectibles
        collectibles: [
            // Main path rewards
            { x: 250, y: 590, type: 'dumbbell', value: 50 },
            { x: 450, y: 510, type: 'dumbbell', value: 50 },
            { x: 650, y: 430, type: 'dumbbell', value: 50 },
            { x: 850, y: 350, type: 'dumbbell', value: 50 },
            
            // Bonus collectibles
            { x: 300, y: 390, type: 'protein', value: 100 },
            { x: 500, y: 310, type: 'protein', value: 100 },
            { x: 700, y: 230, type: 'protein', value: 100 },
            
            // Grand prize on victory platform
            { x: 1250, y: 250, type: 'dumbbell', value: 500 },
        ],
        
        // Celebratory decorations
        decorations: [
            // Victory messages
            { x: 512, y: 200, type: 'text', text: 'AWESOME DODGE!', style: { fontSize: '48px', color: '#FFD700' } },
            { x: 512, y: 250, type: 'text', text: 'Wyn is getting BUFF!', style: { fontSize: '32px', color: '#00FF00' } },
            
            // Celebration emojis
            { x: 200, y: 500, type: 'emoji', emoji: '🎉', scale: 2 },
            { x: 400, y: 400, type: 'emoji', emoji: '🏆', scale: 2 },
            { x: 600, y: 300, type: 'emoji', emoji: '💪', scale: 3 },
            { x: 800, y: 200, type: 'emoji', emoji: '🎊', scale: 2 },
            { x: 1000, y: 400, type: 'emoji', emoji: '🥳', scale: 2 },
            { x: 1200, y: 200, type: 'emoji', emoji: '🏅', scale: 3 },
            
            // Confetti effect (rectangles)
            { x: 300, y: 100, type: 'rect', width: 10, height: 20, color: 0xFF0000 },
            { x: 500, y: 150, type: 'rect', width: 10, height: 20, color: 0x00FF00 },
            { x: 700, y: 100, type: 'rect', width: 10, height: 20, color: 0x0000FF },
            { x: 900, y: 150, type: 'rect', width: 10, height: 20, color: 0xFFFF00 },
        ],
        
        // Level completion trigger
        completionTrigger: {
            x: 1400, y: 300, width: 100, height: 100,
            requireAllCollectibles: false
        },
        
        // Festive background
        background: {
            color: 0x1E90FF,  // Bright blue sky
            elements: []
        },
        
        // Victory UI
        ui: {
            instructionText: 'Celebrate your victory! Collect all the prizes!',
            themeColor: 0xFFD700
        },
        
        // No enemies or boss - this is a victory lap!
        enemies: [],
        boss: null
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
    return ['level1', 'level1_scene2', 'level2', 'level3'];
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
    // Handle special scene transitions
    if (currentLevelId === 'level1') {
        // This is handled by the SCENE_TRANSITION event
        return 'level1_scene2';
    }
    
    const levelIds = getLevelIds();
    const currentIndex = levelIds.indexOf(currentLevelId);
    
    if (currentIndex === -1 || currentIndex === levelIds.length - 1) {
        return null;
    }
    
    return levelIds[currentIndex + 1];
}