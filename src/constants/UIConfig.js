/**
 * UIConfig: configuration for UI styling and animations
 */
export const UIConfig = {
    // Panel background for menus and dialogs
    panel: {
        backgroundColor: 0x000000,
        backgroundAlpha: 0.5,
        padding: 20
    },
    // Menu button styling
    menuButton: {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
        disabledColor: '#888888',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        hoverTint: 0xffff00
    },
    // Animation timings
    animations: {
        fadeInDuration: 500,
        scaleIn: {
            start: 0.8,
            end: 1.0,
            duration: 300
        }
    }
};