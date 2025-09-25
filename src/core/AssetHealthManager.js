import { BaseManager } from './BaseManager';
import { EventNames } from '../constants/EventNames';

/**
 * AssetHealthManager - Detects, tracks, and recovers from corrupted or missing assets
 * Provides fallback mechanisms and asset health monitoring
 */
export class AssetHealthManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        
        this.scene = null;
        this.eventSystem = null;
        
        // Asset health tracking
        this.assetHealth = new Map(); // key -> { status, attempts, lastError, fallbackUsed }
        this.corruptedAssets = new Set();
        this.fallbackAssets = new Map(); // corrupted key -> fallback key
        
        // Monitoring metrics
        this.metrics = {
            totalAssets: 0,
            corruptedAssets: 0,
            fallbacksUsed: 0,
            recoveredAssets: 0,
            lastScanTime: 0
        };
        
        // Configuration
        this.config = {
            maxRetries: 1, // Reduced from 3 to prevent infinite loops
            retryDelay: 2000, // Increased delay to prevent rapid retries
            enableFallbacks: true,
            enableRecovery: false, // Disable recovery to prevent loops
            logLevel: 'warn' // 'debug', 'warn', 'error', 'silent'
        };
    }
    
    /**
     * Initialize the asset health manager
     * @param {Phaser.Scene} scene - The scene instance
     * @param {EventSystem} eventSystem - Event system for notifications
     */
    init(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Set up asset loading event handlers
        this.setupAssetMonitoring();
        
        // Create fallback assets
        this.createFallbackAssets();
        
        this.setInitialized();
        console.log('[AssetHealthManager] Initialized');
    }
    
    /**
     * Set up monitoring for asset loading events
     */
    setupAssetMonitoring() {
        if (!this.scene || !this.scene.load) return;
        
        const loader = this.scene.load;
        
        // Track successful loads
        loader.on('filecomplete', (key, type, data) => {
            this.recordAssetHealth(key, 'loaded', null);
            this.log('debug', `Asset loaded successfully: ${key} (${type})`);
        });
        
        // Track failed loads
        loader.on('loaderror', (fileObj) => {
            const error = `Failed to load: ${fileObj.src}`;
            this.recordAssetHealth(fileObj.key, 'error', error);
            this.handleCorruptedAsset(fileObj.key, error);
            this.log('error', `Asset load failed: ${fileObj.key} - ${error}`);
        });
        
        // Track overall load progress
        loader.on('progress', (progress) => {
            if (progress === 1) {
                this.performAssetHealthScan();
            }
        });
        
        // Monitor WebGL texture errors
        this.setupWebGLMonitoring();
    }
    
    /**
     * Monitor WebGL for texture-related errors
     */
    setupWebGLMonitoring() {
        if (!this.scene || !this.scene.renderer) return;
        
        // Hook into Phaser's texture creation to detect corruption
        const originalCreateTexture = this.scene.textures.addImage;
        if (originalCreateTexture) {
            this.scene.textures.addImage = (key, source, dataSource) => {
                try {
                    const result = originalCreateTexture.call(this.scene.textures, key, source, dataSource);
                    
                    // Validate the texture after creation
                    setTimeout(() => this.validateTexture(key), 100);
                    
                    return result;
                } catch (error) {
                    this.log('error', `Texture creation failed for ${key}: ${error.message}`);
                    this.handleCorruptedAsset(key, error.message);
                    return null;
                }
            };
        }
    }
    
    /**
     * Validate a specific texture for corruption
     * @param {string} key - Asset key to validate
     */
    validateTexture(key) {
        if (!this.scene || !this.scene.textures.exists(key)) {
            this.recordAssetHealth(key, 'missing', 'Texture not found');
            return false;
        }
        
        try {
            const texture = this.scene.textures.get(key);
            const source = texture.getSourceImage();
            
            // Check if image loaded properly
            if (!source || source.width === 0 || source.height === 0) {
                this.recordAssetHealth(key, 'corrupted', 'Invalid dimensions');
                this.handleCorruptedAsset(key, 'Invalid image dimensions');
                return false;
            }
            
            // Check for common corruption indicators
            if (source instanceof HTMLImageElement) {
                if (!source.complete || source.naturalWidth === 0 || source.naturalHeight === 0) {
                    this.recordAssetHealth(key, 'corrupted', 'Image not complete or has zero dimensions');
                    this.handleCorruptedAsset(key, 'Image loading incomplete or corrupted');
                    return false;
                }
            }
            
            this.recordAssetHealth(key, 'healthy', null);
            return true;
            
        } catch (error) {
            this.recordAssetHealth(key, 'corrupted', error.message);
            this.handleCorruptedAsset(key, error.message);
            return false;
        }
    }
    
    /**
     * Handle a corrupted asset by applying fallbacks and recovery
     * @param {string} key - Asset key
     * @param {string} error - Error description
     */
    handleCorruptedAsset(key, error) {
        this.corruptedAssets.add(key);
        this.metrics.corruptedAssets++;
        
        this.log('warn', `Handling corrupted asset: ${key} - ${error}`);
        
        // Emit corruption event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.ASSET_CORRUPTED, {
                key,
                error,
                timestamp: Date.now()
            });
        }
        
        // Try fallback if enabled
        if (this.config.enableFallbacks) {
            this.applyFallback(key);
        }
        
        // Try recovery if enabled
        if (this.config.enableRecovery) {
            this.attemptRecovery(key);
        }
    }
    
    /**
     * Apply fallback asset for corrupted asset
     * @param {string} key - Corrupted asset key
     */
    applyFallback(key) {
        const fallbackKey = this.getFallbackKey(key);
        
        if (fallbackKey && this.scene && this.scene.textures.exists(fallbackKey)) {
            // Replace corrupted texture with fallback
            const fallbackTexture = this.scene.textures.get(fallbackKey);
            
            try {
                // Remove existing corrupted texture first
                if (this.scene.textures.exists(key)) {
                    this.scene.textures.remove(key);
                }
                
                // Create a new texture entry using the fallback data
                this.scene.textures.addImage(key, fallbackTexture.getSourceImage());
                
                this.fallbackAssets.set(key, fallbackKey);
                this.metrics.fallbacksUsed++;
                
                this.log('warn', `Applied fallback for ${key}: using ${fallbackKey}`);
                
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.ASSET_FALLBACK_APPLIED, {
                        originalKey: key,
                        fallbackKey,
                        timestamp: Date.now()
                    });
                }
                
                return true;
            } catch (error) {
                this.log('error', `Failed to apply fallback for ${key}: ${error.message}`);
            }
        }
        
        return false;
    }
    
    /**
     * Get fallback key for an asset
     * @param {string} key - Original asset key
     * @returns {string|null} Fallback key or null
     */
    getFallbackKey(key) {
        // Define fallback mappings
        const fallbackMappings = {
            'logo': 'placeholder-logo',
            'player': 'placeholder-character',
            'background': 'placeholder-background',
            'boss': 'placeholder-boss'
        };
        
        // Direct mapping
        if (fallbackMappings[key]) {
            return fallbackMappings[key];
        }
        
        // Pattern-based fallbacks
        if (key.includes('character') || key.includes('player')) {
            return 'placeholder-character';
        }
        if (key.includes('boss') || key.includes('enemy')) {
            return 'placeholder-boss';
        }
        if (key.includes('background') || key.includes('bg')) {
            return 'placeholder-background';
        }
        if (key.includes('ui') || key.includes('button')) {
            return 'placeholder-ui';
        }
        
        // Generic fallback
        return 'placeholder-generic';
    }
    
    /**
     * Attempt to recover a corrupted asset
     * @param {string} key - Asset key to recover
     */
    async attemptRecovery(key) {
        const health = this.assetHealth.get(key);
        if (!health || health.attempts >= this.config.maxRetries) {
            this.log('error', `Recovery failed for ${key}: max retries exceeded`);
            return false;
        }
        
        health.attempts++;
        
        this.log('debug', `Attempting recovery for ${key} (attempt ${health.attempts})`);
        
        try {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            
            // Try to reload the asset
            const success = await this.reloadAsset(key);
            
            if (success) {
                this.corruptedAssets.delete(key);
                this.metrics.recoveredAssets++;
                health.status = 'recovered';
                health.lastError = null;
                
                this.log('info', `Successfully recovered asset: ${key}`);
                
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.ASSET_RECOVERED, {
                        key,
                        attempts: health.attempts,
                        timestamp: Date.now()
                    });
                }
                
                return true;
            }
        } catch (error) {
            this.log('error', `Recovery attempt failed for ${key}: ${error.message}`);
            health.lastError = error.message;
        }
        
        return false;
    }
    
    /**
     * Reload a specific asset
     * @param {string} key - Asset key to reload
     * @returns {Promise<boolean>} Success status
     */
    async reloadAsset(key) {
        // This would need to be implemented based on your asset loading setup
        // For now, return false to indicate recovery not implemented
        this.log('warn', `Asset reloading not implemented for key: ${key}`);
        return false;
    }
    
    /**
     * Create fallback placeholder assets
     */
    createFallbackAssets() {
        if (!this.scene || !this.scene.add) return;
        
        const graphics = this.scene.add.graphics();
        
        // Create placeholder textures
        const placeholders = {
            'placeholder-generic': { width: 64, height: 64, color: 0x666666 },
            'placeholder-character': { width: 32, height: 48, color: 0x00ff00 },
            'placeholder-boss': { width: 64, height: 64, color: 0xff0000 },
            'placeholder-background': { width: 256, height: 256, color: 0x003366 },
            'placeholder-ui': { width: 128, height: 32, color: 0x444444 },
            'placeholder-logo': { width: 128, height: 64, color: 0xffaa00 }
        };
        
        Object.entries(placeholders).forEach(([key, config]) => {
            // Create a colored rectangle as placeholder
            graphics.fillStyle(config.color);
            graphics.fillRect(0, 0, config.width, config.height);
            graphics.generateTexture(key, config.width, config.height);
            graphics.clear();
        });
        
        this.log('debug', 'Created fallback placeholder assets');
    }
    
    /**
     * Perform comprehensive asset health scan
     */
    performAssetHealthScan() {
        this.metrics.lastScanTime = Date.now();
        this.metrics.totalAssets = this.scene.textures.list ? Object.keys(this.scene.textures.list).length : 0;
        
        this.log('info', `Asset health scan completed: ${this.metrics.totalAssets} total, ${this.metrics.corruptedAssets} corrupted, ${this.metrics.fallbacksUsed} fallbacks used`);
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.ASSET_HEALTH_SCAN_COMPLETE, {
                metrics: { ...this.metrics },
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Record asset health status
     * @param {string} key - Asset key
     * @param {string} status - Health status
     * @param {string|null} error - Error message if any
     */
    recordAssetHealth(key, status, error) {
        if (!this.assetHealth.has(key)) {
            this.assetHealth.set(key, {
                status: 'unknown',
                attempts: 0,
                lastError: null,
                fallbackUsed: false,
                timestamp: Date.now()
            });
        }
        
        const health = this.assetHealth.get(key);
        health.status = status;
        health.lastError = error;
        health.timestamp = Date.now();
    }
    
    /**
     * Get asset health report
     * @returns {Object} Health report
     */
    getHealthReport() {
        return {
            metrics: { ...this.metrics },
            corruptedAssets: Array.from(this.corruptedAssets),
            fallbacksUsed: Array.from(this.fallbackAssets.entries()),
            assetHealth: Array.from(this.assetHealth.entries())
        };
    }
    
    /**
     * Log with configurable levels
     * @param {string} level - Log level
     * @param {string} message - Log message
     */
    log(level, message) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
        const configLevel = levels[this.config.logLevel] || 2;
        const messageLevel = levels[level] || 2;
        
        if (messageLevel >= configLevel) {
            console[level === 'debug' ? 'log' : level](`[AssetHealthManager] ${message}`);
        }
    }
}