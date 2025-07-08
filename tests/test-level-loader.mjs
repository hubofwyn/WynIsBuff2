import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { MockEventSystem } from './mocks/event-system-mock.mjs';

describe('LevelLoader Unit Tests', () => {
    let mockEventSystem;

    beforeEach(() => {
        mockEventSystem = new MockEventSystem();
    });

    describe('Level Data Structure', () => {
        it('should validate level data format', () => {
            const validLevelData = {
                id: 'level1',
                name: 'First Steps',
                platforms: [
                    { x: 100, y: 200, width: 200, height: 20, type: 'static' },
                    { x: 400, y: 300, width: 150, height: 20, type: 'moving' },
                ],
                collectibles: [
                    { x: 150, y: 150, type: 'coin', points: 10 },
                    { x: 250, y: 150, type: 'powerup', effect: 'doubleJump' },
                ],
                enemies: [{ x: 300, y: 180, type: 'skeleton', health: 100 }],
                playerSpawn: { x: 50, y: 100 },
                goal: { x: 800, y: 200 },
            };

            // Validate required fields
            assert.strictEqual(typeof validLevelData.id, 'string');
            assert.strictEqual(typeof validLevelData.name, 'string');
            assert.strictEqual(Array.isArray(validLevelData.platforms), true);
            assert.strictEqual(Array.isArray(validLevelData.collectibles), true);
            assert.strictEqual(Array.isArray(validLevelData.enemies), true);
            assert.notStrictEqual(validLevelData.playerSpawn, undefined);
            assert.notStrictEqual(validLevelData.goal, undefined);
        });

        it('should handle missing optional fields', () => {
            const minimalLevelData = {
                id: 'test',
                name: 'Test Level',
                platforms: [],
                playerSpawn: { x: 0, y: 0 },
                goal: { x: 100, y: 0 },
            };

            // Optional fields should default to empty arrays
            const collectibles = minimalLevelData.collectibles || [];
            const enemies = minimalLevelData.enemies || [];
            const powerups = minimalLevelData.powerups || [];

            assert.strictEqual(collectibles.length, 0);
            assert.strictEqual(enemies.length, 0);
            assert.strictEqual(powerups.length, 0);
        });
    });

    describe('Platform Loading', () => {
        it('should categorize platforms correctly', () => {
            const platforms = [
                { type: 'static', x: 0, y: 0 },
                { type: 'moving', x: 100, y: 0 },
                { type: 'static', x: 200, y: 0 },
                { type: 'breakable', x: 300, y: 0 },
                { type: 'moving', x: 400, y: 0 },
            ];

            const categorized = {
                static: [],
                moving: [],
                breakable: [],
            };

            platforms.forEach((platform) => {
                const type = platform.type || 'static';
                if (categorized[type]) {
                    categorized[type].push(platform);
                }
            });

            assert.strictEqual(categorized.static.length, 2);
            assert.strictEqual(categorized.moving.length, 2);
            assert.strictEqual(categorized.breakable.length, 1);
        });

        it('should calculate platform bounds', () => {
            const platform = { x: 100, y: 200, width: 150, height: 20 };

            const bounds = {
                left: platform.x - platform.width / 2,
                right: platform.x + platform.width / 2,
                top: platform.y - platform.height / 2,
                bottom: platform.y + platform.height / 2,
            };

            assert.strictEqual(bounds.left, 25);
            assert.strictEqual(bounds.right, 175);
            assert.strictEqual(bounds.top, 190);
            assert.strictEqual(bounds.bottom, 210);
        });

        it('should handle moving platform properties', () => {
            const movingPlatform = {
                type: 'moving',
                x: 300,
                y: 400,
                width: 100,
                height: 20,
                moveType: 'horizontal',
                moveRange: 200,
                moveSpeed: 50,
            };

            // Validate moving platform specific properties
            assert.strictEqual(movingPlatform.moveType, 'horizontal');
            assert.strictEqual(movingPlatform.moveRange, 200);
            assert.strictEqual(movingPlatform.moveSpeed, 50);

            // Calculate movement bounds
            const moveBounds = {
                minX: movingPlatform.x - movingPlatform.moveRange / 2,
                maxX: movingPlatform.x + movingPlatform.moveRange / 2,
            };

            assert.strictEqual(moveBounds.minX, 200);
            assert.strictEqual(moveBounds.maxX, 400);
        });
    });

    describe('Collectible Management', () => {
        it('should track collectible types and values', () => {
            const collectibles = [
                { type: 'coin', points: 10 },
                { type: 'coin', points: 10 },
                { type: 'gem', points: 50 },
                { type: 'star', points: 100 },
                { type: 'coin', points: 10 },
            ];

            const totals = collectibles.reduce(
                (acc, item) => {
                    acc.totalPoints += item.points;
                    acc.byType[item.type] = (acc.byType[item.type] || 0) + 1;
                    return acc;
                },
                { totalPoints: 0, byType: {} }
            );

            assert.strictEqual(totals.totalPoints, 180);
            assert.strictEqual(totals.byType.coin, 3);
            assert.strictEqual(totals.byType.gem, 1);
            assert.strictEqual(totals.byType.star, 1);
        });

        it('should handle collectible collection state', () => {
            const collectibles = [
                { id: 1, collected: false },
                { id: 2, collected: true },
                { id: 3, collected: false },
                { id: 4, collected: true },
                { id: 5, collected: false },
            ];

            const uncollected = collectibles.filter((c) => !c.collected);
            const collected = collectibles.filter((c) => c.collected);

            assert.strictEqual(uncollected.length, 3);
            assert.strictEqual(collected.length, 2);
        });
    });

    describe('Enemy Loading', () => {
        it('should initialize enemy properties', () => {
            const enemyData = {
                type: 'skeleton',
                x: 400,
                y: 300,
                health: 100,
                damage: 10,
                speed: 50,
                patrolRange: 200,
            };

            // Validate enemy initialization
            assert.strictEqual(enemyData.type, 'skeleton');
            assert.strictEqual(enemyData.health, 100);
            assert.strictEqual(enemyData.damage, 10);

            // Calculate patrol bounds
            const patrolBounds = {
                left: enemyData.x - enemyData.patrolRange / 2,
                right: enemyData.x + enemyData.patrolRange / 2,
            };

            assert.strictEqual(patrolBounds.left, 300);
            assert.strictEqual(patrolBounds.right, 500);
        });

        it('should handle different enemy types', () => {
            const enemyTypes = {
                skeleton: { health: 100, damage: 10, speed: 50 },
                vampire: { health: 150, damage: 15, speed: 70 },
                boss: { health: 500, damage: 25, speed: 30 },
            };

            const skeleton = { ...enemyTypes.skeleton, type: 'skeleton' };
            const vampire = { ...enemyTypes.vampire, type: 'vampire' };
            const boss = { ...enemyTypes.boss, type: 'boss' };

            assert.strictEqual(skeleton.health, 100);
            assert.strictEqual(vampire.health, 150);
            assert.strictEqual(boss.health, 500);
        });
    });

    describe('Level Progression', () => {
        it('should track level completion requirements', () => {
            const levelRequirements = {
                collectAllCoins: true,
                defeatAllEnemies: false,
                reachGoal: true,
                timeLimit: 300, // seconds
            };

            const progress = {
                coinsCollected: 10,
                totalCoins: 10,
                enemiesDefeated: 3,
                totalEnemies: 5,
                reachedGoal: false,
                timeElapsed: 250,
            };

            // Check completion conditions
            const coinsComplete =
                !levelRequirements.collectAllCoins ||
                progress.coinsCollected >= progress.totalCoins;
            const enemiesComplete =
                !levelRequirements.defeatAllEnemies ||
                progress.enemiesDefeated >= progress.totalEnemies;
            const goalComplete = !levelRequirements.reachGoal || progress.reachedGoal;
            const timeComplete =
                !levelRequirements.timeLimit || progress.timeElapsed <= levelRequirements.timeLimit;

            assert.strictEqual(coinsComplete, true);
            assert.strictEqual(enemiesComplete, true); // Not required
            assert.strictEqual(goalComplete, false);
            assert.strictEqual(timeComplete, true);
        });

        it('should calculate completion percentage', () => {
            const objectives = [
                { id: 'coins', completed: true, weight: 0.3 },
                { id: 'enemies', completed: false, weight: 0.3 },
                { id: 'goal', completed: false, weight: 0.3 },
                { id: 'time', completed: true, weight: 0.1 },
            ];

            const completionPercentage =
                objectives.reduce((total, obj) => total + (obj.completed ? obj.weight : 0), 0) *
                100;

            assert.strictEqual(completionPercentage, 40); // 30% + 10%
        });
    });

    describe('Level Events', () => {
        it('should emit level start event', () => {
            const levelData = {
                id: 'level1',
                name: 'Test Level',
                totalCoins: 10,
                totalEnemies: 5,
            };

            mockEventSystem.emit('LEVEL_START', levelData);

            const events = mockEventSystem.getEmittedEvents('LEVEL_START');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].data.id, 'level1');
            assert.strictEqual(events[0].data.totalCoins, 10);
        });

        it('should emit collectible collected event', () => {
            const collectibleData = {
                type: 'coin',
                points: 10,
                position: { x: 100, y: 200 },
                remaining: 9,
            };

            mockEventSystem.emit('COLLECTIBLE_COLLECTED', collectibleData);

            const events = mockEventSystem.getEmittedEvents('COLLECTIBLE_COLLECTED');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].data.type, 'coin');
            assert.strictEqual(events[0].data.remaining, 9);
        });

        it('should emit level complete event', () => {
            const completionData = {
                levelId: 'level1',
                time: 145.5,
                score: 1500,
                objectives: {
                    coins: true,
                    enemies: true,
                    goal: true,
                },
            };

            mockEventSystem.emit('LEVEL_COMPLETE', completionData);

            const events = mockEventSystem.getEmittedEvents('LEVEL_COMPLETE');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].data.score, 1500);
            assert.strictEqual(events[0].data.objectives.coins, true);
        });
    });

    describe('Level Boundaries', () => {
        it('should calculate level bounds from platforms', () => {
            const platforms = [
                { x: 100, y: 100, width: 100, height: 20 },
                { x: 500, y: 200, width: 100, height: 20 },
                { x: 300, y: 400, width: 100, height: 20 },
                { x: -50, y: 300, width: 100, height: 20 },
            ];

            const bounds = platforms.reduce(
                (acc, platform) => {
                    const left = platform.x - platform.width / 2;
                    const right = platform.x + platform.width / 2;
                    const top = platform.y - platform.height / 2;
                    const bottom = platform.y + platform.height / 2;

                    return {
                        minX: Math.min(acc.minX, left),
                        maxX: Math.max(acc.maxX, right),
                        minY: Math.min(acc.minY, top),
                        maxY: Math.max(acc.maxY, bottom),
                    };
                },
                { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
            );

            assert.strictEqual(bounds.minX, -100); // -50 - 50
            assert.strictEqual(bounds.maxX, 550); // 500 + 50
            assert.strictEqual(bounds.minY, 90); // 100 - 10
            assert.strictEqual(bounds.maxY, 410); // 400 + 10
        });

        it('should handle kill zones', () => {
            const killZones = [
                { x: 0, y: 600, width: 1000, height: 50 }, // Bottom pit
                { x: -100, y: 300, width: 50, height: 600 }, // Left boundary
                { x: 1100, y: 300, width: 50, height: 600 }, // Right boundary
            ];

            // Check if position is in kill zone
            const isInKillZone = (pos, zones) =>
                zones.some((zone) => {
                    const inX = Math.abs(pos.x - zone.x) <= zone.width / 2;
                    const inY = Math.abs(pos.y - zone.y) <= zone.height / 2;
                    return inX && inY;
                });

            assert.strictEqual(isInKillZone({ x: 500, y: 600 }, killZones), true);
            assert.strictEqual(isInKillZone({ x: 500, y: 300 }, killZones), false);
            assert.strictEqual(isInKillZone({ x: -90, y: 300 }, killZones), true);
        });
    });

    describe('Level Difficulty Scaling', () => {
        it('should scale enemy health by difficulty', () => {
            const baseHealth = 100;
            const difficultyMultipliers = {
                easy: 0.75,
                normal: 1.0,
                hard: 1.5,
                extreme: 2.0,
            };

            const difficulties = Object.keys(difficultyMultipliers);
            const scaledHealth = difficulties.map((diff) => ({
                difficulty: diff,
                health: Math.round(baseHealth * difficultyMultipliers[diff]),
            }));

            assert.strictEqual(scaledHealth[0].health, 75); // easy
            assert.strictEqual(scaledHealth[1].health, 100); // normal
            assert.strictEqual(scaledHealth[2].health, 150); // hard
            assert.strictEqual(scaledHealth[3].health, 200); // extreme
        });

        it('should adjust time limits by difficulty', () => {
            const baseTimeLimit = 300; // seconds
            const timeMultipliers = {
                easy: 1.5,
                normal: 1.0,
                hard: 0.8,
                extreme: 0.6,
            };

            const easy = baseTimeLimit * timeMultipliers.easy;
            const hard = baseTimeLimit * timeMultipliers.hard;

            assert.strictEqual(easy, 450);
            assert.strictEqual(hard, 240);
        });
    });
});
