# Add Module

Step-by-step workflow for adding a new feature module to WynIsBuff2.

## Usage

`/add-module "Module name and purpose"`

## Steps

1. **Create module directory** at `src/modules/yourModule/`

2. **Implement classes** in the module directory

   ```javascript
   import { BaseManager } from '@features/core';
   import { EventNames } from '../../constants/EventNames.js';
   import { LOG } from '@observability';

   export class YourManager extends BaseManager {
       constructor() {
           super();
           if (this.isInitialized()) return;
           this.init();
       }

       init() {
           LOG.info('MODULE_INIT', { subsystem: 'yourModule', message: 'Module initialized' });
           this.setInitialized();
       }
   }
   ```

3. **Create barrel export** at `src/features/yourModule/index.js`

   ```javascript
   export { YourManager } from '../../modules/yourModule/YourManager.js';
   export { YourController } from '../../modules/yourModule/YourController.js';
   ```

4. **Add events** to `src/constants/EventNames.js`

   ```javascript
   // yourModule events
   export const YOUR_MODULE_ACTION = 'yourModule:action';
   ```

5. **Add tests** in `tests/yourModule.test.cjs`

   ```javascript
   const assert = require('assert');
   // Test singleton, events, core logic
   ```

6. **Verify**
   - Run `bun test`
   - Run `bun run arch:health`
   - Confirm imports work: `import { YourManager } from '@features/yourModule'`

## Rules

- Import via `@features/yourModule`, never `../modules/yourModule/`
- No vendor imports (use @features/core for Phaser/Rapier abstractions)
- Managers extend BaseManager
- Events follow namespace:action format
- Use LOG from @observability, never console.*
