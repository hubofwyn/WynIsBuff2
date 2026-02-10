# Playtest Check

Deterministic testing workflow using GoldenSeedTester and DeterministicRNG.

## Usage

`/playtest-check`

## Steps

1. **Review deterministic testing setup**
   - Check GoldenSeedTester configuration
   - Verify DeterministicRNG initialization
   - Review seed values and frame limits

2. **Verify test infrastructure**

   ```javascript
   import { GoldenSeedTester, DeterministicRNG } from '@features/core';

   // Check singleton availability
   const tester = GoldenSeedTester.getInstance();
   const rng = DeterministicRNG.getInstance();
   ```

3. **Run recording test**

   ```javascript
   tester.startRecording({ seed: 1138, maxFrames: 600 });
   // ... gameplay frames ...
   const recording = tester.stopRecording();
   ```

4. **Validate playback**

   ```javascript
   tester.startPlayback(recording);
   // Verify frame-by-frame determinism
   const result = tester.validatePlayback();
   ```

5. **Check RNG streams**

   ```javascript
   rng.init(seedValue);
   const value = rng.int(1, 100, 'streamName');
   // Verify same seed + stream = same output
   ```

6. **Report**
   - Determinism verification results
   - Frame drift detection
   - RNG stream consistency
   - Recommendations for non-deterministic code paths

## Purpose

Ensures gameplay is reproducible for:

- Bug reproduction
- Regression testing
- Performance benchmarking
- Gameplay balance validation
