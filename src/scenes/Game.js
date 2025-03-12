import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        
        console.log('[Game] Constructor called');
        
        // Properties for tracking game objects
        this.playerBody = null;
        this.playerSprite = null;
        this.isOnGround = false;
        this.jumpsUsed = 0;
        this.maxJumps = 3;
        this.platforms = [];
        this.jumpText = null;
        this.rapierWorld = null;
        this.rapierInitialized = false;
        
        // Mapping to track physics bodies to sprites
        this.bodyToSprite = new Map();
    }

    preload() {
        console.log('[Game] Preload called');
    }

    async create() {
        console.log('[Game] Create method started');
        
        try {
            // Initialize Rapier physics
            console.log('[Game] Initializing Rapier...');
            await RAPIER.init();
            console.log('[Game] Rapier initialized successfully');
            
            // Create physics world with gravity
            this.rapierWorld = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));
            console.log('[Game] Rapier world created');
            this.rapierInitialized = true;

            // Set the background
            this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue
            if (this.textures.exists('background')) {
                this.add.image(512, 384, 'background').setAlpha(0.5);
                console.log('[Game] Background image added');
            } else {
                console.warn('[Game] Background texture not found');
            }

            // Add instructions text
            this.add.text(512, 100, 'WASD or Arrows to Move, SPACE to Jump (Triple Jump!)', {
                fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
                stroke: '#000000', strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            console.log('[Game] Instructions text added');
            
            // Display jump counter
            this.jumpText = this.add.text(512, 150, 'Jumps Used: 0 / 3', {
                fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
                stroke: '#000000', strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            console.log('[Game] Jump counter text added');

            // Create ground, platforms, and player
            this.createGround();
            this.createPlatforms();
            this.createPlayer();
            
            // Setup keyboard controls
            this.setupControls();
            
            console.log('[Game] Create method completed successfully');
        } catch (error) {
            console.error('[Game] Error in create method:', error);
            // Display error on screen for easier debugging
            this.add.text(512, 400, 'ERROR: ' + error.message, {
                fontFamily: 'Arial', fontSize: 16, color: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);
        }
    }

    setupControls() {
        try {
            // Set up arrow keys
            this.cursors = this.input.keyboard.createCursorKeys();
            console.log('[Game] Arrow keys set up');
            
            // Set up WASD keys
            this.wasd = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            console.log('[Game] WASD keys set up');

            // Add space key separately for jump
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            console.log('[Game] Space key set up');

            // Add ESC key for scene transition
            this.input.keyboard.once('keydown-ESC', () => {
                console.log('[Game] ESC pressed, transitioning to GameOver scene');
                this.scene.start('GameOver');
            });
        } catch (error) {
            console.error('[Game] Error in setupControls:', error);
        }
    }
    
    createGround() {
        try {
            console.log('[Game] Creating ground...');
            
            // Define ground dimensions
            const groundWidth = 1024;
            const groundHeight = 50;
            const groundY = 700;
            
            // Create a visual representation of the ground
            const groundSprite = this.add.rectangle(
                512, groundY, groundWidth, groundHeight, 0x654321
            );
            console.log('[Game] Ground sprite created');
            
            // Create a fixed (static) rigid body for the ground
            const groundBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(512, groundY);
            
            const groundBody = this.rapierWorld.createRigidBody(groundBodyDesc);
            console.log('[Game] Ground body created');
            
            // Store the association between body and sprite
            this.bodyToSprite.set(groundBody.handle, groundSprite);
            
            // Create a collider (hitbox) for the ground
            const groundColliderDesc = RAPIER.ColliderDesc
                .cuboid(groundWidth / 2, groundHeight / 2)
                .setRestitution(0.0); // No bounce
                
            this.rapierWorld.createCollider(groundColliderDesc, groundBody);
            console.log('[Game] Ground collider created');
        } catch (error) {
            console.error('[Game] Error in createGround:', error);
        }
    }
    
    createPlatforms() {
        try {
            console.log('[Game] Creating platforms...');
            
            // Define platform properties
            const platforms = [
                { x: 200, y: 500, width: 200, height: 20, color: 0x00AA00 },  // Green platform
                { x: 600, y: 400, width: 200, height: 20, color: 0xAA00AA },  // Purple platform
                { x: 400, y: 300, width: 200, height: 20, color: 0xAAAA00 }   // Yellow platform
            ];
            
            // Store created platforms for later reference
            this.platforms = [];
            
            // Create each platform
            platforms.forEach((platform, index) => {
                try {
                    console.log(`[Game] Creating platform ${index+1}`);
                    
                    // Create a visual representation
                    const platformSprite = this.add.rectangle(
                        platform.x, platform.y,
                        platform.width, platform.height,
                        platform.color
                    );
                    
                    // Create a fixed rigid body for the platform
                    const platformBodyDesc = RAPIER.RigidBodyDesc.fixed()
                        .setTranslation(platform.x, platform.y);
                    
                    const platformBody = this.rapierWorld.createRigidBody(platformBodyDesc);
                    
                    // Store the association between body and sprite
                    this.bodyToSprite.set(platformBody.handle, platformSprite);
                    
                    // Create a collider for the platform
                    const platformColliderDesc = RAPIER.ColliderDesc
                        .cuboid(platform.width / 2, platform.height / 2)
                        .setRestitution(0.0);
                        
                    const platformCollider = this.rapierWorld.createCollider(
                        platformColliderDesc, 
                        platformBody
                    );
                    
                    // Store platform info
                    this.platforms.push({
                        body: platformBody,
                        sprite: platformSprite,
                        collider: platformCollider
                    });
                    
                    console.log(`[Game] Platform ${index+1} created successfully`);
                } catch (error) {
                    console.error(`[Game] Error creating platform ${index+1}:`, error);
                }
            });
        } catch (error) {
            console.error('[Game] Error in createPlatforms:', error);
        }
    }
    
    createPlayer() {
        try {
            console.log('[Game] Creating player...');
            
            // Define player starting position
            const playerStartX = 512;
            const playerStartY = 300;
            
            // Player dimensions
            const playerWidth = 32;
            const playerHeight = 32;
            
            // Create a visual representation of the player
            if (this.textures.exists('player')) {
                console.log('[Game] Using player sprite texture');
                this.playerSprite = this.add.sprite(playerStartX, playerStartY, 'player', 0);
                this.playerSprite.setDisplaySize(playerWidth, playerHeight);
            } else {
                console.log('[Game] Player texture not found, using rectangle');
                this.playerSprite = this.add.rectangle(
                    playerStartX, playerStartY, playerWidth, playerHeight, 0x0000ff
                );
            }
            
            // Create a dynamic rigid body for the player
            const playerBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(playerStartX, playerStartY);
            
            this.playerBody = this.rapierWorld.createRigidBody(playerBodyDesc);
            console.log('[Game] Player body created');
            
            // Store the association between body and sprite
            this.bodyToSprite.set(this.playerBody.handle, this.playerSprite);
            
            // Create a collider (hitbox) for the player
            const playerColliderDesc = RAPIER.ColliderDesc
                .cuboid(playerWidth / 2, playerHeight / 2)
                .setDensity(1.0)
                .setRestitution(0.0); // No bounce
                
            this.playerCollider = this.rapierWorld.createCollider(
                playerColliderDesc,
                this.playerBody
            );
            
            console.log('[Game] Player created successfully');
        } catch (error) {
            console.error('[Game] Error in createPlayer:', error);
        }
    }

    update() {
        // Only proceed if Rapier is initialized
        if (!this.rapierInitialized || !this.rapierWorld) {
            return;
        }
        
        try {
            // Step the physics world
            this.rapierWorld.step();
            
            // Update sprites based on physics bodies
            this.updateGameObjects();
            
            // Process collisions to detect ground contact
            this.processCollisions();
            
            // Handle player movement and jumping
            if (this.playerBody) {
                this.handlePlayerMovement();
                this.handleJumping();
            }
        } catch (error) {
            console.error('[Game] Error in update:', error);
        }
    }
    
    updateGameObjects() {
        try {
            // Update all sprites based on their physics bodies
            this.rapierWorld.bodies.forEach(body => {
                const sprite = this.bodyToSprite.get(body.handle);
                
                if (sprite) {
                    const position = body.translation();
                    const rotation = body.rotation();
                    
                    sprite.x = position.x;
                    sprite.y = position.y;
                    sprite.rotation = rotation;
                }
            });
        } catch (error) {
            console.error('[Game] Error in updateGameObjects:', error);
        }
    }
    
    processCollisions() {
        try {
            // Reset ground state at the beginning of each frame
            this.isOnGround = false;
            
            // Only proceed if player body exists
            if (!this.playerBody) return;
            
            // Get player position
            const playerPos = this.playerBody.translation();
            
            // Ground collision check - the simple version
            // Check if player's feet are close to any platform or ground
            for (const platform of this.platforms) {
                const platformPos = platform.body.translation();
                const platformHeight = 20; // From platform creation
                
                // Very simple collision check - if player is above the platform and within its width
                if (Math.abs(playerPos.x - platformPos.x) < 100 && // Within platform width/2
                    Math.abs(playerPos.y - platformPos.y) < 30) {   // Close to top of platform
                    this.isOnGround = true;
                    break;
                }
            }
            
            // Check if on the main ground
            if (playerPos.y >= 680) { // Ground level minus some tolerance
                this.isOnGround = true;
            }
        } catch (error) {
            console.error('[Game] Error in processCollisions:', error);
        }
    }
    
    handlePlayerMovement() {
        try {
            // Only proceed if player body exists
            if (!this.playerBody) return;
            
            const moveSpeed = 3; // Moderate speed
            let vx = 0;
            
            // Check WASD keys first
            if (this.wasd.left.isDown) {
                vx = -moveSpeed;
            } else if (this.wasd.right.isDown) {
                vx = moveSpeed;
            }
            
            // If WASD isn't pressed, check arrow keys
            if (vx === 0) {
                if (this.cursors.left.isDown) {
                    vx = -moveSpeed;
                } else if (this.cursors.right.isDown) {
                    vx = moveSpeed;
                }
            }
            
            // Get current velocity to preserve y-component
            const currentVel = this.playerBody.linvel();
            
            // Set the new velocity
            if (vx !== 0) {
                this.playerBody.setLinvel({ x: vx, y: currentVel.y }, true);
            } else {
                // Apply friction when no keys are pressed
                this.playerBody.setLinvel({ x: currentVel.x * 0.9, y: currentVel.y }, true);
            }
        } catch (error) {
            console.error('[Game] Error in handlePlayerMovement:', error);
        }
    }
    
    handleJumping() {
        try {
            // Only proceed if player body exists
            if (!this.playerBody) return;
            
            // If player is on the ground, reset jump count
            if (this.isOnGround) {
                this.jumpsUsed = 0;
            }
            
            // Check for jump input from SPACE, W, or UP arrow
            const jumpPressed = 
                Phaser.Input.Keyboard.JustDown(this.spaceKey) || 
                Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                Phaser.Input.Keyboard.JustDown(this.cursors.up);
            
            if (jumpPressed) {
                if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                    const currentVel = this.playerBody.linvel();
                    this.playerBody.setLinvel({ x: currentVel.x, y: -12 }, true); // Jump force
                    this.jumpsUsed++;
                    
                    // Change player color based on jump number (visual feedback)
                    if (this.playerSprite.setTint) {
                        // If it's a sprite with setTint method
                        if (this.jumpsUsed === 1) {
                            this.playerSprite.setTint(0x00FF00); // Green for first jump
                        } else if (this.jumpsUsed === 2) {
                            this.playerSprite.setTint(0xFFFF00); // Yellow for second jump
                        } else if (this.jumpsUsed === 3) {
                            this.playerSprite.setTint(0xFF0000); // Red for third jump
                        }
                    } else if (this.playerSprite.fillColor !== undefined) {
                        // If it's a rectangle with fillColor property
                        if (this.jumpsUsed === 1) {
                            this.playerSprite.fillColor = 0x00FF00; // Green for first jump
                        } else if (this.jumpsUsed === 2) {
                            this.playerSprite.fillColor = 0xFFFF00; // Yellow for second jump
                        } else if (this.jumpsUsed === 3) {
                            this.playerSprite.fillColor = 0xFF0000; // Red for third jump
                        }
                    }
                }
            }
            
            // Update the jump text
            if (this.jumpText) {
                this.jumpText.setText(`Jumps Used: ${this.jumpsUsed} / ${this.maxJumps}`);
            }
            
            // Reset color when on ground
            if (this.isOnGround) {
                if (this.playerSprite.setTint) {
                    this.playerSprite.clearTint(); // Clear tint if it's a sprite
                } else if (this.playerSprite.fillColor !== undefined) {
                    this.playerSprite.fillColor = 0x0000FF; // Blue when on ground if it's a rectangle
                }
            }
        } catch (error) {
            console.error('[Game] Error in handleJumping:', error);
        }
    }
}