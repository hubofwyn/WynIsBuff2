# Implement Game Feature

Execute a complete game feature development workflow for WynIsBuff2.

## Usage
`/implement-game-feature "Feature description"`

## Workflow
1. **Design Phase** (game-design-innovator)
   - Analyze feature requirements and player impact
   - Design mechanics that fit skill-to-automation loop
   - Define player experience goals
   - Create interaction patterns

2. **Architecture Phase** (architecture-guardian)
   - Review design for architectural compliance
   - Validate import patterns and manager usage
   - Ensure event-driven integration
   - Check constants usage

3. **Implementation Phase** (game-physics-expert)
   - Implement physics mechanics and interactions
   - Optimize for 60 FPS performance
   - Integrate with existing movement systems
   - Add collision detection and responses

4. **Validation Phase** (architecture-guardian)
   - Final architectural review
   - Test integration with existing systems
   - Verify event consistency
   - Ensure documentation completeness

## Quality Gates
- ✅ Uses barrel exports (@features/*)
- ✅ Follows manager patterns (extends BaseManager)
- ✅ No magic strings (uses constants)
- ✅ Proper event naming (namespace:action)
- ✅ Performance benchmarks met
- ✅ Integration tests passing

## Example Usage
```
/implement-game-feature "Wall-slide mechanic that slows descent and enables wall jumps"
```

This command automatically routes through the appropriate agents based on complexity and requirements.