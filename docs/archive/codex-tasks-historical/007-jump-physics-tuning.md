Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Jump Physics Tuning

Task: Revise `jumpParams` in `JumpController` for EXTREME BUFFNESS.

- Set `baseForce` -> -75 (stronger initial pop)
- Update per-jump forces:
  • 1st jump: -75
  • 2nd jump: -90
  • 3rd jump: -120 (massive)
- Set `releaseMultiplier` -> 0.5 (tap jumps quicker; hold for max height)
- Set `minJumpTime` -> 60ms (quicker responsiveness)
- Keep `bufferTime` -> 120ms (generous buffering)
- Set `coyoteTime` -> 100ms (more forgiving off-ledge)
- Set `landingRecoveryTime` -> 30ms (instant re-jumps)
- Set `additionalImpulse.y` -> -30 (extra upward kick)

## Change Log

- Jump parameters revised for EXTREME BUFFNESS: baseForce -75, forces {1:-75,2:-90,3:-120}, releaseMultiplier 0.5, minJumpTime 60ms, bufferTime 120ms, coyoteTime 100ms, landingRecoveryTime 30ms, additionalImpulse.y -30.
