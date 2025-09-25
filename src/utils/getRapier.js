/**
 * Helper function to get RAPIER from scene registry
 * RAPIER is initialized once in Boot scene and stored in registry
 * 
 * @param {Phaser.Scene} scene - The scene to get RAPIER from
 * @returns {Object} RAPIER module
 * @throws {Error} If RAPIER is not found in registry
 */
export function getRapier(scene) {
    const RAPIER = scene?.registry?.get('RAPIER');
    if (!RAPIER) {
        throw new Error('[getRapier] RAPIER not found in registry! Ensure Boot scene initialized it.');
    }
    return RAPIER;
}