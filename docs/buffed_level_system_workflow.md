## Buffed Modular Level System: Architect Tier Workflow

This workflow upgrades WynIsBuff2’s level/progression architecture to match the **ULTRA‑COMPREHENSIVE LEVEL & PHYSICS DESIGN BIBLE**, while strengthening modularity, scalability, and futureproofing.

---

### Overview
Current code uses hardcoded JS objects for level data, and separate classes for platform/collectible instantiation and progression. To "buff" the system:
- All levels/zones will move to data-driven YAML (validated by schema)
- Level objects will be spawned through a unified prefab registry
- Difficulty/variation will rely on a scalable API
- Zone/stage/progression logic will become explicit
- The system will allow easy future extension (UX triggers, effects, RX stages, etc)

---

### 1. Data-Driven Level Pipeline (YAML)
1. **Create** `assets/levels/` directory. Store all levels here as YAML files:
    - Naming: `Z2_MomentumMountains/stage-1.yaml`, etc.
2. **Write** level schema to `schemas/levels.schema.json` — based on the Bible doc.
3. **Implement** YAML loader in `LevelLoader` (or a new module):
    - On load, YAML is parsed → JS object
    - Schema is _AJV_-validated; errors must halt build
4. **Migrate**/proxy any legacy `LevelData` content into the new data flow, at least for one test stage.

---

### 2. Modular & Extensible Prefab Registry
1. **Create** a `PrefabRegistry` mapping type string (e.g. `"ledge"`, `"pit"`, `"mover"`) to a factory method/class.
    - E.g. `"ledge"` → `PlatformFactory`, `"mover"` → `MovingPlatformController`, etc.
2. Extend `LevelLoader` to, for each object in the YAML's `objects` array:
    - Look up prefab by `type`
    - Pass difficulty/scaler props (see below)
    - Factory adds entity/physics/collision as needed
3. **Allow easy registration**: New prefab types can be added without changing LevelLoader, just by updating the registry.

---

### 3. Difficulty-Scaler API & Dynamic Level Props
1. **Write/extend** a `makeScaler(zoneIndex)` API:
    - Outputs param set: gap, platformW, moverSpeed, etc.
2. At level load time, **injects** scaler props according to zone/stage (can be read from YAML meta).
3. Factories use these props to tune platform gaps, spring power, enemy rate, hazard frequency, etc.

---

### 4. Zone/Stage Progression Matrix
1. **Implement** explicit support for zones and stages:
    - Levels get IDs like `{ zone, stage }`, not just `level1`
2. Progression/next-level logic uses the matrix, not a flat list.
3. Support for remix (RX) stages, and staged difficulty.
4. Read object quotas/mix (e.g. how many platforms, turrets) from the matrix as the source of truth.

---

### 5. Event Triggers, UX, and Boss-Escape Hooks
1. Level objects include support for triggers/events (e.g., checkpoints, gates, tutorials, sensors).
2. Factories emit to the in-game Event System (analytics/debug ready).
3. Future‑proof: Effects/polish layers and boss-escape system can be layered on without touching other code.

---

### 6. Physics & Unit Consistency
1. **Centralize** physics units/scaling (e.g., `PX_PER_M`, masks) in a constants file, imported by all modules.
2. All prefab/entity factories must respect these units.

---

### 7. Migration, Testing, and Documentation
1. Begin with a test YAML level and migrate over time. Proxy old data via the loader when bootstrapping.
2. Document new workflows in `docs/` and `AIProjectDocs/`. Update readme and onboarding docs.
3. Ensure all progression/hardness is testable with debug toggles + interfaces (step through progression, force scaler, etc).
4. Validate by implementing a remix/RX stage and at least two non-trivial object types from the prefab bible.

---

### Architectural Strengths Provided
- **Easy expansion:** Designers add levels/zones/objects in YAML and registry, not code.
- **Strict validation & reliability** via schema and modular prefab enforcement.
- **Cleaner codebase:** No more growing monoliths or duplicative switch-cases.
- **Ready for future features:** Boss systems, VFX, triggers fit cleanly into the event and prefab layers.
- **Buff-level architecture:** Highly composable, designer/developer friendly, futureproof.
