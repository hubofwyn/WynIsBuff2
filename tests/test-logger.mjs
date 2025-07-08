import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

import { Logger, LogLevel, getLogger } from '../src/core/Logger.js';

describe('Logger', () => {
    let logger;
    let originalConsoleLog;
    let originalConsoleWarn;
    let originalConsoleError;
    let consoleOutput;

    beforeEach(() => {
        // Get singleton logger instance
        logger = Logger.getInstance();
        logger.clearHistory();
        logger.setConsoleEnabled(true); // Ensure console is enabled
        logger.setLevel(LogLevel.INFO); // Reset to default level
        logger.setModuleFilter(null); // Clear any module filters
        
        // Capture console output
        consoleOutput = [];
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        
        console.log = (...args) => consoleOutput.push({ method: 'log', args });
        console.warn = (...args) => consoleOutput.push({ method: 'warn', args });
        console.error = (...args) => consoleOutput.push({ method: 'error', args });
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    describe('Log Levels', () => {
        it('should respect log level settings', () => {
            const testLogger = logger.getModule('TestModule');
            
            // Set to WARN level
            logger.setLevel(LogLevel.WARN);
            
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warn message');
            testLogger.error('Error message');
            
            // Only WARN and ERROR should be logged
            assert.strictEqual(consoleOutput.length, 2);
            assert.strictEqual(consoleOutput[0].method, 'warn');
            assert.strictEqual(consoleOutput[1].method, 'error');
        });

        it('should log all levels when set to TRACE', () => {
            const testLogger = logger.getModule('TestModule');
            logger.setLevel(LogLevel.TRACE);
            
            testLogger.error('Error');
            testLogger.warn('Warn');
            testLogger.info('Info');
            testLogger.debug('Debug');
            testLogger.trace('Trace');
            
            assert.strictEqual(consoleOutput.length, 5);
        });
    });

    describe('Module Filtering', () => {
        it('should filter by module name', () => {
            logger.setLevel(LogLevel.DEBUG);
            logger.setModuleFilter(['ModuleA', 'ModuleC']);
            
            const moduleA = logger.getModule('ModuleA');
            const moduleB = logger.getModule('ModuleB');
            const moduleC = logger.getModule('ModuleC');
            
            moduleA.info('Message from A');
            moduleB.info('Message from B');
            moduleC.info('Message from C');
            
            // Only A and C should be logged
            assert.strictEqual(consoleOutput.length, 2);
            assert(consoleOutput[0].args[0].includes('[ModuleA]'));
            assert(consoleOutput[1].args[0].includes('[ModuleC]'));
        });

        it('should log all modules when filter is null', () => {
            logger.setLevel(LogLevel.INFO);
            logger.setModuleFilter(null);
            
            const moduleA = logger.getModule('ModuleA');
            const moduleB = logger.getModule('ModuleB');
            
            moduleA.info('Message from A');
            moduleB.info('Message from B');
            
            assert.strictEqual(consoleOutput.length, 2);
        });
    });

    describe('Log History', () => {
        it('should maintain log history', () => {
            const testLogger = logger.getModule('HistoryTest');
            logger.setLevel(LogLevel.DEBUG);
            
            testLogger.info('First message');
            testLogger.debug('Second message', { data: 123 });
            testLogger.warn('Third message');
            
            const history = logger.getHistory();
            assert.strictEqual(history.length, 3);
            assert.strictEqual(history[0].message, 'First message');
            assert.strictEqual(history[1].message, 'Second message');
            assert.deepStrictEqual(history[1].args, [{ data: 123 }]);
            assert.strictEqual(history[2].level, LogLevel.WARN);
        });

        it('should respect max history size', () => {
            const testLogger = logger.getModule('HistoryTest');
            logger.setLevel(LogLevel.INFO);
            
            // Set small history size for testing
            logger.config.maxHistorySize = 5;
            
            // Log more than max
            for (let i = 0; i < 10; i++) {
                testLogger.info(`Message ${i}`);
            }
            
            const history = logger.getHistory();
            assert.strictEqual(history.length, 5);
            assert.strictEqual(history[0].message, 'Message 5');
            assert.strictEqual(history[4].message, 'Message 9');
        });
    });

    describe('Console Output Control', () => {
        it('should disable console output when requested', () => {
            const testLogger = logger.getModule('TestModule');
            logger.setLevel(LogLevel.INFO);
            
            testLogger.info('This should appear');
            logger.setConsoleEnabled(false);
            testLogger.info('This should not appear');
            
            assert.strictEqual(consoleOutput.length, 1);
            
            // But history should still have both
            const history = logger.getHistory();
            assert.strictEqual(history.length, 2);
        });
    });

    describe('Convenience Functions', () => {
        it('should provide getLogger convenience function', () => {
            logger.setLevel(LogLevel.INFO);
            const testLogger = getLogger('ConvenienceTest');
            
            testLogger.info('Test message');
            
            assert.strictEqual(consoleOutput.length, 1);
            assert(consoleOutput[0].args[0].includes('[ConvenienceTest]'));
        });

        it('should support log() method for backward compatibility', () => {
            logger.setLevel(LogLevel.INFO);
            const testLogger = getLogger('CompatTest');
            
            testLogger.log('Legacy log message');
            
            assert.strictEqual(consoleOutput.length, 1);
            assert(consoleOutput[0].args[0].includes('[INFO]'));
        });
    });

    describe('Singleton Pattern', () => {
        it('should return same instance', () => {
            const logger1 = Logger.getInstance();
            const logger2 = Logger.getInstance();
            
            assert.strictEqual(logger1, logger2);
        });

        it('should share state between instances', () => {
            const logger1 = Logger.getInstance();
            const logger2 = Logger.getInstance(); // Should return existing instance
            
            logger1.setLevel(LogLevel.ERROR);
            
            const testLogger = logger2.getModule('SharedTest');
            testLogger.info('Should not appear');
            testLogger.error('Should appear');
            
            assert.strictEqual(consoleOutput.length, 1);
        });
    });
});