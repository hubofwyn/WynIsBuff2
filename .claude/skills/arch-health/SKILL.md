# Architecture Health Check

Run the full validation suite for WynIsBuff2 architecture compliance.

## Usage

`/arch-health`

## Steps

1. **Run tests**

   ```bash
   bun test
   ```

2. **Run architecture health check**

   ```bash
   bun run arch:health
   ```

3. **Check import boundaries** (if eslint-plugin-boundaries configured)

   ```bash
   bun run lint:boundaries
   ```

4. **Run dependency analysis**

   ```bash
   bun run deps:check
   ```

5. **Report findings**
   - Summarize test results
   - List any architecture violations
   - Identify boundary violations (vendor imports outside core/)
   - Flag unused dependencies or circular imports
   - Provide remediation steps for any failures

## What Gets Checked

- Barrel export compliance (@features/* imports)
- Vendor abstraction boundary (only src/core/ imports Phaser/Rapier/Howler)
- Manager pattern compliance (BaseManager extension)
- Constants usage (no magic strings)
- Event naming conventions (namespace:action)
- Structured logging (no console.* usage)
- Dependency health and circular import detection
