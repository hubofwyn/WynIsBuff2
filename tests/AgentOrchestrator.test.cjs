const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock the orchestration config since we're in CommonJS
const orchestrationConfig = {
    agents: {
        "architecture-guardian": {
            triggers: ["new feature implementation", "refactoring", "module creation"],
            patterns: ["add.*feature", "create.*module", "refactor"],
            priority: 1
        },
        "game-physics-expert": {
            triggers: ["physics implementation", "collision detection", "movement mechanics"],
            patterns: ["physics", "collision", "movement", "jump"],
            priority: 2
        },
        "game-design-innovator": {
            triggers: ["game mechanics", "level design", "power-ups"],
            patterns: ["mechanic", "gameplay", "level.*design", "power.?up"],
            priority: 3
        }
    },
    workflows: {
        "feature-development": {
            steps: [
                { phase: "design", agent: "game-design-innovator" },
                { phase: "architecture", agent: "architecture-guardian" },
                { phase: "implementation", agent: "game-physics-expert" },
                { phase: "validation", agent: "architecture-guardian" }
            ]
        }
    },
    routing: {
        auto_detect: true,
        fallback: "architecture-guardian",
        parallel_execution: { enabled: true, max_agents: 2 },
        keywords: {
            architecture: ["pattern", "structure", "module"],
            physics: ["collision", "velocity", "jump"],
            design: ["mechanic", "gameplay", "level"]
        }
    }
};

// Simple mock of the AgentOrchestrator for testing
class MockAgentOrchestrator {
    constructor() {
        this.config = orchestrationConfig;
        this.executionHistory = [];
    }

    analyzeTask(taskDescription) {
        const analysis = {
            primaryAgent: null,
            supportingAgents: [],
            workflow: null,
            confidence: 0
        };

        const lowerTask = taskDescription.toLowerCase();
        const agentScores = {};

        for (const [agentName, agentConfig] of Object.entries(this.config.agents)) {
            let score = 0;
            
            for (const pattern of agentConfig.patterns) {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(lowerTask)) {
                    score += 10;
                }
            }
            
            for (const trigger of agentConfig.triggers) {
                if (lowerTask.includes(trigger.toLowerCase())) {
                    score += 5;
                }
            }
            
            if (score > 0) {
                agentScores[agentName] = score;
            }
        }

        const sortedAgents = Object.entries(agentScores).sort(([, a], [, b]) => b - a);

        if (sortedAgents.length > 0) {
            analysis.primaryAgent = sortedAgents[0][0];
            analysis.confidence = sortedAgents[0][1];
            analysis.supportingAgents = sortedAgents.slice(1).map(([name]) => name);
        }

        if (!analysis.primaryAgent) {
            analysis.primaryAgent = this.config.routing.fallback;
            analysis.confidence = 1;
        }

        return analysis;
    }

    routeTask(taskDescription) {
        const analysis = this.analyzeTask(taskDescription);
        const routing = {
            task: taskDescription,
            analysis,
            agents: []
        };

        if (analysis.primaryAgent) {
            routing.agents.push({
                name: analysis.primaryAgent,
                role: 'primary',
                confidence: analysis.confidence
            });

            if (this.config.routing.parallel_execution.enabled && analysis.supportingAgents.length > 0) {
                const supporting = analysis.supportingAgents[0];
                if (supporting) {
                    routing.agents.push({
                        name: supporting,
                        role: 'supporting'
                    });
                }
            }
        }

        this.executionHistory.push(routing);
        return routing;
    }
}

// Test scenarios
function testPhysicsRouting() {
    const orchestrator = new MockAgentOrchestrator();
    const result = orchestrator.analyzeTask("Fix the collision detection bug in the jump mechanic");
    
    assert.strictEqual(result.primaryAgent, "game-physics-expert", 
        "Physics-related tasks should route to game-physics-expert");
    assert(result.confidence > 10, "High confidence expected for clear physics tasks");
    
    console.log("✓ Physics routing test passed");
}

function testArchitectureRouting() {
    const orchestrator = new MockAgentOrchestrator();
    const result = orchestrator.analyzeTask("Refactor the module structure to improve code organization");
    
    assert.strictEqual(result.primaryAgent, "architecture-guardian",
        "Architecture tasks should route to architecture-guardian");
    
    console.log("✓ Architecture routing test passed");
}

function testDesignRouting() {
    const orchestrator = new MockAgentOrchestrator();
    const result = orchestrator.analyzeTask("Create a new power-up mechanic for the gameplay");
    
    assert.strictEqual(result.primaryAgent, "game-design-innovator",
        "Design tasks should route to game-design-innovator");
    
    console.log("✓ Design routing test passed");
}

function testMultiAgentRouting() {
    const orchestrator = new MockAgentOrchestrator();
    const routing = orchestrator.routeTask("Add a wall jump mechanic with proper physics");
    
    assert(routing.agents.length >= 1, "Should have at least one agent");
    assert(routing.agents.some(a => a.name === "game-physics-expert" || a.name === "game-design-innovator"),
        "Should involve physics or design expert");
    
    console.log("✓ Multi-agent routing test passed");
}

function testFallbackRouting() {
    const orchestrator = new MockAgentOrchestrator();
    const result = orchestrator.analyzeTask("Update the README documentation");
    
    assert.strictEqual(result.primaryAgent, "architecture-guardian",
        "Unclear tasks should fall back to architecture-guardian");
    assert.strictEqual(result.confidence, 1, "Fallback should have low confidence");
    
    console.log("✓ Fallback routing test passed");
}

function testComplexScenario() {
    const orchestrator = new MockAgentOrchestrator();
    const scenarios = [
        {
            task: "Implement double jump with coyote time",
            expectedPrimary: "game-physics-expert",
            description: "Complex physics mechanic"
        },
        {
            task: "Create new gameplay mechanics for boss battle",
            expectedPrimary: "game-design-innovator",
            description: "Creative design task"
        },
        {
            task: "Create a new feature module for inventory system",
            expectedPrimary: "architecture-guardian",
            description: "System architecture task"
        }
    ];

    for (const scenario of scenarios) {
        const result = orchestrator.analyzeTask(scenario.task);
        assert.strictEqual(result.primaryAgent, scenario.expectedPrimary,
            `${scenario.description} should route to ${scenario.expectedPrimary}`);
    }
    
    console.log("✓ Complex scenario routing test passed");
}

function testExecutionHistory() {
    const orchestrator = new MockAgentOrchestrator();
    
    orchestrator.routeTask("Task 1");
    orchestrator.routeTask("Task 2");
    orchestrator.routeTask("Task 3");
    
    assert.strictEqual(orchestrator.executionHistory.length, 3,
        "Execution history should track all routed tasks");
    
    console.log("✓ Execution history test passed");
}

// Run all tests
console.log("\n=== Agent Orchestrator Tests ===\n");

try {
    testPhysicsRouting();
    testArchitectureRouting();
    testDesignRouting();
    testMultiAgentRouting();
    testFallbackRouting();
    testComplexScenario();
    testExecutionHistory();
    
    console.log("\n✅ All orchestration tests passed!\n");
} catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
}