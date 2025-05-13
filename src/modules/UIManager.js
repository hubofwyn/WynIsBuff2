import { EventNames } from '../constants/EventNames';

/**
 * UIManager class handles all UI-related functionality including
 * text creation, button handling, positioning, and event-based updates.
 */
export class UIManager {
    /**
     * Create a new UIManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.events = eventSystem;
        this.elements = new Map();
        this.groups = new Map();
        
        // Store screen dimensions for responsive positioning
        this.screenWidth = this.scene.cameras.main.width;
        this.screenHeight = this.scene.cameras.main.height;
        
        // Listen for UI update events
        if (this.events) {
            this.events.on(EventNames.UI_UPDATE, this.handleUIUpdate.bind(this));
            this.events.on(EventNames.PLAYER_JUMP, this.handlePlayerJump.bind(this));
        }
        
        // Listen for resize events to update responsive positioning
        this.scene.scale.on('resize', this.handleResize, this);
    }
    
    /**
     * Create a text element
     * @param {string} key - Unique identifier for the element
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text content
     * @param {object} style - Phaser text style object
     * @param {boolean} responsive - Whether to use responsive positioning
     * @returns {Phaser.GameObjects.Text} The created text element
     */
    createText(key, x, y, text, style, responsive = false) {
        const textElement = this.scene.add.text(x, y, text, style);
        this.elements.set(key, {
            element: textElement,
            type: 'text',
            responsive: responsive,
            originalPosition: { x, y },
            originalStyle: Object.assign({}, style)
        });
        return textElement;
    }
    
    /**
     * Create a button
     * @param {string} key - Unique identifier for the element
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} texture - Button texture key
     * @param {function} callback - Function to call when button is clicked
     * @param {boolean} responsive - Whether to use responsive positioning
     * @returns {Phaser.GameObjects.Image} The created button
     */
    createButton(key, x, y, texture, callback, responsive = false) {
        const button = this.scene.add.image(x, y, texture)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => button.setTint(0xdddddd))
            .on('pointerout', () => button.clearTint());
            
        this.elements.set(key, {
            element: button,
            type: 'button',
            responsive: responsive,
            originalPosition: { x, y }
        });
        return button;
    }
    
    /**
     * Create a UI group to organize elements
     * @param {string} key - Unique identifier for the group
     * @returns {object} Group object
     */
    createGroup(key) {
        const group = {
            elements: [],
            visible: true
        };
        this.groups.set(key, group);
        return group;
    }
    
    /**
     * Add an element to a group
     * @param {string} groupKey - Group identifier
     * @param {string} elementKey - Element identifier
     */
    addToGroup(groupKey, elementKey) {
        const group = this.groups.get(groupKey);
        const elementData = this.elements.get(elementKey);
        
        if (group && elementData) {
            group.elements.push(elementKey);
        }
    }
    
    /**
     * Update text content
     * @param {string} key - Element identifier
     * @param {string} text - New text content
     */
    updateText(key, text) {
        const elementData = this.elements.get(key);
        if (elementData && elementData.type === 'text' && elementData.element.setText) {
            elementData.element.setText(text);
        }
    }
    
    /**
     * Handle UI update events
     * @param {object} data - Event data
     */
    handleUIUpdate(data) {
        if (data.type === 'text' && data.key && data.value) {
            this.updateText(data.key, data.value);
        } else if (data.type === 'visibility' && data.key) {
            if (data.visible) {
                this.showElement(data.key);
            } else {
                this.hideElement(data.key);
            }
        }
    }
    
    /**
     * Handle player jump events
     * @param {object} data - Jump event data
     */
    handlePlayerJump(data) {
        this.updateText('jumpCounter', `Jumps Used: ${data.jumpsUsed} / ${data.maxJumps}`);
    }
    
    /**
     * Get a UI element
     * @param {string} key - Element identifier
     * @returns {Phaser.GameObjects.GameObject} The UI element
     */
    getElement(key) {
        const elementData = this.elements.get(key);
        return elementData ? elementData.element : null;
    }
    
    /**
     * Show a UI element
     * @param {string} key - Element identifier
     */
    showElement(key) {
        const elementData = this.elements.get(key);
        if (elementData && elementData.element) {
            elementData.element.setVisible(true);
        }
    }
    
    /**
     * Hide a UI element
     * @param {string} key - Element identifier
     */
    hideElement(key) {
        const elementData = this.elements.get(key);
        if (elementData && elementData.element) {
            elementData.element.setVisible(false);
        }
    }
    
    /**
     * Show all elements in a group
     * @param {string} groupKey - Group identifier
     */
    showGroup(groupKey) {
        const group = this.groups.get(groupKey);
        if (group) {
            group.visible = true;
            group.elements.forEach(elementKey => {
                this.showElement(elementKey);
            });
        }
    }
    
    /**
     * Hide all elements in a group
     * @param {string} groupKey - Group identifier
     */
    hideGroup(groupKey) {
        const group = this.groups.get(groupKey);
        if (group) {
            group.visible = false;
            group.elements.forEach(elementKey => {
                this.hideElement(elementKey);
            });
        }
    }
    
    /**
     * Handle screen resize events
     * @param {Phaser.Scale.ScaleManager} gameSize - The new game size
     */
    handleResize(gameSize) {
        // Update stored screen dimensions
        this.screenWidth = gameSize.width;
        this.screenHeight = gameSize.height;
        
        // Update positions of responsive elements
        this.elements.forEach((data, key) => {
            if (data.responsive && data.element) {
                this.updateResponsivePosition(data);
            }
        });
    }
    
    /**
     * Update the position of a responsive element
     * @param {object} elementData - Element data
     */
    updateResponsivePosition(elementData) {
        const { element, originalPosition } = elementData;
        
        // Calculate new position based on screen size
        // This is a simple implementation - can be expanded for more complex positioning
        const relativeX = originalPosition.x / this.screenWidth;
        const relativeY = originalPosition.y / this.screenHeight;
        
        element.setPosition(
            relativeX * this.screenWidth,
            relativeY * this.screenHeight
        );
    }
    
    /**
     * Position an element relative to screen edges
     * @param {string} key - Element identifier
     * @param {string} position - Position type ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')
     * @param {number} offsetX - X offset from the position
     * @param {number} offsetY - Y offset from the position
     */
    positionRelativeToScreen(key, position, offsetX = 0, offsetY = 0) {
        const elementData = this.elements.get(key);
        if (!elementData || !elementData.element) return;
        
        const element = elementData.element;
        let x, y;
        
        switch (position) {
            case 'top-left':
                x = offsetX;
                y = offsetY;
                element.setOrigin(0, 0);
                break;
            case 'top-right':
                x = this.screenWidth - offsetX;
                y = offsetY;
                element.setOrigin(1, 0);
                break;
            case 'bottom-left':
                x = offsetX;
                y = this.screenHeight - offsetY;
                element.setOrigin(0, 1);
                break;
            case 'bottom-right':
                x = this.screenWidth - offsetX;
                y = this.screenHeight - offsetY;
                element.setOrigin(1, 1);
                break;
            case 'center':
                x = this.screenWidth / 2 + offsetX;
                y = this.screenHeight / 2 + offsetY;
                element.setOrigin(0.5, 0.5);
                break;
            default:
                x = offsetX;
                y = offsetY;
                element.setOrigin(0, 0);
        }
        
        element.setPosition(x, y);
        
        // Update original position for responsive positioning
        elementData.originalPosition = { x, y };
        elementData.responsive = true;
    }
    
    /**
     * Clean up event listeners when scene is shut down
     */
    shutdown() {
        if (this.events) {
            this.events.off(EventNames.UI_UPDATE, this.handleUIUpdate);
            this.events.off(EventNames.PLAYER_JUMP, this.handlePlayerJump);
        }
        
        this.scene.scale.off('resize', this.handleResize, this);
    }
    /**
     * Apply or remove high-contrast UI styling
     * @param {boolean} enabled
     */
    applyHighContrast(enabled) {
        console.log(`[UIManager] High contrast mode: ${enabled}`);
        // Apply CSS contrast filter to game canvas
        const canvas = this.scene.sys.game.canvas;
        if (canvas && canvas.style) {
            canvas.style.filter = enabled ? 'contrast(150%)' : 'contrast(100%)';
        }
        // Iterate over text elements and adjust styles
        this.elements.forEach((data) => {
            const el = data.element;
            if (data.type === 'text' && data.originalStyle && el.setStyle) {
                if (enabled) {
                    // Increase font size and stroke thickness
                    const base = data.originalStyle;
                    const size = parseInt(base.fontSize, 10) || 16;
                    el.setStyle({
                        fontSize: `${size + 4}px`,
                        strokeThickness: (base.strokeThickness || 0) + 2
                    });
                } else {
                    // Revert to original style
                    el.setStyle(data.originalStyle);
                }
            }
        });
    }
    /**
     * Show or hide subtitle captions in the UI
     * @param {boolean} enabled
     */
    showSubtitles(enabled) {
        console.log(`[UIManager] Subtitles enabled: ${enabled}`);
        // TODO: Display subtitle text elements when sound events occur
    }
}