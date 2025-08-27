# WynIsBuff2 Agentic Orchestration System

This project uses an advanced multi-agent orchestration system specifically designed for Phaser 3 game development.

## Available Orchestration Patterns

### Multi-Agent Workflows
- Use "Task" tool for spawning specialized subagents
- Prefix complex requests with "think hard" for deep analysis mode
- Use `/implement-game-feature` for complete feature development
- Use `/debug-physics-issue` for physics problem solving
- Use `/manage-assets` for asset management automation

### Subagent Specializations

#### 1. architecture-guardian (Priority: 1)
- **Role**: Enforces WynIsBuff2's architectural patterns and consistency
- **Triggers**: New features, refactoring, module creation, code organization
- **Expertise**: Manager patterns, barrel exports, constants, event-driven architecture
- **Quality Gates**: Pre/post implementation validation

#### 2. game-physics-expert (Priority: 2) 
- **Role**: Phaser 3 and Rapier physics implementation specialist
- **Triggers**: Physics mechanics, collision detection, movement systems, performance
- **Expertise**: Enhanced movement, jump mechanics, collision optimization, 60 FPS performance
- **Integration**: PhysicsManager singleton, event-driven physics

#### 3. game-design-innovator (Priority: 3)
- **Role**: Creative game design and player experience expert
- **Triggers**: Game mechanics, level design, player experience, creative features
- **Expertise**: Skill-to-automation loop, SCHRB scoring, player psychology, accessibility
- **Focus**: Innovation within technical constraints

## Orchestration Best Practices

### 1. Automatic Routing
The system automatically analyzes your requests and routes to appropriate agents:
- **Architecture keywords**: pattern, structure, organize, module, manager, singleton
- **Physics keywords**: collision, velocity, gravity, jump, movement, rapier, physics
- **Design keywords**: mechanic, gameplay, feel, experience, power-up, level, creative

### 2. Workflow Patterns

#### Feature Development Workflow
```
User Request → game-design-innovator (design) → 
architecture-guardian (validate) → game-physics-expert (implement) → 
architecture-guardian (final review)
```

#### Bug Fixing Workflow
```
User Request → game-physics-expert (analyze) → 
architecture-guardian (validate solution)
```

#### Optimization Workflow
```
User Request → game-physics-expert (profile) → 
game-physics-expert (optimize) → architecture-guardian (validate)
```

### 3. Quality Assurance
All code changes pass through automated quality gates:
- **Pre-Implementation**: Pattern compliance, naming conventions, import structure
- **Post-Implementation**: Test coverage, documentation, event consistency

## Project-Specific Agent Features

### Architecture Guardian Enforcement
- All managers must extend BaseManager
- Use barrel exports from @features/*
- No magic strings - use generated constants
- Event names follow namespace:action format
- Assets managed through manifest.json

### Physics Expert Optimization  
- Maintain 60 FPS with 100+ physics bodies
- Collision detection under 2ms per frame
- Physics simulation under 4ms per frame
- Zero garbage collection spikes
- Efficient object pooling

### Game Design Innovation
- Skill-to-automation core loop preservation
- SCHRB performance scoring system
- Clone forging mechanics
- Biome-based level progression
- Player psychology-driven design

## Usage Examples

### Basic Agent Routing
```
"Add wall jumping mechanic" 
→ Automatically routes to game-design-innovator → architecture-guardian → game-physics-expert

"Fix collision detection bug"
→ Routes to game-physics-expert → architecture-guardian

"Refactor player controller architecture"  
→ Routes to architecture-guardian (primary)
```

### Command-Based Workflows
```
/implement-game-feature "Magnetic collectible attraction system"
/debug-physics-issue "Player clips through moving platforms"
/manage-assets "Add new boss enemy spritesheet animations"
```

### Deep Analysis Mode
```
"Think hard about implementing a skill-based automation system for level progression"
→ Triggers high-thinking-budget analysis with orchestrator coordination
```

## Integration with Existing Systems

### AgentOrchestrator.js Integration
The system integrates with the existing `src/core/AgentOrchestrator.js` for:
- Task routing and delegation
- Agent lifecycle management  
- Quality gate enforcement
- Performance monitoring

### Configuration Files
- `.claude-orchestration.json`: Agent definitions and workflows
- `.claude/settings.json`: Claude Code project configuration
- `.mcp.json`: MCP server configuration for extended capabilities

### Logging and Monitoring
- Agent activities logged to `.claude/orchestration.log`
- Quality gate validation tracking
- Performance metrics collection
- Task completion status monitoring

## Performance Optimization

### Model Selection Strategy
- **Haiku**: Simple validation and quick tasks
- **Sonnet**: Implementation work and code analysis  
- **Opus**: Complex orchestration and creative design

### Context Management
- Automatic context window management
- Agent isolation to prevent context spillover
- Strategic task batching for efficiency
- Memory MCP server for cross-agent state

## Development Workflow Integration

### Morning Routine
1. Check orchestration logs for previous session insights
2. Use agents to plan daily development tasks
3. Route complex features through appropriate workflows

### Feature Development
1. Let system auto-route or use explicit commands
2. Follow multi-phase workflows (design → architecture → implementation)
3. Leverage quality gates for consistent results

### Debugging and Optimization  
1. Use physics expert for performance issues
2. Architecture guardian for pattern compliance  
3. Design innovator for UX improvements

This orchestration system ensures consistent, high-quality development while leveraging specialized expertise for each aspect of WynIsBuff2's unique skill-to-automation platformer architecture.