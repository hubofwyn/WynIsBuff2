# Level Select Screen Implementation Plan

**Last Updated**: November 2, 2025
**Status**: 📋 Planning
**Purpose**: Production-ready level selection UI with responsive design
**See Also**: [UI/UX Architecture](../architecture/UI_UX_ARCHITECTURE.md) - Design system and patterns

---

## Quick Navigation

| Section | Purpose |
|---------|---------|
| [Architecture Overview](#architecture-overview) | Integration with existing systems |
| [Design Specifications](#design-specifications) | Visual design using DesignTokens |
| [Implementation Tasks](#implementation-tasks) | Step-by-step development tasks |
| [Responsive Design](#responsive-design) | Adaptive layouts for all devices |
| [Accessibility](#accessibility) | WCAG AA compliance |
| [Testing Checklist](#testing-checklist) | QA requirements |

---

## Architecture Overview

### Integration with Existing Systems

The Level Select Screen integrates with WynIsBuff2's architecture:

```
MainMenuScene (Level Select)
       ↓
   ┌───┴────────────────────────────────┐
   │                                    │
   ├─→ UIManager                        │
   │   (level cards, buttons)           │
   │                                    │
   ├─→ DesignTokens                     │
   │   (spacing, colors, typography)    │
   │                                    │
   ├─→ LoadingScreenManager             │
   │   (level load transitions)         │
   │                                    │
   ├─→ GameStateManager                 │
   │   (level completion, progress)     │
   │                                    │
   └─→ AudioManager                     │
       (hover, click sounds)            │
       └────────────────────────────────┘
```

### File Structure

```
src/
├── scenes/
│   └── MainMenu.js ⭐ (Update: Level Select Screen)
├── constants/
│   ├── DesignTokens.js (Use existing design system)
│   ├── SceneKeys.js (Scene navigation)
│   └── EventNames.js (UI events)
├── modules/
│   └── level/
│       └── LevelCardComponent.js (New: Level card UI component)
└── assets/
    └── images/
        ├── logo.png
        ├── level-illustrations/
        │   ├── protein-plant.png
        │   ├── cardio-canyon.png
        │   └── muscle-mountain.png
        └── ui/
            ├── difficulty-beginner.png
            ├── difficulty-intermediate.png
            └── difficulty-master.png
```

---

## Design Specifications

### Layout Structure

**Phaser Scene Layout** (1024x768 default):

```
┌─────────────────────────────────────────────────┐
│  Hero Section (200px height)                   │
│  ┌──────────────────────────────────────────┐  │
│  │  Logo + Illustration (centered)          │  │
│  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Level Grid (400px height)                     │
│  ┌──────┐  ┌──────┐  ┌──────┐                 │
│  │Card 1│  │Card 2│  │Card 3│                 │
│  └──────┘  └──────┘  └──────┘                 │
├─────────────────────────────────────────────────┤
│  Special Event Banner (100px height)           │
│  "🎂 Birthday Bash Event - Unlock Bonus!"     │
├─────────────────────────────────────────────────┤
│  Footer (68px height)                          │
│  "Reset Progress" link                         │
└─────────────────────────────────────────────────┘
```

### Using DesignTokens

**Import and use existing design system:**

```javascript
import { DesignTokens } from '../constants/DesignTokens.js';

// Spacing
const heroHeight = 200;
const cardSpacing = DesignTokens.spacing.lg; // 24px
const padding = DesignTokens.spacing.xl;     // 32px

// Colors
const bgColor = DesignTokens.colors.bgDark;        // '#0F1B2B'
const accentColor = DesignTokens.colors.primary;   // '#FFD700'
const cardBg = DesignTokens.colors.bgMedium;       // '#1A1A2E'

// Typography
const titleSize = DesignTokens.fontSize.display;   // 64px
const subtitleSize = DesignTokens.fontSize.large;  // 24px
const labelSize = DesignTokens.fontSize.base;      // 16px

// Cards
const cardWidth = DesignTokens.card.level.width;         // 200px
const cardHeight = DesignTokens.card.level.height;       // 280px
const cardRadius = DesignTokens.card.level.borderRadius; // 16px

// Difficulty Colors
const difficultyColors = {
    beginner: DesignTokens.colors.difficulty.easy,        // '#4ECDC4'
    intermediate: DesignTokens.colors.difficulty.medium,  // '#FFD93D'
    master: DesignTokens.colors.difficulty.hard          // '#FF6B6B'
};
```

### Level Card Design

**Card Structure** (using DesignTokens):

```javascript
// Card dimensions
const CARD = {
    width: DesignTokens.card.level.width,        // 200px
    height: DesignTokens.card.level.height,      // 280px
    borderRadius: DesignTokens.card.level.borderRadius, // 16px
    padding: DesignTokens.spacing.md,            // 16px
    spacing: DesignTokens.spacing.sm             // 8px
};

// Card layout (top to bottom)
// 1. Illustration (120px)
// 2. Title (32px)
// 3. Difficulty Badge (24px)
// 4. Stats (40px)
// 5. Play Button (44px) - meets accessibility min touch target
```

**Visual Hierarchy:**

```
┌──────────────────────┐
│   Illustration       │  120px (60% of 200px width)
│   (centered)         │
├──────────────────────┤
│   Level Name         │  32px (fontSize.title)
│   "Protein Plant"    │
├──────────────────────┤
│ 🟢 BEGINNER         │  24px (badge)
├──────────────────────┤
│ ⭐⭐⭐ | 🏆 2/3     │  40px (stats)
├──────────────────────┤
│   [▶ PLAY]          │  44px (button)
└──────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Core Structure (2-3 hours)

#### Task 1.1: Update MainMenuScene Layout

**File**: `src/scenes/MainMenu.js`

**Changes**:
```javascript
import { BaseScene } from '@features/core';
import { DesignTokens } from '../constants/DesignTokens.js';
import { UIManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';

export class MainMenu extends BaseScene {
    constructor() {
        super(SceneKeys.MAIN_MENU);
    }

    create() {
        const { width, height } = this.cameras.main;
        const ui = new UIManager(this, this.eventBus);

        // Create layout sections
        this.createHeroSection(width, height);
        this.createLevelGrid(width, height);
        this.createSpecialEventBanner(width, height);
        this.createFooter(width, height);
    }
}
```

**Acceptance Criteria**:
- [ ] MainMenuScene extends BaseScene
- [ ] DesignTokens imported and used
- [ ] UIManager initialized
- [ ] Four layout sections created

#### Task 1.2: Hero Section with Logo and Illustration

```javascript
createHeroSection(width, height) {
    const heroHeight = 200;
    const centerX = width / 2;
    const heroY = 60;

    // Background panel
    const heroBg = this.add.rectangle(
        centerX, heroY + heroHeight / 2,
        width * 0.9, heroHeight,
        DesignTokens.colors.bgMedium
    );
    heroBg.setStrokeStyle(3, DesignTokens.colors.primary);

    // Logo
    const logo = this.add.image(centerX, heroY + 60, 'logo');
    const logoScale = width < 768 ? 0.3 : 0.5;
    logo.setScale(logoScale);

    // Subtitle
    const subtitle = this.add.text(
        centerX, heroY + 140,
        'Select Your Challenge',
        {
            fontSize: DesignTokens.fontSize.large,
            color: DesignTokens.colors.textOnDark,
            fontFamily: DesignTokens.fontFamily.heading
        }
    ).setOrigin(0.5);

    return { heroBg, logo, subtitle };
}
```

**Acceptance Criteria**:
- [ ] Logo scales responsively (0.3x mobile, 0.5x desktop)
- [ ] Background uses DesignTokens colors
- [ ] Subtitle uses DesignTokens typography
- [ ] Centered layout

#### Task 1.3: Create Level Card Component

**New File**: `src/modules/level/LevelCardComponent.js`

```javascript
import { DesignTokens } from '../../constants/DesignTokens.js';
import { LOG } from '@observability';

/**
 * LevelCardComponent - Reusable level selection card
 */
export class LevelCardComponent {
    constructor(scene, x, y, levelData) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.data = levelData;
        this.container = null;
        this.elements = {};

        this.create();
        this.setupInteractivity();
    }

    create() {
        this.container = this.scene.add.container(this.x, this.y);

        const CARD = {
            width: DesignTokens.card.level.width,
            height: DesignTokens.card.level.height,
            radius: DesignTokens.card.level.borderRadius
        };

        // Background
        this.elements.bg = this.scene.add.rectangle(
            0, 0,
            CARD.width, CARD.height,
            DesignTokens.colors.bgMedium
        );
        this.elements.bg.setStrokeStyle(2, DesignTokens.colors.primary);

        // Illustration
        this.elements.illustration = this.scene.add.image(
            0, -80,
            this.data.illustrationKey
        );
        this.elements.illustration.setDisplaySize(120, 120);

        // Title
        this.elements.title = this.scene.add.text(
            0, -10,
            this.data.name,
            {
                fontSize: DesignTokens.fontSize.title,
                color: DesignTokens.colors.primary,
                fontFamily: DesignTokens.fontFamily.heading
            }
        ).setOrigin(0.5);

        // Difficulty badge
        const difficultyColor = this.getDifficultyColor(this.data.difficulty);
        this.elements.difficultyBadge = this.scene.add.text(
            0, 20,
            `● ${this.data.difficulty.toUpperCase()}`,
            {
                fontSize: DesignTokens.fontSize.small,
                color: difficultyColor,
                fontFamily: DesignTokens.fontFamily.body
            }
        ).setOrigin(0.5);

        // Stats (stars and completion)
        const stars = '⭐'.repeat(this.data.stars);
        const completion = `${this.data.completed}/${this.data.totalLevels}`;
        this.elements.stats = this.scene.add.text(
            0, 45,
            `${stars} | 🏆 ${completion}`,
            {
                fontSize: DesignTokens.fontSize.base,
                color: DesignTokens.colors.textOnDark
            }
        ).setOrigin(0.5);

        // Play button
        this.elements.playButton = this.scene.add.rectangle(
            0, 90,
            160, DesignTokens.accessibility.minTouchTarget,
            DesignTokens.button.primary.backgroundColor
        );
        this.elements.playButton.setStrokeStyle(2, DesignTokens.colors.primary);

        this.elements.playText = this.scene.add.text(
            0, 90,
            '▶ PLAY',
            {
                fontSize: DesignTokens.fontSize.large,
                color: DesignTokens.colors.primary,
                fontFamily: DesignTokens.fontFamily.heading
            }
        ).setOrigin(0.5);

        // Add all to container
        this.container.add([
            this.elements.bg,
            this.elements.illustration,
            this.elements.title,
            this.elements.difficultyBadge,
            this.elements.stats,
            this.elements.playButton,
            this.elements.playText
        ]);
    }

    setupInteractivity() {
        // Make entire card interactive
        this.elements.bg.setInteractive({ useHandCursor: true });

        // Hover effect
        this.elements.bg.on('pointerover', () => {
            this.scene.tweens.add({
                targets: this.container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: DesignTokens.duration.fast,
                ease: DesignTokens.easing.easeOut
            });
            this.elements.bg.setStrokeStyle(3, DesignTokens.colors.accent);
        });

        this.elements.bg.on('pointerout', () => {
            this.scene.tweens.add({
                targets: this.container,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: DesignTokens.duration.fast,
                ease: DesignTokens.easing.easeOut
            });
            this.elements.bg.setStrokeStyle(2, DesignTokens.colors.primary);
        });

        // Click handler
        this.elements.bg.on('pointerdown', () => {
            this.handleClick();
        });
    }

    handleClick() {
        LOG.info('LEVEL_SELECTED', {
            subsystem: 'ui',
            levelId: this.data.id,
            levelName: this.data.name
        });

        // Play click sound
        // AudioManager.getInstance().playSFX('ui-click');

        // Emit event
        this.scene.eventBus.emit('level:selected', {
            levelId: this.data.id,
            levelName: this.data.name
        });

        // Start level
        this.scene.scene.start('Game', {
            levelId: this.data.id
        });
    }

    getDifficultyColor(difficulty) {
        const colors = {
            beginner: DesignTokens.colors.difficulty.easy,
            intermediate: DesignTokens.colors.difficulty.medium,
            master: DesignTokens.colors.difficulty.hard,
            expert: DesignTokens.colors.difficulty.expert
        };
        return colors[difficulty.toLowerCase()] || DesignTokens.colors.textOnDark;
    }

    setLocked(locked) {
        this.data.locked = locked;
        this.elements.bg.setAlpha(locked ? 0.5 : 1.0);
        this.elements.bg.disableInteractive();

        if (locked) {
            // Add padlock icon
            this.elements.lockIcon = this.scene.add.text(
                0, 0,
                '🔒',
                { fontSize: DesignTokens.fontSize.display }
            ).setOrigin(0.5);
            this.container.add(this.elements.lockIcon);
        }
    }

    destroy() {
        this.container.destroy();
    }
}
```

**Acceptance Criteria**:
- [ ] Component creates all card elements
- [ ] Uses DesignTokens for all styling
- [ ] Hover effects smooth (60fps)
- [ ] Click emits event and starts level
- [ ] Supports locked state
- [ ] Meets accessibility min touch target (44px)

#### Task 1.4: Level Grid Layout

```javascript
createLevelGrid(width, height) {
    const gridStartY = 280;
    const cardWidth = DesignTokens.card.level.width;
    const spacing = DesignTokens.spacing.lg;

    // Calculate grid layout
    const isMobile = width < DesignTokens.breakpoints.mobile;
    const isTablet = width < DesignTokens.breakpoints.tablet;

    let columns, cardSpacing;
    if (isMobile) {
        columns = 1;
        cardSpacing = spacing;
    } else if (isTablet) {
        columns = 2;
        cardSpacing = spacing;
    } else {
        columns = 3;
        cardSpacing = spacing * 1.5;
    }

    // Level data
    const levels = [
        {
            id: 'level-1',
            name: 'Protein Plant',
            illustrationKey: 'level-1-illustration',
            difficulty: 'beginner',
            stars: 3,
            completed: 2,
            totalLevels: 3,
            locked: false
        },
        {
            id: 'level-2',
            name: 'Cardio Canyon',
            illustrationKey: 'level-2-illustration',
            difficulty: 'intermediate',
            stars: 2,
            completed: 1,
            totalLevels: 3,
            locked: false
        },
        {
            id: 'level-3',
            name: 'Muscle Mountain',
            illustrationKey: 'level-3-illustration',
            difficulty: 'master',
            stars: 1,
            completed: 0,
            totalLevels: 3,
            locked: true
        }
    ];

    // Calculate total grid width
    const totalGridWidth = (cardWidth * columns) + (cardSpacing * (columns - 1));
    const gridStartX = (width - totalGridWidth) / 2 + (cardWidth / 2);

    // Create cards
    this.levelCards = [];
    levels.forEach((levelData, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        const x = gridStartX + (col * (cardWidth + cardSpacing));
        const y = gridStartY + (row * (DesignTokens.card.level.height + cardSpacing));

        const card = new LevelCardComponent(this, x, y, levelData);
        if (levelData.locked) {
            card.setLocked(true);
        }
        this.levelCards.push(card);
    });
}
```

**Acceptance Criteria**:
- [ ] Grid adapts to screen size (1/2/3 columns)
- [ ] Cards centered horizontally
- [ ] Proper spacing using DesignTokens
- [ ] Level data drives card content
- [ ] Locked levels properly displayed

---

### Phase 2: Special Features (1-2 hours)

#### Task 2.1: Special Event Banner

```javascript
createSpecialEventBanner(width, height) {
    const bannerY = height - 180;
    const bannerWidth = Math.min(width * 0.9, 600);

    // Background with gradient
    const banner = this.add.rectangle(
        width / 2, bannerY,
        bannerWidth, 80,
        DesignTokens.colors.accent
    );

    // Apply gradient (if supported)
    // DesignTokens.applyGradient(banner, 'accentToSecondary');

    // Event text
    const eventText = this.add.text(
        width / 2, bannerY,
        '🎂 Birthday Bash Event - Unlock Bonus Levels!',
        {
            fontSize: DesignTokens.fontSize.large,
            color: DesignTokens.colors.textOnDark,
            fontFamily: DesignTokens.fontFamily.heading
        }
    ).setOrigin(0.5);

    // Pulsing animation
    this.tweens.add({
        targets: banner,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: DesignTokens.duration.slow,
        ease: DesignTokens.easing.easeInOut,
        yoyo: true,
        repeat: -1
    });

    return { banner, eventText };
}
```

**Acceptance Criteria**:
- [ ] Banner max width 600px
- [ ] Gradient background (if supported)
- [ ] Pulsing animation
- [ ] Centered text

#### Task 2.2: Footer with Reset Progress

```javascript
createFooter(width, height) {
    const footerY = height - 40;

    const resetText = this.add.text(
        width / 2, footerY,
        'Reset Progress',
        {
            fontSize: DesignTokens.fontSize.base,
            color: DesignTokens.colors.textOnDark,
            fontFamily: DesignTokens.fontFamily.body
        }
    ).setOrigin(0.5);

    resetText.setInteractive({ useHandCursor: true });

    // Hover effect
    resetText.on('pointerover', () => {
        resetText.setColor(DesignTokens.colors.accent);
    });

    resetText.on('pointerout', () => {
        resetText.setColor(DesignTokens.colors.textOnDark);
    });

    // Click handler
    resetText.on('pointerdown', () => {
        this.handleResetProgress();
    });

    return resetText;
}

handleResetProgress() {
    LOG.warn('RESET_PROGRESS_REQUESTED', {
        subsystem: 'ui',
        message: 'User requested progress reset'
    });

    // Show confirmation dialog
    // GameStateManager.getInstance().resetProgress();
}
```

**Acceptance Criteria**:
- [ ] Positioned at bottom
- [ ] Hover color change
- [ ] Confirmation before reset
- [ ] Logs action

---

### Phase 3: Responsive & Accessibility (1 hour)

#### Task 3.1: Responsive Layout Handler

```javascript
handleResize(width, height) {
    // Re-layout on resize
    this.children.removeAll();
    this.create();
}

init() {
    // Listen for resize events
    this.scale.on('resize', (gameSize) => {
        this.handleResize(gameSize.width, gameSize.height);
    });
}
```

#### Task 3.2: Keyboard Navigation

```javascript
setupKeyboardNavigation() {
    let focusedCardIndex = 0;

    this.input.keyboard.on('keydown-TAB', (event) => {
        event.preventDefault();
        focusedCardIndex = (focusedCardIndex + 1) % this.levelCards.length;
        this.focusCard(focusedCardIndex);
    });

    this.input.keyboard.on('keydown-ENTER', () => {
        if (this.levelCards[focusedCardIndex]) {
            this.levelCards[focusedCardIndex].handleClick();
        }
    });
}

focusCard(index) {
    // Remove focus from all cards
    this.levelCards.forEach(card => {
        card.elements.bg.setStrokeStyle(2, DesignTokens.colors.primary);
    });

    // Add focus to selected card
    const card = this.levelCards[index];
    card.elements.bg.setStrokeStyle(4, DesignTokens.colors.accent);

    LOG.dev('CARD_FOCUSED', {
        subsystem: 'ui',
        index,
        levelId: card.data.id
    });
}
```

**Acceptance Criteria**:
- [ ] TAB cycles through cards
- [ ] ENTER selects focused card
- [ ] Visual focus indicator
- [ ] Keyboard-accessible footer

---

### Phase 4: Polish & Animation (1 hour)

#### Task 4.1: Entry Animations

```javascript
animateEntry() {
    // Stagger card entrance
    this.levelCards.forEach((card, index) => {
        card.container.setAlpha(0);
        card.container.setScale(0.8);

        this.tweens.add({
            targets: card.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: DesignTokens.duration.normal,
            ease: DesignTokens.easing.easeOut,
            delay: index * 100 // Stagger by 100ms
        });
    });
}
```

#### Task 4.2: Audio Integration

```javascript
import { AudioManager } from '@features/core';

// In setupInteractivity()
this.elements.bg.on('pointerover', () => {
    AudioManager.getInstance().playSFX('ui-hover');
    // ... rest of hover logic
});

this.elements.bg.on('pointerdown', () => {
    AudioManager.getInstance().playSFX('ui-click');
    // ... rest of click logic
});
```

**Acceptance Criteria**:
- [ ] Cards animate in on scene start
- [ ] Hover sound plays
- [ ] Click sound plays
- [ ] Smooth 60fps animations

---

## Responsive Design

### Breakpoint Behavior

| Screen Size | Layout | Cards per Row | Adjustments |
|-------------|--------|---------------|-------------|
| Mobile (< 480px) | Single column | 1 | Logo 0.3x scale, reduced padding |
| Tablet (480-768px) | Two column | 2 | Logo 0.4x scale, medium padding |
| Desktop (> 768px) | Three column | 3 | Logo 0.5x scale, full padding |

### Responsive Font Sizing

```javascript
// Use helper function for responsive text
const titleSize = DesignTokens.getResponsiveFontSize('display', 0.8);

const title = this.add.text(x, y, 'Title', {
    fontSize: titleSize,
    color: DesignTokens.colors.primary
});
```

---

## Accessibility

### WCAG AA Compliance

✅ **Color Contrast**: All text meets 4.5:1 minimum
- Primary text on dark: `#FFFFFF` on `#0F1B2B` (15:1)
- Accent text on dark: `#FFD700` on `#0F1B2B` (8:1)

✅ **Touch Targets**: All interactive elements ≥ 44px
- Play buttons: 44px height
- Reset link: 44px touch area
- Cards: Full card clickable

✅ **Keyboard Navigation**: TAB and ENTER support
- TAB cycles through cards
- ENTER selects card
- Visual focus indicator

✅ **Screen Reader**: ARIA labels
```javascript
this.elements.bg.setData('ariaLabel', `Select ${this.data.name} level - ${this.data.difficulty}`);
this.elements.bg.setData('ariaRole', 'button');
```

---

## Testing Checklist

### Visual QA

- [ ] Layout fills viewport on all breakpoints (320px → 1440px)
- [ ] Cards resize and reflow properly
- [ ] Logo scales responsively
- [ ] Special event banner max width 600px
- [ ] Footer pinned to bottom
- [ ] Colors match DesignTokens
- [ ] Typography matches DesignTokens

### Interaction QA

- [ ] Hover effects smooth (60fps)
- [ ] Click starts level correctly
- [ ] Locked levels not clickable
- [ ] Reset progress shows confirmation
- [ ] Keyboard navigation works
- [ ] Audio feedback plays

### Responsive QA

- [ ] Mobile (320px): 1 column, readable text
- [ ] Tablet (768px): 2 columns, proper spacing
- [ ] Desktop (1024px+): 3 columns, centered
- [ ] Rotation handling (portrait/landscape)

### Accessibility QA

- [ ] Screen reader announces cards
- [ ] Keyboard-only navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44px

### Performance QA

- [ ] 60fps animations
- [ ] No layout jank on resize
- [ ] Assets load quickly
- [ ] Memory usage stable

---

## Integration Testing

### Test with Existing Systems

```javascript
// Test LoadingScreenManager integration
import { LoadingScreenManager } from '@features/core';

const loading = LoadingScreenManager.getInstance();
loading.show(this, {
    title: 'Loading Level...',
    showProgress: true
});

// Simulate level load
setTimeout(() => {
    loading.hide().then(() => {
        this.scene.start('Game', { levelId: 'level-1' });
    });
}, 2000);
```

**Test Cases**:
- [ ] LoadingScreen shows when level selected
- [ ] Progress updates during load
- [ ] LoadingScreen hides before game starts
- [ ] No visual glitches during transition

---

## Related Documentation

**Core Architecture:**
- [UI/UX Architecture](../architecture/UI_UX_ARCHITECTURE.md) - Design system and patterns
- [DesignTokens](../architecture/UI_UX_ARCHITECTURE.md#design-tokens) - Design token reference
- [Responsive Design](../architecture/UI_UX_ARCHITECTURE.md#responsive-design) - Adaptive layouts
- [Accessibility](../architecture/UI_UX_ARCHITECTURE.md#accessibility) - WCAG compliance

**Component Systems:**
- [UIManager](../systems/UIManager.md) - UI element management
- [LoadingScreenManager](../systems/LOADING_SCREEN_ARCHITECTURE.md) - Loading screens
- [BaseScene](../architecture/adrs/ADR-001-vendor-abstraction-layer.md) - Scene abstraction

**Design Guidelines:**
- [Art Style Guide](../design/ArtStyleAndAssetPlan.md) - Visual design
- [Game Design Principles](../design/GameDesignPrinciples.md) - UX principles

**Implementation:**
- [Level System](LevelImplementationArchitecture.md) - Level architecture
- [MainMenu Scene](../../src/scenes/MainMenu.js) - Current implementation

---

## Deliverables

### Phase 1 (Core):
- [ ] Updated `MainMenu.js` with new layout
- [ ] New `LevelCardComponent.js` component
- [ ] Hero section with responsive logo
- [ ] Level grid with 1-3 columns adaptive layout

### Phase 2 (Features):
- [ ] Special event banner with animation
- [ ] Footer with reset progress
- [ ] Locked level state
- [ ] Level completion badges

### Phase 3 (Accessibility):
- [ ] Keyboard navigation (TAB/ENTER)
- [ ] ARIA labels for screen readers
- [ ] Contrast ratios verified
- [ ] Touch target sizes verified

### Phase 4 (Polish):
- [ ] Entry animations (staggered cards)
- [ ] Hover/click audio feedback
- [ ] Smooth transitions (60fps)
- [ ] LoadingScreen integration

---

## Next Steps

**After QA Passes:**
1. Add particle effects on card hover (optional)
2. Implement level preview (modal/overlay)
3. Add achievement display
4. Create special event variant themes

**Future Enhancements:**
- [ ] Level preview modal
- [ ] Achievement badges on cards
- [ ] Leaderboard integration
- [ ] Social sharing features
- [ ] Custom themes (birthday mode, holiday mode)

---

**Maintained By**: UI/UX Team
**Estimated Effort**: 5-7 hours total
**Last Reviewed**: November 2, 2025
**Status**: Ready for Implementation
