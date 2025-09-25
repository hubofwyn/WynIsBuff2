/**
 * Birthday Minigame Configuration
 * All game rules and magic numbers in one place
 * Units are explicitly stated in property names
 */
export const BirthdayConfig = Object.freeze({
    // Lane configuration
    Lanes: {
        Count: 3,
        HeightPx: 120,
        StartY: 350,
        // Pre-calculated positions for each lane center
        Positions: [410, 530, 650] // startY + (i * height) + height/2
    },
    
    // Player configuration
    Player: {
        StartXPx: 200,
        StartLane: 1, // Middle lane (0, 1, 2)
        LaneChangeSpeedMs: 200,
        RunSpeedPxPerSec: 250,
        DashSpeedPxPerSec: 500,
        DashCooldownMs: 3000,
        DashDistancePx: 200,
        HorizontalSpeedPxPerFrame: 5,
        MaxXPx: 924, // Right boundary before delivery zone
        MinXPx: 50,   // Left boundary
        Scale: 0.25
    },
    
    // Scrolling configuration
    Scrolling: {
        BaseSpeedPxPerSec: 300,
        SpeedIncreasePerDelivery: 0.05,
        ObjectSpawnXPx: 1100, // Off-screen right
        ObjectDespawnXPx: -100 // Off-screen left
    },
    
    // Spawning configuration  
    Spawning: {
        BaseIntervalMs: 3000,
        MinIntervalMs: 1500,
        IntervalReductionPerLevel: 200,
        ParcelSpawnChance: 0.3, // 30% chance when not carrying
        ObstacleSpawnChance: 0.3, // 30% chance
        PowerUpSpawnChance: 0.1, // 10% chance
        PatternThresholds: {
            Obstacle: 30,
            Parcel: 60,
            PowerUp: 85
        }
    },
    
    // Obstacle configuration
    Obstacles: {
        BaseSpeedPxPerSec: 200,
        Types: {
            Poop: {
                SpeedMultiplier: 1.0,
                Emoji: '💩',
                SoundEffect: 'fart'
            },
            Cone: {
                SpeedMultiplier: 1.3,
                Emoji: '🚧',
                HasWobble: true
            },
            Bird: {
                SpeedMultiplier: 0.8,
                Emoji: '🦆',
                IsDrone: true,
                VerticalAmplitude: 50
            }
        }
    },
    
    // Power-up configuration
    PowerUps: {
        Types: {
            Shield: {
                Emoji: '🛡️',
                DurationMs: 5000,
                Color: 0x00FFFF
            },
            Speed: {
                Emoji: '⚡',
                DurationMs: 3000,
                SpeedMultiplier: 1.5,
                Color: 0xFFFF00
            },
            Magnet: {
                Emoji: '🧲',
                DurationMs: 4000,
                RangePx: 150,
                Color: 0xFF00FF
            },
            Cake: {
                Emoji: '🎂',
                BonusPoints: 250,
                IsInstant: true,
                Color: 0xFFD700
            }
        }
    },
    
    // Scoring configuration
    Scoring: {
        DeliveryGoal: 9, // Wyn's 9th birthday!
        
        // Time windows
        PerfectWindowMs: 2000,
        GoodWindowMs: 5000,
        MaxDeliveryTimeMs: 10000,
        
        // Point values
        Points: {
            ShakeShake: 500,
            ProteinShake: 100,
            CakeBonus: 250,
            NearMissChain: 50,
            TimeBonus: 20, // Per second remaining
            ComboExponent: 1.5,
            StreakBonus: 100
        },
        
        // Speed bonus tiers
        SpeedBonus: {
            FastThresholdSec: 3,
            FastMultiplier: 3,
            QuickThresholdSec: 5,
            QuickMultiplier: 2,
            NormalMultiplier: 1
        }
    },
    
    // Lives configuration
    Lives: {
        Starting: 3,
        MissStreakGameOver: 3
    },
    
    // Collision configuration
    Collision: {
        PickupThresholdPx: 50,
        NearMissThresholdPx: 30,
        DeliveryThresholdPx: 60
    },
    
    // Delivery zone configuration
    DeliveryZone: {
        WidthPx: 120,
        HeightPx: 500,
        XPosition: 964, // 1024 - width/2
        YPosition: 400,
        TriggerXPx: 900 // X position where delivery registers
    },
    
    // Visual effects
    Effects: {
        ScreenShakeDurationMs: 100,
        ScreenShakeIntensity: 0.01,
        FlashDurationMs: 100,
        InvulnerabilityMs: 1000,
        PlayerBobDurationMs: 200,
        TweenEases: {
            LaneChange: 'Power2.Out',
            Dash: 'Power3.Out',
            Pickup: 'Back.Out',
            Wobble: 'Sine.InOut'
        },
        ParticleCount: 10,
        ParticleLifeMs: 500
    },
    
    // UI configuration
    UI: {
        ScorePanelX: 10,
        ScorePanelY: 10,
        ScorePanelWidth: 300,
        ScorePanelHeight: 120,
        
        TimerX: 512,
        TimerY: 45,
        
        LivesX: 900,
        LivesY: 30,
        
        FontSizes: {
            Title: '42px',
            Score: '28px',
            Points: '22px',
            Timer: '24px',
            Combo: '20px',
            Instructions: '18px',
            Streak: '16px'
        },
        
        Colors: {
            Gold: '#FFD700',
            Green: '#00FF00',
            Red: '#FF0000',
            White: '#FFFFFF',
            Cyan: '#00FFFF',
            Purple: '#FF00FF',
            Yellow: '#FFFF00'
        }
    },
    
    // Audio configuration
    Audio: {
        MusicStartDelayMs: 100,
        EffectVolume: 0.7,
        MusicVolume: 0.5
    },
    
    // Tutorial/Instructions
    Tutorial: {
        FadeOutDelayMs: 10000,
        FadeOutDurationMs: 1000,
        ShowControls: true,
        InstructionText: '↑↓ LANES | ← → MOVE | SPACE DASH | DELIVER 9 S²!'
    },
    
    // Event names for the birthday minigame
    Events: {
        GAME_START: 'birthday:gameStart',
        GAME_OVER: 'birthday:gameOver',
        GAME_COMPLETE: 'birthday:gameComplete',
        DELIVERY_MADE: 'birthday:deliveryMade',
        PARCEL_PICKUP: 'birthday:parcelPickup',
        OBSTACLE_HIT: 'birthday:obstacleHit',
        POWERUP_COLLECTED: 'birthday:powerupCollected',
        COMBO_INCREASE: 'birthday:comboIncrease',
        COMBO_BREAK: 'birthday:comboBreak',
        LANE_CHANGE: 'birthday:laneChange',
        DASH_ACTIVATED: 'birthday:dashActivated',
        SCORE_UPDATE: 'birthday:scoreUpdate',
        LIVES_UPDATE: 'birthday:livesUpdate',
        SPEED_INCREASE: 'birthday:speedIncrease'
    }
});

// Export event names separately for easier access
export const BirthdayEvents = BirthdayConfig.Events;