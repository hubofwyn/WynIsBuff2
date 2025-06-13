// Barrel export for the Player feature – thin facade around the existing
// implementation located under src/modules/player for now.
// During the ongoing refactor we keep the original files untouched to avoid
// breaking runtime behaviour, while allowing new code to import via the new
// alias path:
//   import { PlayerController } from '@features/player';

export { PlayerController } from '../../modules/player/PlayerController.js';

// Expose sub-controllers for tests / future composition if needed.
export { MovementController } from '../../modules/player/MovementController.js';
export { JumpController } from '../../modules/player/JumpController.js';
export { CollisionController } from '../../modules/player/CollisionController.js';

