# UI/UX Architecture - WynIsBuff2

**Last Updated**: November 2, 2025
**Status**: ✅ Active
**Purpose**: Unified guide for UI/UX architecture, design system, and best practices

---

## Quick Navigation

| I want to... | Go to... |
|--------------|----------|
| **Understand design system** | [Design Tokens](#design-tokens) |
| **Create UI elements** | [UIManager](../systems/UIManager.md) |
| **Add loading screens** | [Loading Screens](../systems/LOADING_SCREEN_ARCHITECTURE.md) |
| **Implement responsive design** | [Responsive Design](#responsive-design) |
| **Ensure accessibility** | [Accessibility](#accessibility) |
| **Migrate from UIConfig** | [Migration Guide](#migration-guide) |
| **Follow best practices** | [Best Practices](#best-practices) |

---

## Overview

WynIsBuff2's UI/UX architecture provides a **consistent, accessible, and responsive** user interface across all game screens. The architecture is built on three pillars:

1. **Design System** - DesignTokens provide single source of truth for all design values
2. **Component Management** - UIManager and specialized managers handle UI lifecycle
3. **Responsive & Accessible** - WCAG AA compliance with adaptive layouts

### Design Principles

1. **Consistency** - Same patterns across all screens
2. **Responsive** - Proper proportions on all device sizes
3. **Accessible** - WCAG AA standards, keyboard navigation, screen readers
4. **Observable** - All UI actions logged via observability system
5. **Performant** - Minimal overhead, smooth 60fps animations
6. **Themeable** - Design tokens allow easy re-skinning

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Game Scenes Layer                     │
│    (Boot, Preloader, MainMenu, Game, Settings, etc.)  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│              UI Component Managers                      │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │ UIManager    │  │ LoadingScreen  │  │ Subtitle    │ │
│  │ (elements)   │  │ Manager        │  │ System      │ │
│  └──────────────┘  └────────────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  Design System                          │
│              ┌────────────────────┐                     │
│              │   DesignTokens     │                     │
│              │ (spacing, colors,  │                     │
│              │  typography, etc.) │                     │
│              └────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## Design Tokens

**File**: `src/constants/DesignTokens.js`

**Purpose**: Single source of truth for all design values (spacing, colors, typography, animations)

### What are Design Tokens?

Design tokens are **named constants** that store visual design attributes. Instead of hardcoding values like `fontSize: 24` or `color: '#FFD700'`, you use semantic tokens like `DesignTokens.fontSize.large` or `DesignTokens.colors.accent`.

**Benefits**:
- ✅ Consistent design across all screens
- ✅ Easy global theming (change one value, update everywhere)
- ✅ Responsive by default (helper functions for scaling)
- ✅ Type-safe (clear structure, autocomplete-friendly)
- ✅ Self-documenting (semantic names)

### Token Categories

#### 1. Spacing Scale (8px base unit)

```javascript
import { DesignTokens } from '../constants/DesignTokens.js';

// Use spacing tokens for consistent padding/margins
const padding = DesignTokens.spacing.md;  // 16px
const margin = DesignTokens.spacing.lg;   // 24px

// Available scales:
// xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px, xxxl: 64px
```

#### 2. Color Palette

```javascript
// Brand colors
DesignTokens.colors.primary    // '#FFD700' (gold)
DesignTokens.colors.secondary  // '#1E90FF' (blue)
DesignTokens.colors.accent     // '#FF6B6B' (red)

// Semantic colors
DesignTokens.colors.success    // '#4ECDC4'
DesignTokens.colors.warning    // '#FFE66D'
DesignTokens.colors.error      // '#FF6B6B'

// Background colors
DesignTokens.colors.bgDark     // '#0F1B2B'
DesignTokens.colors.bgMedium   // '#1A1A2E'
DesignTokens.colors.bgLight    // '#16213E'

// Difficulty colors (for level cards)
DesignTokens.colors.difficulty.easy      // '#4ECDC4'
DesignTokens.colors.difficulty.medium    // '#FFD93D'
DesignTokens.colors.difficulty.hard      // '#FF6B6B'
DesignTokens.colors.difficulty.expert    // '#9D4EDD'
```

#### 3. Typography System

```javascript
// Font sizes (responsive)
DesignTokens.fontSize.displayLarge  // 72px
DesignTokens.fontSize.display       // 64px
DesignTokens.fontSize.displaySmall  // 56px
DesignTokens.fontSize.heading       // 48px
DesignTokens.fontSize.title         // 32px
DesignTokens.fontSize.large         // 24px
DesignTokens.fontSize.base          // 16px
DesignTokens.fontSize.small         // 14px
DesignTokens.fontSize.tiny          // 12px

// Font weights
DesignTokens.fontWeight.regular     // 400
DesignTokens.fontWeight.medium      // 500
DesignTokens.fontWeight.bold        // 700
DesignTokens.fontWeight.extraBold   // 900

// Font families
DesignTokens.fontFamily.heading     // 'Impact, Arial Black, sans-serif'
DesignTokens.fontFamily.body        // 'Arial, sans-serif'
DesignTokens.fontFamily.monospace   // 'Courier New, monospace'
```

#### 4. Component Styles

```javascript
// Buttons
DesignTokens.button.primary         // { bg, color, border, hover, active }
DesignTokens.button.secondary       // Outlined style
DesignTokens.button.danger          // Red/warning style
DesignTokens.button.ghost           // Transparent background

// Cards (level selection, features)
DesignTokens.card.level.width       // 200px
DesignTokens.card.level.height      // 280px
DesignTokens.card.level.borderRadius // 16px

// Panels (menus, settings)
DesignTokens.panel.default          // { bg, border, shadow, padding }
```

### Helper Functions

```javascript
// Responsive font sizing
const titleSize = DesignTokens.getResponsiveFontSize('display', 0.8);

// Colors with transparency
const semiTransparent = DesignTokens.getColorWithAlpha('primary', 0.5);

// Apply gradient to graphics
DesignTokens.applyGradient(graphics, 'primaryToSecondary');
```

### Usage Example

```javascript
import { BaseScene } from '@features/core';
import { DesignTokens } from '../constants/DesignTokens.js';

export class MyScene extends BaseScene {
    create() {
        // Use tokens for consistent styling
        const title = this.add.text(512, 100, 'My Title', {
            fontSize: DesignTokens.fontSize.display,
            color: DesignTokens.colors.primary,
            fontFamily: DesignTokens.fontFamily.heading
        });

        // Use spacing for layout
        const button = this.add.rectangle(
            512,
            300,
            200,
            50,
            DesignTokens.colors.bgMedium
        );

        // Position using spacing tokens
        button.y = title.y + title.height + DesignTokens.spacing.xl;
    }
}
```

---

## Component Systems

### 1. UIManager

**File**: `src/modules/UIManager.js`
**Documentation**: [UIManager.md](../systems/UIManager.md)

**Purpose**: Centralized management of UI elements (text, buttons, groups)

**Key Features**:
- Create and manage text elements
- Create interactive buttons with callbacks
- Group related UI elements
- Responsive positioning (relative to screen edges)
- Event-based updates
- Visibility control

**Usage**:
```javascript
import { UIManager } from '@features/core';
import { DesignTokens } from '../constants/DesignTokens.js';

const uiManager = new UIManager(this, this.eventSystem);

// Create text with design tokens
uiManager.createText('title', 512, 100, 'Welcome', {
    fontSize: DesignTokens.fontSize.heading,
    color: DesignTokens.colors.primary
});

// Create button
uiManager.createButton('playButton', 512, 300, 'button', () => {
    this.scene.start('Game');
});

// Group elements
uiManager.createGroup('mainMenu');
uiManager.addToGroup('mainMenu', 'title');
uiManager.addToGroup('mainMenu', 'playButton');
```

### 2. LoadingScreenManager

**File**: `src/core/LoadingScreenManager.js`
**Documentation**: [LOADING_SCREEN_ARCHITECTURE.md](../systems/LOADING_SCREEN_ARCHITECTURE.md)

**Purpose**: Unified loading screen system for all loading scenarios

**Key Features**:
- Show/hide with fade animations
- Progress bar with percentage
- Status message updates
- Animated spinner (60fps)
- Logo display with pulse animation
- Responsive scaling across devices
- Full observability integration

**Usage**:
```javascript
import { LoadingScreenManager } from '@features/core';

const loadingManager = LoadingScreenManager.getInstance();

// Show loading screen
loadingManager.show(this, {
    title: 'Loading Level 1',
    showLogo: true,
    showProgress: true,
    message: 'Preparing game...'
});

// Update progress
loadingManager.updateProgress(0.5, 'Loading assets...');

// Hide when done
await loadingManager.hide(300);
```

### 3. Subtitle System

**Documentation**: [SUBTITLE_SYSTEM.md](../SUBTITLE_SYSTEM.md)

**Purpose**: Accessibility feature for captions and subtitles

**Key Features**:
- Display subtitles for audio/dialog
- Queuing system for multiple subtitles
- Customizable styling
- Keyboard-accessible toggling

---

## Responsive Design

### Breakpoint System

```javascript
// Defined in DesignTokens
DesignTokens.breakpoints = {
    mobile: 480,   // < 480px
    tablet: 768,   // < 768px
    desktop: 1024  // >= 1024px
};
```

### Responsive Patterns

#### 1. Adaptive Font Sizes

```javascript
const width = this.cameras.main.width;
const titleSize = width < DesignTokens.breakpoints.mobile
    ? DesignTokens.fontSize.displaySmall
    : DesignTokens.fontSize.display;

const title = this.add.text(x, y, 'Title', {
    fontSize: titleSize,
    color: DesignTokens.colors.primary
});
```

#### 2. Responsive Scaling

```javascript
// Use helper function
const responsiveSize = DesignTokens.getResponsiveFontSize('display', 0.8);

// Logo scales based on viewport
const logoScale = width < 480 ? 0.3 :
                  width < 768 ? 0.4 : 0.5;
```

#### 3. Adaptive Layouts

```javascript
// Stack vertically on mobile, horizontal on desktop
const isMobile = width < DesignTokens.breakpoints.mobile;
const spacing = isMobile ? DesignTokens.spacing.lg : DesignTokens.spacing.xl;
const layout = isMobile ? 'vertical' : 'horizontal';

if (layout === 'vertical') {
    // Stack buttons vertically
    buttons.forEach((btn, i) => {
        btn.y = startY + (i * (buttonHeight + spacing));
    });
} else {
    // Place buttons horizontally
    buttons.forEach((btn, i) => {
        btn.x = startX + (i * (buttonWidth + spacing));
    });
}
```

---

## Accessibility

### WCAG AA Compliance

WynIsBuff2 follows **WCAG 2.1 Level AA** standards:

#### 1. Color Contrast

```javascript
// All text meets 4.5:1 contrast ratio minimum
DesignTokens.accessibility.minContrastRatio = 4.5;

// High contrast colors provided
DesignTokens.colors.textOnDark  // '#FFFFFF' (white on dark backgrounds)
DesignTokens.colors.textOnLight // '#000000' (black on light backgrounds)
```

#### 2. Touch Targets

```javascript
// Minimum 44x44px touch target size
DesignTokens.accessibility.minTouchTarget = 44;

// All buttons meet minimum size
const button = this.add.rectangle(x, y,
    Math.max(width, DesignTokens.accessibility.minTouchTarget),
    Math.max(height, DesignTokens.accessibility.minTouchTarget),
    color
);
```

#### 3. Keyboard Navigation

```javascript
// UIManager supports keyboard navigation
this.input.keyboard.on('keydown-TAB', () => {
    this.uiManager.focusNextElement();
});

this.input.keyboard.on('keydown-ENTER', () => {
    this.uiManager.activateFocusedElement();
});
```

#### 4. Screen Reader Support

```javascript
// ARIA labels for UI elements
button.setData('ariaLabel', 'Start Game');
button.setData('ariaRole', 'button');

// Subtitle system for audio content
// See SUBTITLE_SYSTEM.md for full docs
```

---

## Best Practices

### ✅ DO

**Use Design Tokens**
```javascript
// ✅ GOOD - Using design tokens
const title = this.add.text(x, y, 'Title', {
    fontSize: DesignTokens.fontSize.heading,
    color: DesignTokens.colors.primary
});
```

**Group Related UI**
```javascript
// ✅ GOOD - Grouping UI elements
this.uiManager.createGroup('pauseMenu');
this.uiManager.addToGroup('pauseMenu', 'resumeButton');
this.uiManager.addToGroup('pauseMenu', 'settingsButton');
this.uiManager.addToGroup('pauseMenu', 'quitButton');

// Easy show/hide
this.uiManager.showGroup('pauseMenu');
```

**Use LoadingScreenManager**
```javascript
// ✅ GOOD - Using unified loading system
const loading = LoadingScreenManager.getInstance();
loading.show(this, { title: 'Loading...' });
```

**Responsive Design**
```javascript
// ✅ GOOD - Adapting to screen size
const width = this.cameras.main.width;
const cardWidth = width < 480 ? 150 : 200;
```

### ❌ DON'T

**Hardcode Design Values**
```javascript
// ❌ BAD - Magic numbers
const title = this.add.text(x, y, 'Title', {
    fontSize: 48,
    color: '#FFD700'
});

// ✅ GOOD
const title = this.add.text(x, y, 'Title', {
    fontSize: DesignTokens.fontSize.heading,
    color: DesignTokens.colors.primary
});
```

**Create UI Without Manager**
```javascript
// ❌ BAD - Managing UI manually
this.title = this.add.text(x, y, 'Title', style);
this.button = this.add.rectangle(x, y, w, h, color);
// ... lots of manual tracking

// ✅ GOOD
this.uiManager.createText('title', x, y, 'Title', style);
this.uiManager.createButton('button', x, y, w, h, callback);
```

**Ignore Accessibility**
```javascript
// ❌ BAD - Too small touch targets
const button = this.add.rectangle(x, y, 20, 20, color);

// ✅ GOOD
const button = this.add.rectangle(x, y,
    DesignTokens.accessibility.minTouchTarget,
    DesignTokens.accessibility.minTouchTarget,
    color
);
```

**Use UIConfig (Deprecated)**
```javascript
// ❌ BAD - Using deprecated UIConfig
import { UIConfig } from '../constants/UIConfig.js';
const style = UIConfig.text.title;

// ✅ GOOD - Using DesignTokens
import { DesignTokens } from '../constants/DesignTokens.js';
const style = {
    fontSize: DesignTokens.fontSize.display,
    color: DesignTokens.colors.primary
};
```

---

## Migration Guide

### Migrating from UIConfig to DesignTokens

**Why migrate?**
- ✅ More comprehensive design system
- ✅ Responsive helpers
- ✅ Better accessibility support
- ✅ Consistent with new codebase standards

**Migration Steps:**

#### Step 1: Update Imports

```javascript
// Before
import { UIConfig } from '../constants/UIConfig.js';

// After
import { DesignTokens } from '../constants/DesignTokens.js';
```

#### Step 2: Replace Text Styles

```javascript
// Before (UIConfig)
const title = this.add.text(x, y, 'Title', UIConfig.text.title);

// After (DesignTokens)
const title = this.add.text(x, y, 'Title', {
    fontSize: DesignTokens.fontSize.display,
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fontFamily.heading,
    stroke: DesignTokens.colors.bgDark,
    strokeThickness: 4
});
```

#### Step 3: Replace Button Styles

```javascript
// Before (UIConfig)
const style = UIConfig.menuButton;

// After (DesignTokens)
const buttonStyle = DesignTokens.button.primary;
const textStyle = {
    fontSize: DesignTokens.fontSize.large,
    color: buttonStyle.color,
    fontFamily: DesignTokens.fontFamily.heading
};
```

#### Step 4: Replace Animations

```javascript
// Before (UIConfig)
this.tweens.add({
    targets: element,
    scaleX: UIConfig.animations.buttonHover.scale,
    scaleY: UIConfig.animations.buttonHover.scale,
    duration: UIConfig.animations.buttonHover.duration
});

// After (DesignTokens)
this.tweens.add({
    targets: element,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: DesignTokens.duration.fast,
    ease: DesignTokens.easing.easeOut
});
```

#### Step 5: Replace Card Styles

```javascript
// Before (UIConfig)
const card = UIConfig.characterSelect;

// After (DesignTokens)
const card = {
    width: DesignTokens.card.level.width,
    height: DesignTokens.card.level.height,
    borderRadius: DesignTokens.card.level.borderRadius,
    backgroundColor: DesignTokens.colors.bgMedium,
    borderColor: DesignTokens.colors.primary
};
```

### Complete Migration Checklist

- [ ] Replace all `UIConfig` imports with `DesignTokens`
- [ ] Update text styles to use font size/color/family tokens
- [ ] Update button styles to use button tokens
- [ ] Update animation durations to use duration tokens
- [ ] Update spacing to use spacing scale
- [ ] Update colors to use color palette
- [ ] Test responsive behavior on mobile/tablet/desktop
- [ ] Verify accessibility (contrast, touch targets)
- [ ] Remove `UIConfig.js` import from file

---

## Related Documentation

### Core Documentation
- [LOADING_SCREEN_ARCHITECTURE.md](../systems/LOADING_SCREEN_ARCHITECTURE.md) - Complete loading screen guide
- [UIManager.md](../systems/UIManager.md) - UI component management
- [SUBTITLE_SYSTEM.md](../SUBTITLE_SYSTEM.md) - Accessibility subtitles

### Design Guidelines
- [ArtStyleAndAssetPlan.md](../design/ArtStyleAndAssetPlan.md) - Visual design guide
- [pixelart-style.md](../design/pixelart-style.md) - Pixel art guidelines

### Implementation
- [game-settings.md](../game-settings.md) - Settings UI implementation tasks

### Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall system architecture
- [ADR-001: Vendor Abstraction](adrs/ADR-001-vendor-abstraction-layer.md) - BaseScene pattern

---

## Quick Reference

### Common Patterns

**Create a Menu Screen:**
```javascript
import { BaseScene } from '@features/core';
import { DesignTokens } from '../constants/DesignTokens.js';
import { UIManager } from '@features/core';

export class MyMenuScene extends BaseScene {
    create() {
        const ui = new UIManager(this, this.eventBus);

        // Title
        ui.createText('title', 512, 100, 'My Menu', {
            fontSize: DesignTokens.fontSize.display,
            color: DesignTokens.colors.primary
        });

        // Buttons
        const buttons = ['Play', 'Settings', 'Quit'];
        buttons.forEach((label, i) => {
            const y = 300 + (i * (50 + DesignTokens.spacing.md));
            ui.createButton(`btn_${label}`, 512, y, 200, 50,
                () => this.handleButton(label)
            );
        });
    }
}
```

**Show Loading Screen:**
```javascript
import { LoadingScreenManager } from '@features/core';

// In preload()
const loading = LoadingScreenManager.getInstance();
loading.show(this, {
    title: 'Loading Level 1',
    showProgress: true
});

this.load.on('progress', (value) => {
    loading.updateProgress(value);
});

// In create()
await loading.hide();
```

---

**Last Reviewed**: November 2, 2025
**Next Review**: After major UI/UX updates
**Maintainer**: Architecture Team
