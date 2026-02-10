# Debug Physics Issue

Multi-agent physics debugging workflow for WynIsBuff2.

## Usage
`/debug-physics-issue "Physics problem description"`

## Workflow

1. **Analysis Phase** (game-physics-expert)
   - Analyze reported physics behavior
   - Identify potential root causes
   - Check performance metrics
   - Review collision detection logic

2. **Investigation Phase**
   - Check frame timing and performance
   - Examine collision detection patterns
   - Verify movement controller logic
   - Query observability: `window.debugAPI.analyzeSubsystem('physics')`

3. **Solution Phase** (game-physics-expert)
   - Implement targeted fix
   - Optimize affected systems
   - Add preventive measures

4. **Validation Phase** (architecture-guardian)
   - Ensure fix maintains architectural patterns
   - Verify no performance regressions
   - Run `bun test`

## Physics Checks
- Collision detection accuracy
- 60 FPS performance maintained
- No physics body leaks
- Proper force/velocity calculations
- Integration with Rapier 0.19.x via PhysicsManager
