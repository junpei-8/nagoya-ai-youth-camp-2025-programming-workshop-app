// ########
// ## Core Game Logic for 3D Map Navigation
// ## This file handles scene setup, object creation, player movement,
// ## pathfinding, and game state management.
// ########

// ########
// ## Global Variables & Type Definitions
// ########

/** @type {THREE.Scene} */
let scene;
/** @type {THREE.PerspectiveCamera} */
let camera;
/** @type {THREE.WebGLRenderer} */
let renderer;
/** @type {THREE.Mesh} */
let playerMesh; // Represents the player character in the 3D scene

/**
 * Configuration object for the map.
 * @typedef {object} MapConfig
 * @property {number} width - The width of the map in tiles.
 * @property {number} height - The height of the map in tiles.
 * @property {{x: number, y: number}} start - The starting coordinates of the player (2D grid terms).
 * @property {{x: number, y: number}} goal - The coordinates of the goal (2D grid terms).
 * @property {Array<{x: number, y: number}>} traps - An array of trap coordinates (2D grid terms).
 */

// ########
// ## Three.js Initialization
// ########

/**
 * Initializes the Three.js scene, camera, renderer, and lighting.
 * @param {MapConfig} mapConfig - The configuration for the current map.
 */
function initScene(mapConfig) {
  // Create the main scene
  scene = new THREE.Scene();

  // Setup the perspective camera
  // Arguments: FOV, aspect ratio, near clipping plane, far clipping plane
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  // Position the camera to overlook the map
  // X: center of map width, Y: elevated (width * 1.5 for a good overview), Z: center of map height
  camera.position.set(mapConfig.width / 2, mapConfig.width * 1.5, mapConfig.height / 2);
  // Make the camera look at the center of the map plane (Y=0)
  camera.lookAt(new THREE.Vector3(mapConfig.width / 2, 0, mapConfig.height / 2));

  // Setup the WebGL renderer with antialiasing for smoother edges
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight); // Set to full window size

  // Append the renderer's canvas element to the DOM
  const container = document.getElementById('container');
  if (container) {
    container.appendChild(renderer.domElement);
  } else {
    // Fallback if the designated container is not found
    console.error("Container with id 'container' not found. Appending renderer to document.body.");
    document.body.appendChild(renderer.domElement);
  }

  // Add ambient light for overall scene illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // White light, 60% intensity
  scene.add(ambientLight);

  // Add directional light to simulate sunlight and cast shadows (if configured)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // White light, 80% intensity
  directionalLight.position.set(0, 10, 0); // Positioned above the scene, shining down
  scene.add(directionalLight);
}

// ########
// ## Map and Objects Creation
// ########

/**
 * Creates and places map objects like floor tiles and the player character.
 * @param {MapConfig} mapConfig - The configuration for the current map.
 */
function createMapObjects(mapConfig) {
  const { width, height, start, goal, traps } = mapConfig;

  // Create floor tiles based on map dimensions
  for (let i = 0; i < width; i++) { // Corresponds to X-axis in 3D
    for (let j = 0; j < height; j++) { // Corresponds to Z-axis in 3D
      const geometry = new THREE.PlaneGeometry(1, 1); // 1x1 unit tile
      let color = 0x888888; // Default color: grey

      // Determine tile color based on its type (goal, trap, or normal)
      if (goal.x === i && goal.y === j) {
        color = 0xFFD700; // Gold for the goal tile
      } else if (traps.some(trap => trap.x === i && trap.y === j)) {
        color = 0xFF0000; // Red for trap tiles
      }

      const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
      const tile = new THREE.Mesh(geometry, material);

      // Rotate the plane to be horizontal (floor)
      tile.rotation.x = -Math.PI / 2;
      // Position the tile in the 3D scene (i maps to X, j maps to Z, Y is 0 for floor)
      tile.position.set(i, 0, j);
      scene.add(tile);
    }
  }

  // Create the player character mesh
  const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // A small cube
  const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue color
  playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
  // Position the player at the start coordinates, slightly above the floor (Y=0.5)
  playerMesh.position.set(start.x, 0.5, start.y);
  scene.add(playerMesh);
}

// ########
// ## Player Logic
// ########

/**
 * Animates the player character's movement one step in the given direction.
 * @param {'→'|'←'|'↑'|'↓'} direction - The direction to move the player.
 */
function movePlayer(direction) {
  if (!playerMesh) {
    console.error("Player mesh not found, cannot move.");
    return;
  }

  let stepVec = { x: 0, z: 0 }; // Initialize step vector for 2D movement on XZ plane
  // Determine the change in coordinates based on the direction arrow
  switch (direction) {
    case '→': // Right (positive X)
      stepVec.x = 1;
      break;
    case '←': // Left (negative X)
      stepVec.x = -1;
      break;
    case '↑': // Up (on screen, means forward or negative Z in Three.js for typical map view)
      stepVec.z = -1;
      break;
    case '↓': // Down (on screen, means backward or positive Z)
      stepVec.z = 1;
      break;
  }

  const startPos = playerMesh.position.clone(); // Current position
  // Calculate target position by adding step vector (Y remains unchanged for ground movement)
  const endPos = playerMesh.position.clone().add(new THREE.Vector3(stepVec.x, 0, stepVec.z));

  const duration = 200; // Animation duration in milliseconds
  let startTime = null; // To track animation start time

  // Animation loop using requestAnimationFrame for smooth visuals
  function animate(currentTime) {
    if (startTime === null) {
      startTime = currentTime; // Initialize startTime on the first frame
    }
    const elapsedTime = currentTime - startTime;
    // Calculate interpolation factor 't' (0 to 1)
    const t = Math.min(elapsedTime / duration, 1);

    // Interpolate player position smoothly from startPos to endPos
    playerMesh.position.lerpVectors(startPos, endPos, t);
    renderer.render(scene, camera); // Re-render the scene each frame

    if (t < 1) {
      // Continue animation if not yet complete
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate); // Start the animation loop
}

// ########
// ## Pathfinding Logic
// ########

/**
 * Finds the shortest path from start to goal using Breadth-First Search (BFS), avoiding traps.
 * The path is represented by a sequence of direction arrows.
 * Map coordinates (x, y) from config correspond to (X, Z) in the 3D scene.
 * @param {MapConfig} config - The map configuration object.
 * @returns {Array<'→'|'←'|'↑'|'↓'> | null} An array of direction strings representing the path, or null if no path is found.
 */
function findPath(config) {
    const { width, height, start, goal, traps } = config;

    // Define possible movements (dx, dz for X and Z axes, and their arrow representation)
    // '↑' (Up on screen) means moving towards negative Z.
    // '↓' (Down on screen) means moving towards positive Z.
    const dirs = [
        { dx: 1, dz: 0, name: '→' },  // Right
        { dx: -1, dz: 0, name: '←' }, // Left
        { dx: 0, dz: 1, name: '↓' },  // Down (positive Z)
        { dx: 0, dz: -1, name: '↑' }, // Up (negative Z)
    ];

    // Create a 2D grid representing passable tiles
    const passable = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => true) // Initialize all tiles as passable
    );
    // Mark trap locations as not passable
    traps.forEach(t => {
        if (t.x >= 0 && t.x < width && t.y >= 0 && t.y < height) {
            passable[t.x][t.y] = false;
        }
    });

    const queue = [];
    // Start BFS from the player's initial position. Path stores sequence of direction names.
    queue.push({ x: start.x, y: start.y, path: [] });
    // Keep track of visited cells to avoid cycles and redundant computations.
    // Store coordinates as "x,y" strings for reliable Set comparison.
    const visited = new Set([`${start.x},${start.y}`]);

    while (queue.length > 0) {
        const node = queue.shift(); // Get the current cell and its path from the queue

        // Check if the goal is reached
        if (node.x === goal.x && node.y === goal.y) {
            return node.path; // Return the sequence of moves
        }

        // Explore neighbors
        for (const d of dirs) {
            const nx = node.x + d.dx; // New x-coordinate
            const ny = node.y + d.dz; // New y-coordinate (maps to Z in 3D)

            // Check if the new position is valid and passable
            if (
                nx >= 0 && nx < width &&    // Within map bounds (width)
                ny >= 0 && ny < height &&   // Within map bounds (height)
                passable[nx][ny] &&         // Not a trap
                !visited.has(`${nx},${ny}`) // Not visited before
            ) {
                visited.add(`${nx},${ny}`); // Mark as visited
                // Add the new cell to the queue with the updated path (appended direction name)
                queue.push({ x: nx, y: ny, path: node.path.concat(d.name) });
            }
        }
    }
    return null; // No path found to the goal
}


// ########
// ## Game Control
// ########

/**
 * Starts or restarts the game: resets player position, finds path, and animates movement.
 * @param {MapConfig} mapConfig - The configuration for the current map.
 */
function startGame(mapConfig) {
  // Reset player position to the start of the map
  if (playerMesh) {
    playerMesh.position.set(mapConfig.start.x, 0.5, mapConfig.start.y);
  } else {
    // This case should ideally not happen if initScene and createMapObjects are called first.
    console.warn("playerMesh not initialized before startGame. Player may not be visible or controllable.");
  }
  renderer.render(scene, camera); // Render the scene with player at start position

  // Calculate the path using the findPath function
  const moves = findPath(mapConfig);

  if (!moves || moves.length === 0) {
    alert('ゴールに到達できるルートがありません'); // Alert if no path is found
    return;
  }

  // Execute moves sequentially with a delay
  let stepIndex = 0;
  function executeMove() {
    if (stepIndex < moves.length) {
      movePlayer(moves[stepIndex]);
      stepIndex++;
      setTimeout(executeMove, 500); // 500ms delay between moves
    }
  }
  executeMove(); // Start the movement sequence
}

// ########
// ## Event Listeners
// ########

// Handle window resize events to keep the viewport and camera settings updated.
window.addEventListener('resize', () => {
  if (camera && renderer) {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Apply the aspect ratio change

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera); // Re-render the scene with new dimensions
  }
});
