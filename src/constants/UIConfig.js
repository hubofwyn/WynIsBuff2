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
    // Text styles for various UI elements
    text: {
        // Large title (Welcome, GameOver)
        title: {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        },
        // Subtitle or prompt
        subtitle: {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        },
        // Section headings (CharacterSelect, MainMenu title)
        heading: {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        },
        // General labels (CharacterSelect options)
        label: {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        },
        // Stats or informational text
        stats: {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        },
        // Message text for feedback messages
        message: {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        },
        // Button text (GameOver buttons, etc.)
        button: {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }
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