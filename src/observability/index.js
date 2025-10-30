/**
 * WynIsBuff2 Observability System
 *
 * Agent-ready logging, context capture, and debugging infrastructure
 *
 * Usage:
 *   import { LOG, DebugContext, PlayerStateProvider } from '@observability';
 *
 *   // Setup (in Game.js create())
 *   const context = DebugContext.getInstance();
 *   context.registerProvider(new PlayerStateProvider(this.player));
 *   LOG.setContextProvider(context);
 *
 *   // Logging
 *   LOG.error('PHYSICS_ERROR', {
 *       error: e,
 *       hint: 'Check body initialization',
 *       subsystem: 'physics'
 *   });
 */

// Core logging
export { LogSystem, LOG } from './core/LogSystem.js';
export { BoundedBuffer } from './core/BoundedBuffer.js';
export { LogLevel, LogLevelPriority, DefaultSamplingRates } from './core/LogLevel.js';

// Context system
export { DebugContext } from './context/DebugContext.js';
export { StateProvider } from './context/StateProvider.js';

// State providers
export { PlayerStateProvider } from './providers/PlayerStateProvider.js';
export { PhysicsStateProvider } from './providers/PhysicsStateProvider.js';
export { InputStateProvider } from './providers/InputStateProvider.js';

// Utilities (Phase 5)
export { CrashDumpGenerator } from './utils/CrashDumpGenerator.js';
export { ErrorPatternDetector } from './utils/ErrorPatternDetector.js';
