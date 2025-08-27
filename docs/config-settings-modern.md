Engineering a Modern 2D Platformer: An Expert Guide to Phaser 3 and Rapier PhysicsFoundational Strategy: Selecting Your Rapier Integration PathThe initial and most critical architectural decision when integrating the Rapier physics engine with Phaser 3 is the choice of integration methodology. This decision fundamentally dictates the project's structure, development workflow, and the degree of granular control available for tuning the physics simulation. As of 2024, Phaser Studio officially supports and provides templates for two distinct approaches, each presenting a different balance between development velocity and ultimate control.1 For a project aiming to achieve the nuanced, responsive control characteristic of a modern action platformer, this choice is paramount.The Two Official ApproachesPhaser developers have access to two primary, well-documented paths for leveraging Rapier's performance and features: a high-level plugin that prioritizes ease of use, and a direct, native template that prioritizes control and flexibility.Method A: The @phaserjs/rapier-connector PluginThis approach utilizes an official plugin that acts as a high-level abstraction layer over the Rapier API. It is engineered to simplify the integration process by providing helper functions and a structure that mirrors Phaser's own architectural patterns.1 This method is often presented as the more accessible path, making it an excellent choice for rapid prototyping, game jams, or projects where complex, non-standard physics interactions are not a primary requirement. Its features include simplified creation of rigid bodies (Dynamic, Fixed, Kinematic), automatic synchronization of Phaser transformations, and straightforward debugging visualization.2Method B: The phaserjs/template-rapier (Native Integration)This alternative provides a project template for a direct, "native" integration with Rapier. It deliberately omits any abstraction layer, requiring the developer to interact directly with the Rapier WASM module's JavaScript API.1 This path offers maximum, unfettered control over every aspect of the physics world, from solver parameters to individual contact modifications. While it involves a steeper learning curve and more manual setup for tasks like object synchronization, it is the definitive choice for projects that demand deep customization and optimization of the physics simulation.3Comparative Analysis: Control vs. ConvenienceThe decision between the Connector plugin and Native integration is a classic engineering trade-off. The Connector streamlines development by handling much of the boilerplate code, whereas the Native approach empowers the developer to build highly bespoke physics systems.Ease of Use: The @phaserjs/rapier-connector plugin presents a familiar, Phaser-centric API. Creating a physics-enabled sprite is as simple as calling a method on a plugin instance, such as this.rapierPhysics.addRigidBody(gameObject, options).2 This is highly intuitive for developers already proficient with Phaser's ecosystem. Conversely, the Native template requires a more verbose, manual process: creating a Rapier rigid body description, creating the body in the Rapier world, creating a collider, and then manually implementing the logic in the update loop to synchronize the Phaser Game Object's position with the Rapier body's state.3API Access and Flexibility: This is the most significant differentiator. The Native approach grants complete access to the entire Rapier JavaScript API. This includes advanced and powerful features such as the KinematicCharacterController, custom physics hooks for contact and intersection filtering, direct manipulation of solver parameters, and scene queries.4 The Connector plugin, by its nature as an abstraction, may not expose these more advanced functionalities, or may do so in a limited capacity. For instance, its automatic transformation synchronization for KinematicPositionBased bodies is a convenience that can become a hindrance when implementing custom movement logic that requires overriding this behavior.2Performance: Both methods are exceptionally performant due to Rapier's underlying Rust and WebAssembly (WASM) architecture.1 However, the Native integration carries a marginal performance advantage. By interacting directly with the WASM module, it bypasses the additional function calls and logic inherent in the Connector's abstraction layer. While this difference is likely imperceptible in most games, it could become a relevant factor in simulations with an extremely high number of concurrent physics interactions.Learning Curve: The Connector has a lower initial barrier to entry, as it leverages existing Phaser knowledge. The Native path requires the developer to become proficient with two distinct APIs and their documentation: Phaser for rendering and game state, and Rapier for the physics simulation.7Expert Recommendation for a Modern Action PlatformerFor the specific goal of creating a fast-moving action platformer with a "dynamic modern feel," the Native Integration (template-rapier) path is unequivocally the recommended approach.The core of a modern platformer's "game feel" is not derived from a pure, realistic physics simulation. Instead, it is a carefully crafted illusion of physics. This illusion is built from a collection of highly tuned, often physically inaccurate, mechanics designed to maximize player responsiveness and control. Techniques such as variable jump heights, apex modifiers, coyote time (allowing a jump for a few frames after leaving a ledge), and jump buffering (registering a jump input just before landing) are the hallmarks of this design philosophy.8Implementing these nuanced mechanics requires direct, frame-by-frame authority over the character's state, including its velocity, the forces acting upon it, and its collision responses. The abstraction provided by the @phaserjs/rapier-connector is designed for simplicity and general use cases, where automatic synchronization of position and rotation is a desirable feature.2 However, this very automation can conflict with the custom logic needed to, for example, implement coyote time, where the game logic must temporarily override the raw physics state.Therefore, to achieve the project's central goal, the developer must have unrestricted access to the full capabilities of the Rapier engine. The Native integration path is the only one that guarantees this level of granular control, making it the superior choice for building a high-quality, responsive platformer, despite its higher initial setup cost.Feature@phaserjs/rapier-connectorphaserjs/template-rapier (Native)Setup SpeedFast; plugin-based and highly automated.Slower; requires manual setup of world and object synchronization.Learning CurveLow; leverages existing Phaser API patterns.High; requires learning both Phaser and the full Rapier JS API.API ControlLimited; abstracts away many low-level Rapier features.Complete; full, direct access to the entire Rapier API.Flexibility for Custom MechanicsModerate; good for standard physics, but can hinder complex logic.Excellent; provides the necessary control for nuanced "game feel."Performance OverheadMinimal, but higher than Native due to the abstraction layer.Negligible; direct interaction with the WASM module.Recommended Use CaseRapid prototyping, simpler physics-based games, game jams.Complex platformers, games requiring custom physics, production-level projects.World Configuration for a High-Performance, Responsive SimulationOnce the native integration path is chosen, the next step is to configure the global physics environment. This foundation must be stable, predictable, and tuned for the specific demands of a fast-paced action game. The goal is to create a world where physics interactions are both performant and consistent, providing a reliable canvas for building character and object behaviors.Initialization and the Core Simulation LoopThe integration of Rapier into the Phaser lifecycle begins in the create method of a Scene and is driven by the update method.Asynchronous Loading: Rapier is delivered as a WebAssembly module, which must be loaded and compiled by the browser asynchronously. This is a mandatory first step that must complete before any Rapier objects can be created. The standard pattern is to make the create method async and use await RAPIER.init();.2 The @dimforge/rapier2d-compat package, recommended for web use, simplifies this process by embedding the WASM file, but the asynchronous initialization remains necessary.3World Creation: After initialization, the physics world itself is instantiated. This involves creating a new RAPIER.World and providing it with a global gravity vector. This vector defines the constant force that will be applied to all dynamic bodies in the simulation.3TypeScript// In your Phaser.Scene
private rapierWorld: RAPIER.World;

async create() {
    await RAPIER.init();

    const gravity = new RAPIER.Vector2(0.0, 9.81); // A standard gravity value
    this.rapierWorld = new RAPIER.World(gravity);
}
The Simulation Step: The physics simulation does not advance on its own. It must be explicitly stepped forward in time. This is done by calling this.rapierWorld.step() within the Phaser Scene's update method, which is called once per frame. This call is the heartbeat of the entire physics engine, calculating all forces, resolving all collisions, and updating the positions of all bodies for a single time interval.3Synchronization: In a native integration, after the physics world has been stepped, the visual representation (the Phaser Game Objects) must be updated to match the new state of the physics bodies. This requires a manual synchronization process. The standard and most effective pattern is to store a reference to the corresponding Phaser Game Object in the userData field of the Rapier RigidBody. After the step() call, one can iterate through all active rigid bodies, retrieve the associated Game Object from userData, and update its position and rotation.3TypeScript// In your update() method, after this.rapierWorld.step()
this.rapierWorld.forEachActiveRigidBody((rigidBody: RAPIER.RigidBody) => {
    const gameObject = rigidBody.userData as Phaser.GameObjects.Sprite;

    if (gameObject) {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation();

        // Apply scaling factor before setting position
        gameObject.setPosition(position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER);
        gameObject.setRotation(rotation);
    }
});
The Critical Importance of Scaling: Pixels vs. MetersOne of the most frequent and impactful errors when integrating a professional physics engine like Rapier is the failure to properly manage units. This mismatch is often the root cause of physics that feels "floaty," unresponsive, or otherwise incorrect.Rapier's simulation is built and optimized around the International System of Units (SI units): meters for distance, kilograms for mass, and seconds for time.12 Its default parameters, such as the gravity constant of 9.81, are calibrated with this assumption. In contrast, Phaser and other 2D rendering frameworks operate in a world of pixels.If a developer creates a collider for a 64x64 pixel sprite by passing the dimensions (32, 32) to Rapier, the engine does not interpret this as 32 pixels. It interprets it as a collider with a half-extent of 32 meters, resulting in a 64-meter-wide object.12 Applying a standard gravitational force to an object of this immense scale will produce visually imperceptible acceleration, making the object appear to fall in slow motion. This directly undermines the goal of creating a "fast-moving action game."To resolve this, it is imperative to establish a global scaling factor that defines the relationship between the physics world's meters and the rendered world's pixels. A common and effective starting point is 100 pixels = 1 meter. This factor must then be applied consistently throughout the codebase: when creating collider shapes from sprite dimensions, and when translating physics positions back into sprite positions for rendering.TypeScript// Define as a global constant
export const PIXELS_PER_METER = 100;

// When creating a collider for a player sprite
const playerSprite = this.add.sprite(0, 0, 'player');
const colliderDesc = RAPIER.ColliderDesc.cuboid(
    playerSprite.displayWidth / 2 / PIXELS_PER_METER,
    playerSprite.displayHeight / 2 / PIXELS_PER_METER
);

// When updating the sprite's position from the physics body
const position = rigidBody.translation();
playerSprite.setPosition(position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER);
This disciplined approach to unit management is not merely a best practice; it is a fundamental prerequisite for achieving predictable and tunable physics behavior.Tuning IntegrationParameters for Action GamesRapier exposes a set of IntegrationParameters that allow for fine-tuning the behavior of the physics solver. While the default values are well-suited for general-purpose applications, a fast-paced action platformer benefits from specific adjustments that prioritize stability and responsiveness over absolute physical accuracy.13 These parameters are typically set on the PhysicsPipeline object before calling world.step(), or can be passed directly to the step function.dt (Timestep): This parameter defines the duration of each physics step in seconds. The default is $1/60$, corresponding to a 60Hz update rate. For a platformer, it is crucial to use a fixed timestep. A variable timestep tied to the frame rate can lead to non-deterministic behavior, where the outcome of a jump could differ at 30 FPS versus 60 FPS. Using the default fixed value of $1/60$ is the recommended practice.max_velocity_iterations & max_position_iterations: These parameters control the number of iterations the solver performs to resolve contacts and constraints. More iterations lead to higher accuracy—preventing fast-moving objects from passing through each other—at the cost of increased CPU usage. For a fast-paced game where high-velocity collisions are frequent, it is advisable to slightly increase these values from their defaults (e.g., from 4 and 1 to 8 and 2, respectively) to enhance stability and prevent "tunneling".13erp (Error Reduction Parameter): This value, between 0 and 1, determines the proportion of positional error (i.e., penetration) that the solver will correct in a single timestep. A value of 1.0 attempts to fix all penetration instantly, which sounds ideal but can introduce jitter and instability as the solver overcorrects.13 For a smoother, more stable feel, a value slightly below 1.0, such as 0.8 or 0.9, is often preferable. This allows the correction to occur over a few frames, resulting in a less jarring visual effect.Continuous Collision Detection (CCD): Standard collision detection checks for overlaps at discrete time steps. If an object is moving fast enough, it can pass entirely through a thin object between steps. CCD is a more computationally expensive algorithm that solves for the "time of impact," preventing this tunneling effect.5 CCD is not a global setting; it must be enabled on a per-body basis for rigid bodies that are expected to move at high speeds, such as a dashing player or a projectile. This is a critical feature for ensuring robustness in an action game.TypeScript// Enable CCD on a specific rigid body
const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true);
const rigidBody = this.rapierWorld.createRigidBody(bodyDesc);
Architecting the Modern Player ControllerThe heart of any platformer is its player controller. The subjective "feel" of the character's movement—its responsiveness, weight, and precision—is the single most important factor in the player's experience. Achieving a "dynamic modern feel" requires moving beyond pure physics simulation and architecting a controller that prioritizes player intent and feedback above all else.Controller Strategy: Dynamic Body vs. Kinematic ControllerRapier offers two primary paradigms for character control, each with profound implications for game feel.Dynamic RigidBody Approach: In this model, the player character is a standard Dynamic rigid body. Movement is achieved by applying physical forces (addForce()) or impulses (applyImpulse()).7 This approach results in a simulation with physically accurate properties like inertia, acceleration, and momentum. While this can be suitable for certain game types (e.g., physics puzzles, games with slippery or floaty movement), it is generally ill-suited for a precision platformer. The inherent inertia means the character cannot stop or change direction instantaneously, which players perceive as sluggishness or unresponsiveness.15KinematicCharacterController Approach: Rapier provides a specialized, high-level KinematicCharacterController. This is not a rigid body in the traditional sense; it is a tool that operates on a KinematicPositionBased body.4 A kinematic body is not affected by forces like gravity or contacts. Instead, its position is dictated directly by the developer. The character controller's role is to take a desired movement vector from the developer each frame and compute a corrected movement vector that accounts for collisions with the environment.For a modern action platformer, the KinematicCharacterController is the vastly superior choice. The design philosophy of modern platformers like Celeste or Super Meat Boy is centered on providing the player with an immediate and predictable response to their input.17 This is an illusion of physics, not a simulation. When the player presses the jump button, the character should jump instantly, without a preparatory animation that would introduce input lag.15 When they change direction in mid-air, the response should be swift and precise. A DynamicBody with inertia cannot provide this level of direct control.The KinematicCharacterController provides the perfect framework for building this illusion. It effectively delegates the complex task of collision detection and resolution to Rapier's robust engine, while leaving the developer with complete and total authority over the character's movement logic. This allows for the implementation of custom acceleration curves, precise jump arcs, and the essential "game feel" mechanics that define the genre.Implementing the KinematicCharacterControllerThe implementation involves creating the controller, associating it with a kinematic rigid body, and then driving it within the main game loop.Setup: The controller is created once and persists for the lifetime of the character. It requires a small offset parameter, which is a crucial stability feature that creates a tiny invisible gap between the character's collider and the world geometry, preventing it from getting stuck.18 The character itself is a KinematicPositionBased rigid body with a suitable collider, typically a capsule shape for better navigation over small edges.TypeScript// In your Player class or Scene
private characterController: RAPIER.KinematicCharacterController;
private playerBody: RAPIER.RigidBody;
private playerCollider: RAPIER.Collider;

// During initialization
const offset = 0.01; // A small offset in meters
this.characterController = this.rapierWorld.createCharacterController(offset);

const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
//... set initial position...
this.playerBody = this.rapierWorld.createRigidBody(bodyDesc);

// Using a capsule for the collider is often best for platformers
const colliderDesc = RAPIER.ColliderDesc.capsule(
    (PLAYER_HEIGHT / 2 / PIXELS_PER_METER) - (PLAYER_RADIUS / PIXELS_PER_METER),
    PLAYER_RADIUS / PIXELS_PER_METER
);
this.playerCollider = this.rapierWorld.createCollider(colliderDesc, this.playerBody);
The Control Loop: The core logic resides in the update method and follows a distinct pattern:Calculate desiredMovement: Based on player input and game state (e.g., gravity, current velocity), determine the movement vector for this frame.Compute Collisions: Pass this desired movement to the controller using characterController.computeColliderMovement(). Rapier will perform shape-casts and determine where the character will actually end up after colliding with obstacles.Get Corrected Movement: Retrieve the result of the computation via characterController.computedMovement(). This is the actual translation the character should undergo.Apply Movement: Update the kinematic body's position for the next physics step using playerBody.setNextKinematicTranslation().4Key Parameters for a Modern Feel: The KinematicCharacterController has several properties that are essential for achieving a fluid and non-frustrating player experience 4:autostep: This feature allows the character to automatically and seamlessly move up small steps and obstacles without requiring a jump. This is critical for smooth navigation in complex environments. It is configured with a maximum step height and a minimum width to ensure the character has a place to land.snapToGround: When the character is moving downwards or along a slope, this feature ensures they "stick" to the ground, preventing small, unrealistic bounces or brief moments of being airborne. This creates a much more grounded and stable feel.Slope Handling (setMaxSlopeClimbAngle): This parameter defines the maximum angle of a slope that the character can walk up. This prevents players from being able to climb surfaces that are intended to be walls and provides clear, predictable rules for level traversal.16Scripting the "Game Feel": Beyond the Physics EngineWith the KinematicCharacterController handling the collision logic, the developer is free to implement the custom movement mechanics that define modern platforming. These are implemented in the game logic that calculates the desiredMovement vector each frame.Variable Jump Height: A staple of modern platformers. This is achieved by applying a strong initial upward velocity when the jump button is pressed. If the player releases the jump button while the character is still ascending, the upward velocity is significantly reduced or set to zero, cutting the jump short. This gives players precise control over their jump arc.9Responsive Air Control: Unlike in reality, players expect to have a high degree of control over their horizontal movement while in the air. This is implemented by applying a custom acceleration logic to the horizontal component of the desiredMovement vector, allowing for quick changes in direction.Coyote Time: To make platforming feel more forgiving and fair, "coyote time" grants the player a small window (e.g., 100-150 ms) to press the jump button even after they have walked off a ledge. This is implemented with a timer that starts the moment characterController.isGrounded() becomes false. If a jump input is received before this timer expires, the jump is executed as if the player were still on the ground.9Jump Buffering: The inverse of coyote time, this mechanic makes the game feel more responsive by "buffering" a jump input. If the player presses the jump button a few moments before landing, the game remembers this input and executes the jump on the very first frame that the character becomes grounded. This prevents the frustrating feeling of having pressed the button at the right time but the input being dropped because it was a frame too early.9Building an Interactive World: Platforms and SurfacesA compelling platformer is defined not just by its character controller, but also by the variety and behavior of the world it inhabits. Configuring environmental objects correctly is essential for creating predictable, challenging, and fair gameplay scenarios.Static Geometry: Ground and WallsThe foundation of any level is its static geometry. In Rapier, these elements are represented by Fixed rigid bodies. A Fixed body is immovable and acts as if it has infinite mass, making it the perfect type for floors, walls, and other static parts of the environment.7Creating Static Bodies: These are typically created once during level setup. They consist of a RigidBody of type Fixed and one or more Collider objects that define their physical shape.TypeScript// Creating a simple ground platform
const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
    worldWidth / 2 / PIXELS_PER_METER,
    worldHeight / PIXELS_PER_METER
);
const groundBody = this.rapierWorld.createRigidBody(groundDesc);

const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
    worldWidth / 2 / PIXELS_PER_METER,
    20 / PIXELS_PER_METER
);
this.rapierWorld.createCollider(groundColliderDesc, groundBody);
Tuning Surface Properties: The ColliderDesc allows for the configuration of physical properties that significantly affect how the player interacts with surfaces.7friction: This determines the force that resists tangential motion. For a fast-paced platformer, the player's collider and the ground colliders should generally have a high friction coefficient (e.g., 1.0 or higher). This allows the character to come to a complete stop almost instantly when the player releases the movement key, which is crucial for precision. Conversely, specific surfaces like ice could be given a very low friction coefficient (e.g., 0.1) to create a sliding mechanic.restitution: This property controls the "bounciness" of a surface. For nearly all static geometry in a platformer, the restitution should be set to 0.0. This prevents the player from unintentionally bouncing when landing from a fall, which can disrupt control and feel unpredictable. A non-zero restitution should be reserved for specific gameplay elements like trampolines or bouncy walls.Advanced Technique: One-Way PlatformsOne-way, or "pass-through," platforms are a genre staple, allowing the player to jump up through them from below but land on them from above. While simpler physics engines often rely on velocity checks to implement this (e.g., "if player velocity is positive, disable collision") 23, this method can be unreliable and prone to edge cases with fast-moving characters.Rapier provides a more robust and engine-native solution through the use of physics hooks and contact modification.5 This approach allows the developer to intercept a potential collision before the physics solver attempts to resolve it and decide whether the collision should proceed.The process involves enabling ActiveHooks.FILTER_CONTACT_PAIR on the player's collider. Then, during the physics step, a user-defined callback function is executed for any potential contact involving that collider. Inside this callback, the developer has access to detailed information about the contact, including the contact normal vector.The Logic: The contact normal is a vector that points from the second collider to the first, representing the direction of the collision. For a one-way platform, the logic is simple:If the player is approaching the platform from below, the contact normal will point downwards (e.g., its y component will be positive in a typical coordinate system). In this case, the collision should be ignored.If the player is landing on the platform from above, the contact normal will point upwards (its y component will be negative). In this case, the collision should be allowed.Implementation: This method is superior because it is based on the actual geometry and direction of the collision, not just the character's velocity. It correctly handles scenarios where a character might be moving downwards but still be below the platform, preventing them from incorrectly snapping to the top. This requires using the PhysicsPipeline and its event queue to process these hooks, a feature readily available in the native integration path.Advanced Technique: Moving PlatformsMoving platforms should be implemented as KinematicPositionBased rigid bodies.7 This body type is ideal because it follows a path dictated by the developer without being influenced by external forces like gravity or the player's weight, yet it can still influence other bodies (like the player) that are in contact with it.The platform's movement is scripted by updating its position each frame using body.setNextKinematicTranslation().25 By using this specific method, Rapier can correctly infer the platform's velocity between frames. This is crucial, as it allows the physics engine to automatically impart this velocity to any character or dynamic object resting on the platform, making them move along with it naturally. A common problem in platformers is the player character "slipping" off a moving platform. This is often caused by the player's own movement logic overwriting the velocity imparted by the platform. The solution is to ensure that when the player is grounded on a moving platform, their final desiredMovement vector is calculated as the sum of their own input-driven movement and the platform's velocity for that frame.Best Practices for a Production-Ready ProjectBuilding a solid foundation for a game involves more than just the core mechanics. Adhering to best practices for performance, debugging, and future planning ensures that the project remains scalable, maintainable, and robust throughout its development lifecycle.Performance and OptimizationRapier is designed for high performance, but developers should be mindful of several factors, particularly in a web environment.WASM Bundle Size: The most significant consideration for web-based games is the initial load time. The Rapier WASM module is powerful but comes with a notable file size, often around 1.5MB.1 This can impact the initial user experience. To mitigate this, it is essential to use modern web development tools. The official Phaser-Rapier templates utilize Vite, which supports advanced bundling techniques like code splitting and tree shaking. While the core WASM module must be loaded upfront, structuring the rest of the game code to load asynchronously can improve perceived performance.SIMD and Parallelism: Rapier's Rust core can be compiled with support for SIMD (Single Instruction, Multiple Data) and parallel processing to leverage modern CPUs for complex scenes.6 For developers using the pre-compiled JavaScript/WASM packages from NPM, these optimizations are typically enabled in the build process by the Dimforge team. While not directly configurable by the end-user in JavaScript, it is a key reason for Rapier's high performance out of the box.Sleeping Bodies: To conserve CPU resources, Rapier automatically puts rigid bodies that have come to rest into a "sleeping" state. A sleeping body is excluded from the active simulation until it is "woken up" by a collision with another active body.7 This is a crucial, built-in optimization that happens automatically and requires no manual intervention, but it is important for developers to be aware of its existence, as it dramatically improves performance in scenes with many static or resting objects.Effective DebuggingPhysics simulations can be complex, and visual debugging tools are indispensable for identifying and resolving issues. Misaligned colliders, incorrect body types, or unexpected forces can be nearly impossible to diagnose without a visual representation of the physics world.Rapier includes a built-in debug renderer that draws the outlines of all colliders, contact points, and other physics-related geometry. It is strongly recommended to have this renderer active throughout the development process.2Enabling the Renderer: In the native integration, the debug data is retrieved by calling world.debugRender(). This returns arrays of vertices and colors that can then be rendered using Phaser's Graphics object. The official templates and examples provide clear patterns for setting this up.3With the Connector: The @phaserjs/rapier-connector plugin simplifies this to a single function call: this.rapierPhysics.debugger(true).2Using the debug renderer provides immediate visual feedback on the state of the physics world, making it trivial to spot problems like a collider being offset from its sprite, a body failing to enter a sleeping state, or unexpected penetrations between objects.A Path for Future EnhancementsThe recommended architecture, centered on the KinematicCharacterController and a native integration, provides a highly extensible foundation for adding more advanced platforming mechanics. Because the developer retains full control over the desiredMovement vector that is fed to the physics engine, adding new abilities becomes a matter of layering additional game logic rather than fighting the physics engine.Wall Jumping & Sliding: These mechanics can be implemented by adding raycasts or shape-casts originating from the character to detect nearby walls. When a wall is detected and certain conditions are met (e.g., the character is airborne), the game logic can modify the gravity applied to the character to simulate a "wall slide" and alter the jump logic to provide an impulse away from the wall.Dashing: A dash mechanic can be implemented as a state within the character's state machine. When the dash state is active, the normal input-driven movement logic is temporarily overridden. Instead, a high-velocity, constant desiredMovement vector is fed to the character controller for a short, fixed duration. CCD should be enabled on the player's body during the dash to prevent tunneling through walls.The core principle is that the physics engine acts as a sophisticated collision and response service. The game's specific movement rules and character abilities are built on top of this service, providing a clean separation of concerns and a clear path for future expansion.Synthesis: Recommended Base ConfigurationThis final section consolidates the preceding analysis into a concise set of recommendations and provides a practical, commented code foundation for starting a modern 2D action platformer project using Phaser 3 and Rapier.Summary of Key RecommendationsAdopt Native Integration: Forgo the @phaserjs/rapier-connector plugin in favor of the phaserjs/template-rapier native integration. This provides the essential, granular control over the physics simulation required to implement nuanced "game feel" mechanics.Establish a Pixel-to-Meter Scale: Define and consistently use a scaling factor (e.g., 100 pixels = 1 meter) to translate between Phaser's rendering coordinates and Rapier's physics simulation units. This is fundamental to achieving predictable and responsive behavior.Utilize the KinematicCharacterController: Build the player controller around Rapier's KinematicCharacterController. This approach gives the developer complete authority over the character's movement, using the physics engine as a powerful collision resolver rather than a restrictive simulation.Implement "Game Feel" in Code: Mechanics like coyote time, jump buffering, and variable jump height are not physics engine features. They must be implemented in the game's own logic layer, which calculates the desiredMovement vector that is fed to the character controller each frame.Tune for Performance and Stability: Use the debug renderer extensively during development. Adjust solver iterations and the error reduction parameter (erp) to prioritize stability in a high-velocity environment. Enable CCD selectively for fast-moving objects.Complete Base Scene Code ExampleThe following TypeScript code provides a complete, self-contained Phaser Scene that demonstrates the recommended setup. It includes world initialization, scaling, the core update loop, and integration of a PlayerController class.TypeScriptimport Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { PlayerController } from './PlayerController';

// Define the scaling factor as a global constant
export const PIXELS_PER_METER = 100;

export class GameScene extends Phaser.Scene {
    private rapierWorld: RAPIER.World | null = null;
    private playerController: PlayerController | null = null;
    private debugGraphics: Phaser.GameObjects.Graphics | null = null;

    constructor() {
        super('GameScene');
    }

    preload() {
        // Preload necessary assets
        this.load.image('player', 'assets/player.png');
        this.load.image('platform', 'assets/platform.png');
    }

    async create() {
        // 1. Initialize Rapier (must be asynchronous)
        await RAPIER.init();

        // 2. Create the Physics World with tuned gravity
        const gravity = new RAPIER.Vector2(0.0, 20.0); // A slightly higher gravity for a tighter feel
        this.rapierWorld = new RAPIER.World(gravity);

        // 3. Create static level geometry
        this.createLevelGeometry();
        
        // 4. Create the Player Controller
        const playerSprite = this.add.sprite(200, 200, 'player');
        this.playerController = new PlayerController(playerSprite, this.rapierWorld, this.input.keyboard);

        // 5. Setup Debug Renderer
        this.debugGraphics = this.add.graphics();
        this.cameras.main.startFollow(playerSprite, true, 0.08, 0.08);
    }

    update(time: number, delta: number) {
        if (!this.rapierWorld ||!this.playerController) {
            return;
        }

        // 1. Step the physics simulation forward
        this.rapierWorld.step();

        // 2. Update the player controller (handles input and computes movement)
        this.playerController.update(delta);

        // 3. Manually synchronize the player sprite with the physics body
        this.playerController.syncSprite();

        // 4. Render debug graphics
        this.renderDebug();
    }

    private createLevelGeometry() {
        if (!this.rapierWorld) return;

        // Create a large ground platform
        const groundBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(500 / PIXELS_PER_METER, 580 / PIXELS_PER_METER);
        const groundBody = this.rapierWorld.createRigidBody(groundBodyDesc);
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(500 / PIXELS_PER_METER, 20 / PIXELS_PER_METER)
           .setFriction(1.0)
           .setRestitution(0.0);
        this.rapierWorld.createCollider(groundColliderDesc, groundBody);
        
        // Create a smaller floating platform
        const platformBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(600 / PIXELS_PER_METER, 400 / PIXELS_PER_METER);
        const platformBody = this.rapierWorld.createRigidBody(platformBodyDesc);
        const platformColliderDesc = RAPIER.ColliderDesc.cuboid(100 / PIXELS_PER_METER, 10 / PIXELS_PER_METER)
           .setFriction(1.0)
           .setRestitution(0.0);
        this.rapierWorld.createCollider(platformColliderDesc, platformBody);
    }

    private renderDebug() {
        if (!this.rapierWorld ||!this.debugGraphics) return;

        const { vertices, colors } = this.rapierWorld.debugRender();
        this.debugGraphics.clear();
        
        for (let i = 0; i < vertices.length / 4; i++) {
            const color = new Phaser.Display.Color().setFloat(colors[i * 8], colors[i * 8 + 1], colors[i * 8 + 2]);
            const alpha = colors[i * 8 + 3];

            this.debugGraphics.lineStyle(2, color.color, alpha);
            this.debugGraphics.strokeLineShape(new Phaser.Geom.Line(
                vertices[i * 4] * PIXELS_PER_METER,
                vertices[i * 4 + 1] * PIXELS_PER_METER,
                vertices[i * 4 + 2] * PIXELS_PER_METER,
                vertices[i * 4 + 3] * PIXELS_PER_METER
            ));
        }
    }
}
Complete Player Controller Code ExampleThe following PlayerController class encapsulates all logic related to player movement. It uses the KinematicCharacterController and includes stubs for implementing advanced "game feel" mechanics.TypeScriptimport RAPIER from '@dimforge/rapier2d-compat';
import { PIXELS_PER_METER } from './GameScene';

export class PlayerController {
    private sprite: Phaser.GameObjects.Sprite;
    private world: RAPIER.World;
    private keyboard: Phaser.Input.Keyboard.KeyboardPlugin;

    private body: RAPIER.RigidBody;
    private collider: RAPIER.Collider;
    private characterController: RAPIER.KinematicCharacterController;

    private moveSpeed = 3.5; // in meters per second
    private jumpVelocity = 8.0; // in meters per second
    private currentVelocity = new RAPIER.Vector2(0, 0);

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(sprite: Phaser.GameObjects.Sprite, world: RAPIER.World, keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
        this.sprite = sprite;
        this.world = world;
        this.keyboard = keyboard;

        // Create the Rapier components
        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
           .setTranslation(sprite.x / PIXELS_PER_METER, sprite.y / PIXELS_PER_METER);
        this.body = world.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.capsule(0.25, 0.25) // 0.5m total height, 0.25m radius
           .setFriction(1.0)
           .setRestitution(0.0);
        this.collider = world.createCollider(colliderDesc, this.body);

        // Create and configure the character controller
        const offset = 0.01;
        this.characterController = world.createCharacterController(offset);
        this.characterController.enableAutostep(0.1, 0.1, true);
        this.characterController.enableSnapToGround(0.2);
        this.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180); // 45 degrees in radians

        // Setup input
        this.cursors = this.keyboard.createCursorKeys();
    }

    public update(delta: number) {
        const desiredMovement = new RAPIER.Vector2(0, 0);
        const isGrounded = this.characterController.isGrounded();

        // --- Horizontal Movement ---
        let moveIntent = 0;
        if (this.cursors.left.isDown) {
            moveIntent = -1;
        } else if (this.cursors.right.isDown) {
            moveIntent = 1;
        }
        
        // Simple horizontal velocity for now.
        // TODO: Implement acceleration/deceleration for a smoother feel.
        this.currentVelocity.x = moveIntent * this.moveSpeed;

        // --- Vertical Movement (Gravity & Jump) ---
        const gravity = this.world.gravity.y;
        this.currentVelocity.y += gravity * (delta / 1000); // Apply gravity
        
        // TODO: Implement Coyote Time by checking for ground status over a small time window.
        if (this.cursors.space.isDown && isGrounded) {
            // TODO: Implement Jump Buffering by caching jump input for a few frames.
            this.currentVelocity.y = -this.jumpVelocity;
        }
        
        // TODO: Implement Variable Jump Height by reducing upward velocity if jump key is released.
        if (!this.cursors.space.isDown && this.currentVelocity.y < 0) {
            this.currentVelocity.y *= 0.5;
        }

        desiredMovement.x = this.currentVelocity.x * (delta / 1000);
        desiredMovement.y = this.currentVelocity.y * (delta / 1000);

        // --- Compute and Apply Movement ---
        this.characterController.computeColliderMovement(this.collider, desiredMovement);
        
        const correctedMovement = this.characterController.computedMovement();
        const currentPosition = this.body.translation();
        
        this.body.setNextKinematicTranslation({
            x: currentPosition.x + correctedMovement.x,
            y: currentPosition.y + correctedMovement.y
        });
        
        // Update internal velocity based on actual movement (important for next frame's gravity calc)
        if (this.characterController.isGrounded()) {
            this.currentVelocity.y = 0;
        }
    }

    public syncSprite() {
        const position = this.body.translation();
        this.sprite.setPosition(position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER);
    }
}
Table 2: Recommended Starting Parameters for a Fast-Paced Action PlatformerParameterRecommended ValueRationale / NotesWorld Gravity{ x: 0.0, y: 20.0 }A higher-than-realistic gravity (>9.81) creates a "tighter," less floaty jump arc, common in action platformers.Pixels-Per-Meter Scale100A clean, easy-to-manage number. Crucial for translating between render and physics units.Timestep (dt)$1/60$ (fixed)Ensures deterministic and stable physics, independent of the rendering frame rate.Velocity Iterations8Increased from default to better handle high-speed collisions and prevent tunneling.Position Iterations2Increased from default to improve stability and reduce visible penetration on impact.ERP0.8Corrects penetration errors smoothly over a few frames to prevent jitter and overcorrection.Player/Platform Friction1.0High friction allows for immediate stops, providing responsive and precise ground movement.Player/Platform Restitution0.0Zero bounciness prevents the player from unintentionally bouncing on landing.Controller offset0.01 (meters)A small gap to prevent the character collider from getting stuck on geometry seams.Controller snapToGround0.2 (meters)Helps the character feel "grounded" by preventing small bounces when moving down slopes or steps.Controller maxSlopeClimbAngle$45 * Math.PI / 180$ (45 degrees)A reasonable starting point that allows traversal of ramps but prevents climbing steep walls.
