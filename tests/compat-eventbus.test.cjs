'use strict';

const assert = require('assert');
const { EventBus } = require('../src/core/EventBus.js');

console.log('Running EventBus compatibility tests...');

assert.strictEqual(typeof EventBus.getInstance, 'function', 'EventBus.getInstance should exist');
const eb = EventBus.getInstance();
assert.strictEqual(eb, EventBus, 'EventBus.getInstance should return the exported singleton');

console.log('EventBus compatibility tests passed.');

