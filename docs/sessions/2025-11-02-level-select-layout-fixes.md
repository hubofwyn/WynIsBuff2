# Level Select Layout System - Nov 2, 2025

## Critical Lessons

### 1. Phaser Positioning Model
**Phaser GameObjects position by CENTER, not edges.** Layout calculations must add half-height offsets:
```javascript
// WRONG: Positions card center where top edge should be
this.layout.grid.startY = currentY;

// CORRECT: Accounts for center-based positioning
this.layout.grid.startY = currentY + (cardHeight / 2);
```

### 2. Two-Pass Layout Calculation
**First calculate relative to Y=0, then apply centering offset:**
```javascript
// Pass 1: Calculate total height
let currentY = 0;
// ... position all elements ...
const totalHeight = currentY;

// Pass 2: Center vertically (50/50 split)
const verticalOffset = (viewportHeight - totalHeight) / 2;
// ... apply offset to all elements ...
```

### 3. Dynamic Card Layout
**Sequential positioning with bounds measurement prevents text overlap:**
```javascript
let currentY = -halfHeight;
const element1 = createText(...);
const bounds1 = element1.getBounds();
element1.setY(currentY + bounds1.height / 2);
currentY += bounds1.height + spacing;
// ... repeat for each element ...
```

### 4. Generous Sizing Philosophy
Match reference screens (WelcomeScene) by keeping elements large:
- Logo: 0.3/0.4/0.5 scale (not 0.2/0.25/0.35)
- Cards: Full size (280px) on constrained viewports
- Spacing: 1.2x on large screens for breathing room

## Implementation

**MainMenu.js (src/scenes/MainMenu.js)**

Key sections:
- Lines 84-109: `updateBreakpoint()` - Sets logo/card scales per viewport
- Lines 124-284: `calculateLayout()` - Two-pass layout with centering
- Lines 194-204: Grid positioning with center-point offset correction

**LevelCardComponent.js (src/modules/level/LevelCardComponent.js)**

Key sections:
- Lines 70-75: `scaleFactorHeight` calculation for compact mode
- Lines 184-295: `createContent()` - Dynamic sequential layout with bounds measurement

## Scaling Configuration

| Viewport | Logo Scale | Card Scale | Spacing Scale |
|----------|------------|------------|---------------|
| <800px   | 0.3 × 0.7  | 1.0        | 0.8           |
| 800-900px| 0.4 × 0.85 | 1.0        | 0.9           |
| >900px   | 0.5 × 1.0  | 1.1        | 1.2           |

## Reference Screens

- **WelcomeScene.js**: Uses percentage positioning (0.25, 0.35, 0.65, 0.75) for natural fill
- **MainMenu.js**: Uses measured heights + true centering (50/50 split) to match

## Common Pitfalls

1. **Forgetting center-point positioning**: Always add `height/2` when calculating where objects should be
2. **Top-justification**: Use 50/50 centering, not arbitrary top margins
3. **Over-scaling**: Keep interactive elements large (cards, buttons) - scale decorative elements (logo) more aggressively
4. **Fixed positions in containers**: Measure bounds and position sequentially to prevent overlap
