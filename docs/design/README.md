# Game Design Documentation

Game design principles, visual guidelines, and creative direction for WynIsBuff2.

## Contents

| Document | Purpose |
|----------|---------|
| [GameDesignPrinciples.md](./GameDesignPrinciples.md) | Core design principles and philosophy |
| [MVPLevelDesignGuide.md](./MVPLevelDesignGuide.md) | Level design guidelines and patterns |
| [SillyMechanicsIdeas.md](./SillyMechanicsIdeas.md) | Creative mechanic ideas and brainstorming |
| [ArtStyleAndAssetPlan.md](./ArtStyleAndAssetPlan.md) | Art direction and visual style guide |
| [AssetManagementStrategy.md](./AssetManagementStrategy.md) | Asset workflow and organization |
| [pixelart-style.md](./pixelart-style.md) | Pixel art guidelines and specifications |

## Design Philosophy

### Core Principles
- **Direct, responsive controls**: Immediate player feedback
- **Physics-based fun**: Emergent gameplay through physics interactions
- **Progressive challenge**: Skill-based difficulty scaling
- **Visual clarity**: Clear communication through art and effects

### Game Feel
- Subtle scaling on jumps (1.0x → 1.05x → 1.1x)
- Squash/stretch on landing
- Particle effects for actions
- Camera shake for impact
- Player glow and atmospheric effects

## Visual Style

### Pixel Art Guidelines
- Consistent resolution and scaling
- Limited color palette for cohesion
- Readable sprites at game resolution
- Smooth animations at appropriate frame rates

### Asset Management
- Assets defined in `assets/manifest.json`
- Generated constants via `npm run generate-assets`
- Organized directory structure in `assets/`
- No hardcoded asset paths

## Level Design

### Level Structure
- Clear goals and progression
- Balanced challenge and rewards
- Environmental storytelling
- Collectible placement for exploration

### Design Iteration
1. Prototype mechanic/layout
2. Playtest for feel and difficulty
3. Refine based on feedback
4. Polish with visual effects

## Related Documentation

- [../features/](../features/) - Feature implementations
- [../systems/](../systems/) - System documentation
- [../INDEX.md](../INDEX.md) - Full documentation index
