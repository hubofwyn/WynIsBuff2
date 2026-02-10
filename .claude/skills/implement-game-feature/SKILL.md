# Implement Game Feature

Execute a complete game feature development workflow for WynIsBuff2.

## Usage

`/implement-game-feature "Feature description"`

## Workflow

1. **Design Phase** (game-design-innovator)
   - Analyze feature requirements and player impact
   - Design mechanics that fit skill-to-automation loop
   - Define player experience goals

2. **Architecture Phase** (architecture-guardian)
   - Validate import patterns and manager usage
   - Ensure event-driven integration
   - Check constants usage and vendor abstraction

3. **Implementation Phase** (game-physics-expert)
   - Implement physics mechanics and interactions
   - Optimize for 60 FPS performance
   - Integrate with existing movement systems

4. **Validation Phase** (architecture-guardian)
   - Final architectural review
   - Run `bun test` and `bun run arch:health`
   - Verify event consistency and structured logging

## Quality Gates

- Uses barrel exports (@features/*)
- Follows manager patterns (extends BaseManager)
- No magic strings (uses constants)
- No vendor imports outside src/core/
- Proper event naming (namespace:action)
- Structured logging (LOG, not console.*)
- Performance benchmarks met
- Tests passing
