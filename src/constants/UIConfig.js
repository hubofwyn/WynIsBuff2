/**
 * UIConfig: Modern UI styling and animations configuration
 */
export const UIConfig = {
    // Modern panel styling with gradients and shadows
    panel: {
        backgroundColor: 0x1a1a2e,
        backgroundAlpha: 0.85,
        borderColor: 0x16213e,
        borderWidth: 3,
        borderRadius: 15,
        padding: 30,
        shadowColor: 0x000000,
        shadowAlpha: 0.6,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
    },
    // Modern button styling with gradients and better effects
    menuButton: {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '32px',
        color: '#FFD700',
        disabledColor: '#555577',
        stroke: '#0F3460',
        strokeThickness: 4,
        align: 'center',
        hoverColor: '#FFF700',
        hoverTint: 0x1e90ff,
        activeScale: 0.95,
        backgroundColor: 0x16213e,
        backgroundAlpha: 0.8,
        borderRadius: 12,
        padding: { x: 25, y: 15 },
        shadow: {
            color: 0x000000,
            alpha: 0.5,
            offsetX: 3,
            offsetY: 3,
        },
    },
    // Modern text styles with better typography
    text: {
        // Large title (Welcome, GameOver)
        title: {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '72px',
            color: '#FFD700',
            stroke: '#0F3460',
            strokeThickness: 5,
            align: 'center',
            shadow: {
                color: '#000000',
                alpha: 0.7,
                offsetX: 4,
                offsetY: 4,
            },
        },
        // Subtitle or prompt
        subtitle: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: '#E0E0E0',
            stroke: '#0F3460',
            strokeThickness: 3,
            align: 'center',
            shadow: {
                color: '#000000',
                alpha: 0.5,
                offsetX: 2,
                offsetY: 2,
            },
        },
        // Section headings (CharacterSelect, MainMenu title)
        heading: {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '52px',
            color: '#FFD700',
            stroke: '#0F3460',
            strokeThickness: 4,
            align: 'center',
            shadow: {
                color: '#000000',
                alpha: 0.6,
                offsetX: 3,
                offsetY: 3,
            },
        },
        // General labels (CharacterSelect options)
        label: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#E0E0E0',
            stroke: '#0F3460',
            strokeThickness: 2,
            align: 'center',
        },
        // Stats or informational text
        stats: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#E0E0E0',
            stroke: '#0F3460',
            strokeThickness: 2,
            align: 'center',
        },
        // Message text for feedback messages
        message: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            color: '#FFD700',
            stroke: '#0F3460',
            strokeThickness: 2,
            align: 'center',
        },
        // Button text (GameOver buttons, etc.)
        button: {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '28px',
            color: '#FFD700',
            stroke: '#0F3460',
            strokeThickness: 3,
            align: 'center',
        },
    },
    // Modern animation configurations
    animations: {
        fadeInDuration: 800,
        fadeOutDuration: 400,
        scaleIn: {
            start: 0.7,
            end: 1.0,
            duration: 500,
            ease: 'Back.easeOut',
        },
        buttonHover: {
            scale: 1.1,
            duration: 200,
            ease: 'Power2.easeOut',
        },
        buttonPress: {
            scale: 0.95,
            duration: 100,
            ease: 'Power2.easeOut',
        },
        slideInFromLeft: {
            startX: -200,
            duration: 600,
            ease: 'Power3.easeOut',
        },
        slideInFromBottom: {
            startY: 100,
            duration: 700,
            ease: 'Back.easeOut',
        },
        pulse: {
            scaleStart: 1.0,
            scaleEnd: 1.05,
            duration: 1000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true,
        },
        glow: {
            alpha: 0.7,
            duration: 1500,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true,
        },
    },
    // Character selection specific styling
    characterSelect: {
        cardWidth: 180,
        cardHeight: 220,
        cardPadding: 20,
        cardBackgroundColor: 0x16213e,
        cardBackgroundAlpha: 0.9,
        cardBorderColor: 0xffd700,
        cardBorderWidth: 2,
        cardBorderRadius: 15,
        hoverScale: 1.05,
        selectedScale: 1.1,
        selectedBorderColor: 0xff6b6b,
        selectedBorderWidth: 4,
    },
};
