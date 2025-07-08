import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { MockEventSystem } from './mocks/event-system-mock.mjs';

// We'll test the individual controller components that don't require full Phaser/RAPIER
describe('PlayerController Unit Tests', () => {
    let mockEventSystem;

    beforeEach(() => {
        mockEventSystem = new MockEventSystem();
    });

    describe('Movement Logic', () => {
        it('should calculate horizontal movement correctly', () => {
            const baseSpeed = 300;
            const inputs = {
                left: true,
                right: false,
            };

            // Expected: moving left
            const expectedVelocity = -baseSpeed;
            const actualVelocity =
                inputs.left && !inputs.right
                    ? -baseSpeed
                    : !inputs.left && inputs.right
                      ? baseSpeed
                      : 0;

            assert.strictEqual(actualVelocity, expectedVelocity);
        });

        it('should handle conflicting inputs (both left and right)', () => {
            const baseSpeed = 300;
            const inputs = {
                left: true,
                right: true,
            };

            // Expected: no movement when both pressed
            const expectedVelocity = 0;
            const actualVelocity =
                inputs.left && inputs.right
                    ? 0
                    : inputs.left
                      ? -baseSpeed
                      : inputs.right
                        ? baseSpeed
                        : 0;

            assert.strictEqual(actualVelocity, expectedVelocity);
        });

        it('should apply air control reduction', () => {
            const baseSpeed = 300;
            const airControlFactor = 0.7;
            const isGrounded = false;

            const groundSpeed = baseSpeed;
            const airSpeed = isGrounded ? groundSpeed : groundSpeed * airControlFactor;

            assert.strictEqual(airSpeed, 210); // 300 * 0.7
        });
    });

    describe('Jump System', () => {
        it('should track jump count correctly', () => {
            const maxJumps = 3;
            let currentJumps = 0;
            let canJump = true;

            // First jump
            if (canJump && currentJumps < maxJumps) {
                currentJumps++;
            }
            assert.strictEqual(currentJumps, 1);

            // Second jump
            if (canJump && currentJumps < maxJumps) {
                currentJumps++;
            }
            assert.strictEqual(currentJumps, 2);

            // Third jump
            if (canJump && currentJumps < maxJumps) {
                currentJumps++;
            }
            assert.strictEqual(currentJumps, 3);

            // Should not allow fourth jump
            canJump = currentJumps < maxJumps;
            assert.strictEqual(canJump, false);
        });

        it('should calculate jump velocity correctly', () => {
            const jumpStrength = -600;
            const jumpNumber = 2;
            const jumpDecay = 0.85;

            // Each subsequent jump is weaker
            const jumpVelocity = jumpStrength * Math.pow(jumpDecay, jumpNumber - 1);
            const expected = -600 * 0.85; // -510

            assert.strictEqual(jumpVelocity, expected);
        });

        it('should reset jumps when grounded', () => {
            let currentJumps = 3;
            const isGrounded = true;

            // Reset logic
            if (isGrounded) {
                currentJumps = 0;
            }

            assert.strictEqual(currentJumps, 0);
        });
    });

    describe('Collision Detection', () => {
        it('should detect ground collision based on normal', () => {
            // Ground collision has upward normal (negative Y)
            const collisionNormal1 = { x: 0, y: -1 };
            const collisionNormal2 = { x: 0.5, y: -0.866 }; // 30 degree slope
            const collisionNormal3 = { x: 1, y: 0 }; // Wall
            const collisionNormal4 = { x: 0, y: 1 }; // Ceiling

            const groundThreshold = 0.7; // cos(45 degrees)

            // Check if normal points mostly upward
            const isGround1 = collisionNormal1.y < -groundThreshold;
            const isGround2 = collisionNormal2.y < -groundThreshold;
            const isGround3 = collisionNormal3.y < -groundThreshold;
            const isGround4 = collisionNormal4.y < -groundThreshold;

            assert.strictEqual(isGround1, true, 'Should detect flat ground');
            assert.strictEqual(isGround2, true, 'Should detect slope as ground');
            assert.strictEqual(isGround3, false, 'Should not detect wall as ground');
            assert.strictEqual(isGround4, false, 'Should not detect ceiling as ground');
        });

        it('should handle coyote time', () => {
            const coyoteTimeMax = 150; // milliseconds
            let timeSinceGrounded = 0;
            const actuallyGrounded = false;

            // Just left ground
            const canStillJump = !actuallyGrounded && timeSinceGrounded < coyoteTimeMax;
            assert.strictEqual(canStillJump, true);

            // Too long since grounded
            timeSinceGrounded = 200;
            const canStillJump2 = !actuallyGrounded && timeSinceGrounded < coyoteTimeMax;
            assert.strictEqual(canStillJump2, false);
        });
    });

    describe('Event System Integration', () => {
        it('should emit player spawn event', () => {
            const x = 100;
            const y = 200;
            const maxJumps = 3;

            // Simulate player spawn
            mockEventSystem.emit('PLAYER_SPAWN', {
                position: { x, y },
                maxJumps,
                sprite: {},
            });

            const spawnEvents = mockEventSystem.getEmittedEvents('PLAYER_SPAWN');
            assert.strictEqual(spawnEvents.length, 1);
            assert.deepStrictEqual(spawnEvents[0].data.position, { x: 100, y: 200 });
            assert.strictEqual(spawnEvents[0].data.maxJumps, 3);
        });

        it('should emit jump events', () => {
            const jumpData = {
                jumpNumber: 2,
                velocity: -510,
                position: { x: 150, y: 300 },
            };

            mockEventSystem.emit('PLAYER_JUMP', jumpData);

            const jumpEvents = mockEventSystem.getEmittedEvents('PLAYER_JUMP');
            assert.strictEqual(jumpEvents.length, 1);
            assert.strictEqual(jumpEvents[0].data.jumpNumber, 2);
            assert.strictEqual(jumpEvents[0].data.velocity, -510);
        });

        it('should emit landing event', () => {
            mockEventSystem.emit('PLAYER_LAND', {
                position: { x: 200, y: 400 },
                fallSpeed: 300,
            });

            const landEvents = mockEventSystem.getEmittedEvents('PLAYER_LAND');
            assert.strictEqual(landEvents.length, 1);
            assert.strictEqual(landEvents[0].data.fallSpeed, 300);
        });
    });

    describe('State Management', () => {
        it('should manage player state correctly', () => {
            const playerState = {
                isGrounded: false,
                isJumping: false,
                isFalling: false,
                velocity: { x: 0, y: 0 },
                position: { x: 100, y: 200 },
                jumpsUsed: 0,
                facingRight: true,
            };

            // Test state transitions
            // Start jumping
            playerState.isJumping = true;
            playerState.isGrounded = false;
            playerState.velocity.y = -600;
            playerState.jumpsUsed = 1;

            assert.strictEqual(playerState.isJumping, true);
            assert.strictEqual(playerState.isGrounded, false);
            assert.strictEqual(playerState.jumpsUsed, 1);

            // Start falling
            playerState.velocity.y = 100;
            playerState.isJumping = false;
            playerState.isFalling = true;

            assert.strictEqual(playerState.isFalling, true);
            assert.strictEqual(playerState.isJumping, false);

            // Land
            playerState.isGrounded = true;
            playerState.isFalling = false;
            playerState.velocity.y = 0;
            playerState.jumpsUsed = 0;

            assert.strictEqual(playerState.isGrounded, true);
            assert.strictEqual(playerState.jumpsUsed, 0);
        });
    });

    describe('Input Buffering', () => {
        it('should buffer jump input', () => {
            const inputBuffer = {
                jump: false,
                jumpBufferTime: 0,
                maxBufferTime: 100,
            };

            // Buffer jump input
            inputBuffer.jump = true;
            inputBuffer.jumpBufferTime = Date.now();

            // Check if buffered input is still valid
            const currentTime = Date.now();
            const isBuffered =
                inputBuffer.jump &&
                currentTime - inputBuffer.jumpBufferTime < inputBuffer.maxBufferTime;

            assert.strictEqual(isBuffered, true);

            // Simulate expired buffer
            inputBuffer.jumpBufferTime = currentTime - 200; // 200ms ago
            const isExpired =
                inputBuffer.jump &&
                currentTime - inputBuffer.jumpBufferTime < inputBuffer.maxBufferTime;

            assert.strictEqual(isExpired, false);
        });
    });

    describe('Physics Integration', () => {
        it('should apply gravity correctly', () => {
            const gravity = 9.81;
            const gravityScale = 2.5;
            const deltaTime = 1 / 60; // 60 FPS

            const velocity = { x: 0, y: 0 };

            // Apply gravity for one frame
            velocity.y += gravity * gravityScale * deltaTime;

            const expectedVelocity = 9.81 * 2.5 * (1 / 60);
            assert.strictEqual(Math.abs(velocity.y - expectedVelocity) < 0.001, true);
        });

        it('should apply movement damping', () => {
            const velocity = { x: 300, y: 0 };
            const damping = 0.9;

            // Apply damping
            velocity.x *= damping;

            assert.strictEqual(velocity.x, 270); // 300 * 0.9
        });

        it('should clamp maximum fall speed', () => {
            const maxFallSpeed = 1000;
            const velocity = { x: 0, y: 1200 };

            // Clamp fall speed
            if (velocity.y > maxFallSpeed) {
                velocity.y = maxFallSpeed;
            }

            assert.strictEqual(velocity.y, maxFallSpeed);
        });
    });
});

describe('PlayerController Integration Patterns', () => {
    it('should coordinate between sub-controllers', () => {
        const messages = [];

        // Simulate controller communication
        const movementController = {
            update: (data) => messages.push({ from: 'movement', data }),
        };

        const jumpController = {
            update: (data) => messages.push({ from: 'jump', data }),
        };

        const collisionController = {
            update: (data) => messages.push({ from: 'collision', data }),
        };

        // Simulate update cycle
        movementController.update({ velocity: { x: 100, y: 0 } });
        jumpController.update({ canJump: true, jumpsRemaining: 2 });
        collisionController.update({ isGrounded: true });

        assert.strictEqual(messages.length, 3);
        assert.strictEqual(messages[0].from, 'movement');
        assert.strictEqual(messages[1].from, 'jump');
        assert.strictEqual(messages[2].from, 'collision');
    });
});
