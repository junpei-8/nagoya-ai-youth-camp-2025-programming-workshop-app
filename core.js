let scene, camera, renderer, playerMesh;

// Initialize the scene, camera, and renderer
function initScene(mapConfig) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(mapConfig.width / 2, mapConfig.width * 1.5, mapConfig.height / 2);
  camera.lookAt(new THREE.Vector3(mapConfig.width / 2, 0, mapConfig.height / 2));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const container = document.getElementById('container');
  if (container) {
    container.appendChild(renderer.domElement);
  } else {
    console.error("Container with id 'container' not found.");
    document.body.appendChild(renderer.domElement); // Fallback to body
  }


  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 0);
  scene.add(directionalLight);
}

// Create map objects (walls, obstacles, etc.)
function createMapObjects(mapConfig) {
  const { width, height, start, goal, traps } = mapConfig;

  // Create floor tiles
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      let color = 0x888888; // Default grey
      if (goal.x === i && goal.y === j) {
        color = 0xFFD700; // Gold for goal
      } else if (traps.some(trap => trap.x === i && trap.y === j)) {
        color = 0xFF0000; // Red for traps
      }
      const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
      const tile = new THREE.Mesh(geometry, material);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(i, 0, j);
      scene.add(tile);
    }
  }

  // Create player
  const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue
  playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
  playerMesh.position.set(start.x, 0.5, start.y);
  scene.add(playerMesh);
}

// Handle player movement
function movePlayer(direction) {
  if (!playerMesh) return;

  let stepVec = { x: 0, z: 0 };
  switch (direction) {
    case '→': // Right
      stepVec.x = 1;
      break;
    case '←': // Left
      stepVec.x = -1;
      break;
    case '↑': // Up (forward in Z)
      stepVec.z = -1;
      break;
    case '↓': // Down (backward in Z)
      stepVec.z = 1;
      break;
  }

  const startPos = playerMesh.position.clone();
  const endPos = playerMesh.position.clone().add(new THREE.Vector3(stepVec.x, 0, stepVec.z));

  const duration = 200; // 200ms animation
  let startTime = null;

  function animate(currentTime) {
    if (startTime === null) startTime = currentTime;
    const elapsedTime = currentTime - startTime;
    const t = Math.min(elapsedTime / duration, 1);

    playerMesh.position.lerpVectors(startPos, endPos, t);
    renderer.render(scene, camera);

    if (t < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

// Start the game
function startGame(mapConfig, findPathFunc) {
  if (playerMesh) {
    playerMesh.position.set(mapConfig.start.x, 0.5, mapConfig.start.y);
  } else {
    // Initialize playerMesh if it doesn't exist (e.g. first run)
    // This assumes createMapObjects might not have been called or playerMesh was removed
    // For robustness, consider ensuring playerMesh is always valid before startGame
    console.warn("playerMesh not initialized before startGame. Attempting to create it.");
    // Potentially call createMapObjects here if appropriate, or ensure it's called before startGame
    // For now, we'll just set a default position if it exists.
    // If it doesn't exist, movePlayer will not work.
  }
  renderer.render(scene, camera);


  const moves = findPathFunc(mapConfig);

  if (!moves || moves.length === 0) {
    alert('ゴールに到達できるルートがありません');
    return;
  }

  let stepIndex = 0;
  function executeMove() {
    if (stepIndex < moves.length) {
      movePlayer(moves[stepIndex]);
      stepIndex++;
      setTimeout(executeMove, 500); // 500ms delay
    }
  }
  executeMove();
}

// Handle window resize
window.addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
});
