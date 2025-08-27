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

2. **Investigation Phase** (parallel execution)
   - **physics-profiler**: Check frame timing and performance
   - **collision-analyzer**: Examine collision detection patterns  
   - **movement-validator**: Verify movement controller logic

3. **Solution Phase** (game-physics-expert)
   - Implement targeted fix
   - Optimize affected systems
   - Add preventive measures
   - Update physics documentation

4. **Validation Phase** (architecture-guardian)
   - Ensure fix doesn't break architectural patterns
   - Verify no performance regressions
   - Check integration with other systems
   - Update tests if needed

## Physics-Specific Checks
- ✅ Collision detection accuracy
- ✅ 60 FPS performance maintained
- ✅ Memory usage within bounds
- ✅ No physics body leaks
- ✅ Proper force/velocity calculations
- ✅ Integration with Rapier engine

## Common Issues Handled
- Collision detection problems
- Performance bottlenecks
- Movement jitter or stuttering
- Physics body lifecycle issues
- Integration problems with Phaser/Rapier

## Example Usage
```
/debug-physics-issue "Player sometimes passes through platforms when moving fast"
```

The system automatically profiles physics performance and analyzes collision patterns to identify the root cause.