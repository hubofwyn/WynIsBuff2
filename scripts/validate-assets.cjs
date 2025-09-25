#!/usr/bin/env node
/**
 * Asset Validation Script
 * Validates asset integrity, checks for corruption, and verifies manifest consistency
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Configuration
const ASSETS_DIR = path.join(process.cwd(), 'assets');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'manifest.json');
const OUTPUT_PATH = path.join(process.cwd(), 'asset-validation-report.json');

// Validation settings
const SETTINGS = {
    maxImageSize: 2048 * 2048, // 2048x2048 max dimensions
    maxFileSizeMB: 10, // 10MB max file size
    allowedImageFormats: ['png', 'jpg', 'jpeg', 'webp'],
    allowedAudioFormats: ['mp3', 'wav', 'ogg'],
    requirePowerOfTwo: false, // Set to true if mipmaps are needed
    checkIntegrity: true,
    generateHashes: true
};

// Validation results
const results = {
    timestamp: new Date().toISOString(),
    summary: {
        totalAssets: 0,
        validAssets: 0,
        invalidAssets: 0,
        missingAssets: 0,
        oversizedAssets: 0,
        corruptedAssets: 0
    },
    details: {
        valid: [],
        invalid: [],
        missing: [],
        oversized: [],
        corrupted: [],
        warnings: []
    },
    hashes: {}
};

/**
 * Log with timestamp
 */
function log(level, message) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [AssetValidator] ${message}`);
}

/**
 * Check if file exists and is readable
 */
function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch {
        return 0;
    }
}

/**
 * Generate MD5 hash for file
 */
function generateHash(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        return createHash('md5').update(buffer).digest('hex');
    } catch (error) {
        log('error', `Failed to generate hash for ${filePath}: ${error.message}`);
        return null;
    }
}

/**
 * Check if image dimensions are power of two
 */
function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Validate image file
 */
async function validateImage(filePath, assetKey) {
    const validation = {
        key: assetKey,
        path: filePath,
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    };

    try {
        // Check file exists
        if (!fileExists(filePath)) {
            validation.valid = false;
            validation.errors.push('File does not exist');
            return validation;
        }

        // Check file size
        const fileSize = getFileSize(filePath);
        const fileSizeMB = fileSize / (1024 * 1024);
        validation.metadata.fileSize = fileSize;
        validation.metadata.fileSizeMB = Math.round(fileSizeMB * 100) / 100;

        if (fileSizeMB > SETTINGS.maxFileSizeMB) {
            validation.errors.push(`File too large: ${fileSizeMB}MB (max ${SETTINGS.maxFileSizeMB}MB)`);
            validation.valid = false;
        }

        // Check file format
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (!SETTINGS.allowedImageFormats.includes(ext)) {
            validation.errors.push(`Invalid format: ${ext} (allowed: ${SETTINGS.allowedImageFormats.join(', ')})`);
            validation.valid = false;
        }

        // Basic corruption check - try to read file
        if (SETTINGS.checkIntegrity) {
            try {
                const buffer = fs.readFileSync(filePath);
                if (buffer.length === 0) {
                    validation.errors.push('File is empty');
                    validation.valid = false;
                }
                
                // Check for common image file signatures
                const signatures = {
                    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
                    jpg: [0xFF, 0xD8, 0xFF],
                    jpeg: [0xFF, 0xD8, 0xFF],
                    webp: [0x52, 0x49, 0x46, 0x46]
                };
                
                const signature = signatures[ext];
                if (signature) {
                    const fileHeader = Array.from(buffer.slice(0, signature.length));
                    if (!signature.every((byte, index) => fileHeader[index] === byte)) {
                        validation.warnings.push('File signature does not match extension');
                    }
                }
                
                // Generate hash if enabled
                if (SETTINGS.generateHashes) {
                    validation.metadata.hash = generateHash(filePath);
                }
                
            } catch (error) {
                validation.errors.push(`Integrity check failed: ${error.message}`);
                validation.valid = false;
            }
        }

        // Power of two check (if required for mipmaps)
        if (SETTINGS.requirePowerOfTwo) {
            // This would require image processing library like sharp or canvas
            validation.warnings.push('Power of two check requires image processing library');
        }

    } catch (error) {
        validation.errors.push(`Validation error: ${error.message}`);
        validation.valid = false;
    }

    return validation;
}

/**
 * Validate audio file
 */
async function validateAudio(filePath, assetKey) {
    const validation = {
        key: assetKey,
        path: filePath,
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    };

    try {
        // Check file exists
        if (!fileExists(filePath)) {
            validation.valid = false;
            validation.errors.push('File does not exist');
            return validation;
        }

        // Check file size
        const fileSize = getFileSize(filePath);
        const fileSizeMB = fileSize / (1024 * 1024);
        validation.metadata.fileSize = fileSize;
        validation.metadata.fileSizeMB = Math.round(fileSizeMB * 100) / 100;

        if (fileSizeMB > SETTINGS.maxFileSizeMB) {
            validation.errors.push(`File too large: ${fileSizeMB}MB (max ${SETTINGS.maxFileSizeMB}MB)`);
            validation.valid = false;
        }

        // Check file format
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (!SETTINGS.allowedAudioFormats.includes(ext)) {
            validation.errors.push(`Invalid format: ${ext} (allowed: ${SETTINGS.allowedAudioFormats.join(', ')})`);
            validation.valid = false;
        }

        // Basic integrity check
        if (SETTINGS.checkIntegrity) {
            try {
                const buffer = fs.readFileSync(filePath);
                if (buffer.length === 0) {
                    validation.errors.push('File is empty');
                    validation.valid = false;
                }

                // Generate hash if enabled
                if (SETTINGS.generateHashes) {
                    validation.metadata.hash = generateHash(filePath);
                }

            } catch (error) {
                validation.errors.push(`Integrity check failed: ${error.message}`);
                validation.valid = false;
            }
        }

    } catch (error) {
        validation.errors.push(`Validation error: ${error.message}`);
        validation.valid = false;
    }

    return validation;
}

/**
 * Load and validate manifest
 */
function loadManifest() {
    try {
        if (!fileExists(MANIFEST_PATH)) {
            log('error', `Manifest not found: ${MANIFEST_PATH}`);
            return null;
        }

        const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
        return JSON.parse(manifestContent);
    } catch (error) {
        log('error', `Failed to load manifest: ${error.message}`);
        return null;
    }
}

/**
 * Main validation function
 */
async function validateAssets() {
    log('info', 'Starting asset validation...');
    
    const manifest = loadManifest();
    if (!manifest) {
        process.exit(1);
    }

    // Handle nested manifest structure
    let assets = [];
    if (Array.isArray(manifest.assets)) {
        assets = manifest.assets;
    } else if (typeof manifest.assets === 'object') {
        // Flatten nested structure
        for (const [category, categoryAssets] of Object.entries(manifest.assets)) {
            if (typeof categoryAssets === 'object') {
                for (const [key, assetData] of Object.entries(categoryAssets)) {
                    assets.push({
                        key,
                        category,
                        ...assetData
                    });
                }
            }
        }
    }
    
    results.summary.totalAssets = assets.length;

    log('info', `Validating ${assets.length} assets...`);

    for (const asset of assets) {
        if (!asset.path) {
            log('warn', `Asset ${asset.key} has no path, skipping`);
            results.summary.invalidAssets++;
            results.details.invalid.push({
                key: asset.key,
                path: 'N/A',
                valid: false,
                errors: ['No path specified'],
                warnings: [],
                metadata: {}
            });
            continue;
        }
        
        const assetPath = path.join(ASSETS_DIR, asset.path);
        let validation;

        try {
            if (asset.type === 'image' || asset.type === 'spritesheet') {
                validation = await validateImage(assetPath, asset.key);
            } else if (asset.type === 'audio') {
                validation = await validateAudio(assetPath, asset.key);
            } else {
                validation = {
                    key: asset.key,
                    path: assetPath,
                    valid: false,
                    errors: [`Unknown asset type: ${asset.type}`],
                    warnings: [],
                    metadata: {}
                };
            }

            // Categorize results
            if (validation.valid) {
                results.summary.validAssets++;
                results.details.valid.push(validation);
            } else {
                results.summary.invalidAssets++;
                results.details.invalid.push(validation);

                // Categorize specific issues
                if (validation.errors.some(e => e.includes('does not exist'))) {
                    results.summary.missingAssets++;
                    results.details.missing.push(validation);
                }
                if (validation.errors.some(e => e.includes('too large'))) {
                    results.summary.oversizedAssets++;
                    results.details.oversized.push(validation);
                }
                if (validation.errors.some(e => e.includes('Integrity') || e.includes('empty') || e.includes('signature'))) {
                    results.summary.corruptedAssets++;
                    results.details.corrupted.push(validation);
                }
            }

            // Store hash if generated
            if (validation.metadata.hash) {
                results.hashes[asset.key] = validation.metadata.hash;
            }

            // Collect warnings
            if (validation.warnings.length > 0) {
                results.details.warnings.push(...validation.warnings.map(w => `${asset.key}: ${w}`));
            }

        } catch (error) {
            log('error', `Failed to validate ${asset.key}: ${error.message}`);
            results.summary.invalidAssets++;
            results.details.invalid.push({
                key: asset.key,
                path: assetPath,
                valid: false,
                errors: [`Validation failed: ${error.message}`],
                warnings: [],
                metadata: {}
            });
        }
    }

    // Write results to file
    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
        log('info', `Validation report written to: ${OUTPUT_PATH}`);
    } catch (error) {
        log('error', `Failed to write report: ${error.message}`);
    }

    // Print summary
    console.log('\n=== Asset Validation Summary ===');
    console.log(`Total Assets: ${results.summary.totalAssets}`);
    console.log(`Valid: ${results.summary.validAssets}`);
    console.log(`Invalid: ${results.summary.invalidAssets}`);
    console.log(`Missing: ${results.summary.missingAssets}`);
    console.log(`Oversized: ${results.summary.oversizedAssets}`);
    console.log(`Corrupted: ${results.summary.corruptedAssets}`);
    console.log(`Warnings: ${results.details.warnings.length}`);

    if (results.summary.invalidAssets > 0) {
        console.log('\n=== Invalid Assets ===');
        results.details.invalid.forEach(asset => {
            console.log(`❌ ${asset.key}: ${asset.errors.join(', ')}`);
        });
    }

    if (results.details.warnings.length > 0) {
        console.log('\n=== Warnings ===');
        results.details.warnings.forEach(warning => {
            console.log(`⚠️  ${warning}`);
        });
    }

    // Exit with error code if validation failed
    if (results.summary.invalidAssets > 0) {
        log('error', 'Asset validation failed');
        process.exit(1);
    } else {
        log('info', 'Asset validation passed');
        process.exit(0);
    }
}

// Run validation
validateAssets().catch(error => {
    log('error', `Validation error: ${error.message}`);
    process.exit(1);
});