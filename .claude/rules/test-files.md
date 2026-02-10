---
globs: tests/**/*.{cjs,js}
---

# Test Files Rules

- Tests use **CommonJS** format (`.cjs` extension preferred)
- Use Node.js built-in `assert` module - no external test frameworks
- Run with `bun test`
- Focus areas: singleton behavior, event dispatch, asset loading, core game logic

```javascript
const assert = require('assert');

// Test example
assert.strictEqual(actual, expected, 'Description of what failed');
```

For deterministic gameplay testing, use `GoldenSeedTester` and `DeterministicRNG` from `@features/core`.
