// CommonJS test for EventBus singleton
const assert = require('assert');

const { EventBus } = require('../src/core/EventBus.js');

console.log('Running EventBus tests...');

let called = false;
const data = { msg: 'hello' };

EventBus.once('test.once', (payload) => {
  called = payload === data;
});

EventBus.emit('test.once', data);
assert.strictEqual(called, true, 'once listener should fire exactly once');

let count = 0;
const off = EventBus.on('test.loop', () => {
  count += 1;
});

EventBus.emit('test.loop');
EventBus.emit('test.loop');

off();
EventBus.emit('test.loop');

assert.strictEqual(count, 2, '.off() should remove listener');

console.log('EventBus tests passed.');

