import { BaseManager } from './BaseManager.js';
import orchestrationConfig from '../../.claude-orchestration.json';

export class AgentOrchestrator extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        this.config = orchestrationConfig;
        this.activeAgents = new Set();
        this.taskQueue = [];
        this.executionHistory = [];
        this.setInitialized();
    }

    analyzeTask(taskDescription) {
        const analysis = {
            primaryAgent: null,
            supportingAgents: [],
            workflow: null,
            confidence: 0,
            keywords: []
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

        const sortedAgents = Object.entries(agentScores)
            .sort(([, a], [, b]) => b - a);

        if (sortedAgents.length > 0) {
            analysis.primaryAgent = sortedAgents[0][0];
            analysis.confidence = sortedAgents[0][1];
            analysis.supportingAgents = sortedAgents.slice(1).map(([name]) => name);
        }

        for (const [workflowName, workflowConfig] of Object.entries(this.config.workflows)) {
            const relevantKeywords = this.extractKeywords(lowerTask, workflowName);
            if (relevantKeywords.length > 0) {
                analysis.workflow = workflowName;
                analysis.keywords = relevantKeywords;
                break;
            }
        }

        if (!analysis.primaryAgent && this.config.routing.fallback) {
            analysis.primaryAgent = this.config.routing.fallback;
            analysis.confidence = 1;
        }

        return analysis;
    }

    extractKeywords(text, context) {
        const keywords = [];
        const routing = this.config.routing.keywords;
        
        for (const [category, terms] of Object.entries(routing)) {
            for (const term of terms) {
                if (text.includes(term.toLowerCase())) {
                    keywords.push({ category, term });
                }
            }
        }
        
        return keywords;
    }

    routeTask(taskDescription, options = {}) {
        const analysis = this.analyzeTask(taskDescription);
        
        const routing = {
            task: taskDescription,
            analysis,
            timestamp: Date.now(),
            agents: [],
            workflow: null
        };

        if (analysis.workflow && !options.skipWorkflow) {
            routing.workflow = this.executeWorkflow(analysis.workflow, taskDescription);
        } else if (analysis.primaryAgent) {
            routing.agents.push({
                name: analysis.primaryAgent,
                role: 'primary',
                confidence: analysis.confidence
            });

            if (this.config.routing.parallel_execution.enabled && analysis.supportingAgents.length > 0) {
                const maxParallel = this.config.routing.parallel_execution.max_agents - 1;
                const supportingToUse = analysis.supportingAgents.slice(0, maxParallel);
                
                for (const agent of supportingToUse) {
                    routing.agents.push({
                        name: agent,
                        role: 'supporting',
                        confidence: analysis.confidence * 0.7
                    });
                }
            }
        }

        this.executionHistory.push(routing);
        return routing;
    }

    executeWorkflow(workflowName, context) {
        const workflow = this.config.workflows[workflowName];
        if (!workflow) return null;

        const execution = {
            name: workflowName,
            context,
            steps: []
        };

        for (const step of workflow.steps) {
            const shouldExecute = !step.condition || this.evaluateCondition(step.condition, context);
            
            if (shouldExecute) {
                execution.steps.push({
                    phase: step.phase,
                    agent: step.agent,
                    actions: step.actions,
                    status: 'pending'
                });
            }
        }

        return execution;
    }

    evaluateCondition(condition, context) {
        const lowerContext = context.toLowerCase();
        return lowerContext.includes(condition.replace('-', ' '));
    }

    applyQualityGates(phase, code) {
        const gates = this.config.quality_gates[phase];
        if (!gates) return { passed: true, checks: [] };

        const results = {
            passed: true,
            checks: []
        };

        for (const check of gates.checks) {
            const checkResult = this.performCheck(check, code);
            results.checks.push({
                name: check,
                passed: checkResult.passed,
                message: checkResult.message
            });
            
            if (!checkResult.passed) {
                results.passed = false;
            }
        }

        return results;
    }

    performCheck(checkName, code) {
        const checks = {
            pattern_compliance: () => this.checkPatternCompliance(code),
            naming_conventions: () => this.checkNamingConventions(code),
            import_structure: () => this.checkImportStructure(code),
            test_coverage: () => ({ passed: true, message: 'Test coverage check pending' }),
            documentation: () => this.checkDocumentation(code),
            event_consistency: () => this.checkEventConsistency(code)
        };

        const checkFn = checks[checkName];
        return checkFn ? checkFn() : { passed: true, message: 'Check not implemented' };
    }

    checkPatternCompliance(code) {
        const hasBaseManager = /extends\s+BaseManager/.test(code);
        const usesConstructorPattern = /constructor\(\)\s*{\s*super\(\)/.test(code);
        
        if (code.includes('Manager') && !hasBaseManager) {
            return { passed: false, message: 'Manager classes must extend BaseManager' };
        }
        
        return { passed: true, message: 'Pattern compliance verified' };
    }

    checkNamingConventions(code) {
        const classNamePattern = /class\s+[A-Z][a-zA-Z0-9]+/;
        const hasValidClassName = classNamePattern.test(code);
        
        if (!hasValidClassName && code.includes('class ')) {
            return { passed: false, message: 'Class names must be in PascalCase' };
        }
        
        return { passed: true, message: 'Naming conventions verified' };
    }

    checkImportStructure(code) {
        const invalidImports = /from\s+['"]\.\.\/modules\//;
        const hasMagicStrings = /scene\.start\(['"][^'"]+['"]\)(?!.*SceneKeys)/;
        
        if (invalidImports.test(code)) {
            return { passed: false, message: 'Use barrel exports from @features/* instead of direct module imports' };
        }
        
        if (hasMagicStrings.test(code)) {
            return { passed: false, message: 'Use SceneKeys constants instead of magic strings' };
        }
        
        return { passed: true, message: 'Import structure verified' };
    }

    checkDocumentation(code) {
        const hasClassComment = /\/\*\*[\s\S]*?\*\/\s*(?:export\s+)?class/.test(code);
        const publicMethods = code.match(/^\s{4}(?!constructor|init|_)[a-z][a-zA-Z0-9]*\(/gm) || [];
        const documentedMethods = code.match(/\/\*\*[\s\S]*?\*\/\s*\n\s{4}[a-z]/g) || [];
        
        if (!hasClassComment && code.includes('export class')) {
            return { passed: false, message: 'Public classes should have documentation' };
        }
        
        return { passed: true, message: 'Documentation present' };
    }

    checkEventConsistency(code) {
        const eventEmits = code.match(/emit\(['"]([^'"]+)['"]/g) || [];
        const hasNamespaceFormat = eventEmits.every(emit => {
            const eventName = emit.match(/['"]([^'"]+)['"]/)[1];
            return eventName.includes(':') || eventName.includes('EventNames.');
        });
        
        if (!hasNamespaceFormat && eventEmits.length > 0) {
            return { passed: false, message: 'Event names should use namespace:action format or EventNames constants' };
        }
        
        return { passed: true, message: 'Event consistency verified' };
    }

    getRecommendation(taskDescription) {
        const analysis = this.analyzeTask(taskDescription);
        const routing = this.routeTask(taskDescription, { skipWorkflow: false });
        
        return {
            analysis,
            routing,
            recommendation: this.formatRecommendation(routing),
            confidence: this.calculateOverallConfidence(analysis)
        };
    }

    formatRecommendation(routing) {
        if (routing.workflow) {
            const steps = routing.workflow.steps.map(s => `${s.phase}: ${s.agent}`).join(' → ');
            return `Workflow: ${routing.workflow.name} (${steps})`;
        } else if (routing.agents.length > 0) {
            const primary = routing.agents.find(a => a.role === 'primary');
            const supporting = routing.agents.filter(a => a.role === 'supporting');
            
            let rec = `Primary: ${primary.name}`;
            if (supporting.length > 0) {
                rec += ` | Supporting: ${supporting.map(a => a.name).join(', ')}`;
            }
            return rec;
        }
        
        return 'No specific agent recommendation - using fallback';
    }

    calculateOverallConfidence(analysis) {
        if (analysis.workflow) return 0.9;
        if (analysis.confidence > 15) return 0.8;
        if (analysis.confidence > 10) return 0.6;
        if (analysis.confidence > 5) return 0.4;
        return 0.2;
    }

    getExecutionHistory() {
        return this.executionHistory;
    }

    clearHistory() {
        this.executionHistory = [];
    }
}