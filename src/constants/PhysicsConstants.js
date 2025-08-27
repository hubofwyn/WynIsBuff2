/**
 * PhysicsConstants: Critical scaling and unit conversion constants for proper Rapier integration
 * Based on modern 2D platformer best practices from config-settings-modern.md
 */

/**
 * PIXELS_PER_METER - The fundamental scaling constant that translates between
 * Phaser's pixel-based rendering coordinates and Rapier's meter-based physics simulation
 * 
 * Rapier is optimized for SI units (meters, kilograms, seconds) with gravity = 9.81
 * Using 100 pixels = 1 meter provides a clean, manageable conversion factor
 */
export const PIXELS_PER_METER = 100;

/**
 * METERS_PER_PIXEL - Inverse scaling for converting pixels to meters
 */
export const METERS_PER_PIXEL = 1 / PIXELS_PER_METER;

/**
 * Convert pixels to meters for physics calculations
 * @param {number} pixels - Value in pixels
 * @returns {number} Value in meters
 */
export function pixelsToMeters(pixels) {
    return pixels * METERS_PER_PIXEL;
}

/**
 * Convert meters to pixels for rendering
 * @param {number} meters - Value in meters  
 * @returns {number} Value in pixels
 */
export function metersToPixels(meters) {
    return meters * PIXELS_PER_METER;
}

/**
 * Convert a pixel-based Vector2 to meters
 * @param {{x: number, y: number}} pixelVector - Vector in pixels
 * @returns {{x: number, y: number}} Vector in meters
 */
export function vectorPixelsToMeters(pixelVector) {
    return {
        x: pixelsToMeters(pixelVector.x),
        y: pixelsToMeters(pixelVector.y)
    };
}

/**
 * Convert a meter-based Vector2 to pixels  
 * @param {{x: number, y: number}} meterVector - Vector in meters
 * @returns {{x: number, y: number}} Vector in pixels
 */
export function vectorMetersToPixels(meterVector) {
    return {
        x: metersToPixels(meterVector.x),
        y: metersToPixels(meterVector.y)
    };
}