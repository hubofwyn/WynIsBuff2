import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EventBus } from '../src/core/EventBus.js';

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all listeners between tests
        EventBus.removeAllListeners();
    });

    it('should handle once() listeners correctly', () => {
        let called = false;
        const data = { msg: 'hello' };

        EventBus.once('test.once', (payload) => {
            called = payload === data;
        });

        EventBus.emit('test.once', data);
        assert.strictEqual(called, true, 'once listener should fire exactly once');

        // Try emitting again - should not fire
        called = false;
        EventBus.emit('test.once', data);
        assert.strictEqual(called, false, 'once listener should not fire again');
    });

    it('should handle on() and off() correctly', () => {
        let count = 0;
        const handler = () => {
            count += 1;
        };

        const off = EventBus.on('test.loop', handler);

        EventBus.emit('test.loop');
        EventBus.emit('test.loop');
        assert.strictEqual(count, 2, 'listener should fire twice');

        off();
        EventBus.emit('test.loop');
        assert.strictEqual(count, 2, 'off() should remove listener');
    });

    it('should handle multiple listeners', () => {
        const results = [];
        
        EventBus.on('test.multi', () => results.push(1));
        EventBus.on('test.multi', () => results.push(2));
        EventBus.on('test.multi', () => results.push(3));

        EventBus.emit('test.multi');
        assert.deepStrictEqual(results, [1, 2, 3], 'all listeners should fire in order');
    });

    it('should pass data correctly to listeners', () => {
        const testData = { value: 42, text: 'test' };
        let receivedData = null;

        EventBus.on('test.data', (data) => {
            receivedData = data;
        });

        EventBus.emit('test.data', testData);
        assert.deepStrictEqual(receivedData, testData, 'data should be passed unchanged');
    });

    it('should handle removeAllListeners', () => {
        let count1 = 0;
        let count2 = 0;

        EventBus.on('test.remove', () => count1++);
        EventBus.on('test.remove', () => count2++);
        
        EventBus.emit('test.remove');
        assert.strictEqual(count1, 1);
        assert.strictEqual(count2, 1);

        EventBus.removeAllListeners('test.remove');
        EventBus.emit('test.remove');
        assert.strictEqual(count1, 1, 'listeners should be removed');
        assert.strictEqual(count2, 1, 'listeners should be removed');
    });
});