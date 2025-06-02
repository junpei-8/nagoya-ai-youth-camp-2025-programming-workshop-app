/**
 * 3Dマップナビゲーションのためのコアゲームロジック。
 * このファイルは、シーン設定、オブジェクト作成、プレイヤー移動、
 * AIによる経路探索（ai-service.js経由）、およびゲーム状態管理を扱います。
 */

// ###########
// ## 型定義 ##
// ###########

/**
 * @template {string} AliasKey - A literal type representing the keys of mapConfig.cells.
 * @typedef {object} MapConfig
 * @property {Array<Array<AliasKey>>} layout - 2D array of aliases that are keys in mapConfig.cells.
 * @property {Object<AliasKey, CellDefinition>} cells - Definitions for each cell alias used in the layout.
 */

/**
 * @typedef {object} CellDefinition
 * @property {"start"|"goal"|"trap"|"object"|"normal"} [type] - The functional type of the cell.
 * @property {string} [image] - Path to the cell's image.
 * @property {string} [color] - Fallback color for the cell (e.g., hex string).
 */

/**
 * @typedef  {object} Point XY座標
 * @property {number} x     X座標
 * @property {number} y     Y座標
 */

// ##################
// ## グローバル変数 ##
// #################

/** @type {THREE.Scene} */
let scene; // Three.js シーンオブジェクト

/** @type {THREE.PerspectiveCamera} */
let camera; // Three.js 透視投影カメラ

/** @type {THREE.WebGLRenderer} */
let renderer; // Three.js WebGLレンダラー

/** @type {THREE.Mesh} */
let playerMesh; // 3Dシーン内のプレイヤーキャラクターを表すメッシュ

// ####################
// ## Three.js 初期化 ##
// ####################

/**
 * Three.js のシーン、カメラ、レンダラー、およびライティングを初期化します。
 *
 * @param {MapConfig} mapConfig 現在のマップの設定オブジェクト。
 */
function initScene(mapConfig) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const mapDisplayWidth = mapConfig.layout[0].length;
    const mapDisplayHeight = mapConfig.layout.length;

    camera.position.set(
        mapDisplayWidth / 2,
        mapDisplayWidth * 1.5,
        mapDisplayHeight / 2
    );
    camera.lookAt(
        new THREE.Vector3(mapDisplayWidth / 2, 0, mapDisplayHeight / 2)
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById('container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error(
            "ID 'container' のコンテナが見つかりません。レンダラーを document.body に追加します。"
        );
        document.body.appendChild(renderer.domElement);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);
}

// ###########################
// ## マップとオブジェクトの作成 ##
// ###########################

/**
 * 床タイルやプレイヤーキャラクターなどのマップオブジェクトを作成し、配置します。
 *
 * @param {MapConfig} mapConfig 現在のマップの設定オブジェクト。
 */
function createMapObjects(mapConfig) {
    const layout = mapConfig.layout;
    const cells = mapConfig.cells;

    const mapDisplayWidth = layout[0].length;
    const mapDisplayHeight = layout.length;
    let startX, startY;

    for (let j = 0; j < mapDisplayHeight; j++) { // y-coordinate (row)
        for (let i = 0; i < mapDisplayWidth; i++) { // x-coordinate (column)
            const alias = layout[j][i];
            const cellDef = cells[alias];

            const geometry = new THREE.PlaneGeometry(1, 1);
            let colorValue = 0xffffff; // Default to white if undefined

            if (cellDef && cellDef.color) {
                // Attempt to parse hex string color; fallback if invalid
                const parsedColor = parseInt(cellDef.color.replace("#", ""), 16);
                if (!isNaN(parsedColor)) {
                    colorValue = parsedColor;
                } else {
                    console.warn(`Invalid color format for alias '${alias}': ${cellDef.color}. Using default white.`);
                }
            } else {
                console.warn(`No cell definition or color for alias '${alias}'. Using default white color.`);
            }

            if (cellDef && cellDef.type === 'start') {
                startX = i;
                startY = j;
            }

            const material = new THREE.MeshStandardMaterial({
                color: colorValue,
                side: THREE.DoubleSide,
            });
            const tile = new THREE.Mesh(geometry, material);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(i, 0, j);
            scene.add(tile);
        }
    }

    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    // Player material color can be set independently or derived if needed
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x4444ff });
    playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

    if (startX !== undefined && startY !== undefined) {
        playerMesh.position.set(startX, 0.5, startY);
    } else {
        console.error("Start type cell not found in map layout. Player not placed in createMapObjects.");
        playerMesh.position.set(0, 0.5, 0); // Default placement if 'start' type cell is missing
    }
    scene.add(playerMesh);
}

// #####################
// ## プレイヤーロジック ##
// #####################

/**
 * プレイヤーキャラクターの移動を特定の方向に1ステップアニメーションさせます。
 *
 * @param {'→'|'←'|'↑'|'↓'} direction プレイヤーを移動させる方向。
 */
function movePlayer(direction) {
    if (!playerMesh) {
        console.error('プレイヤーメッシュが見つからないため、移動できません。');
        return;
    }

    let stepVec = { x: 0, z: 0 };
    switch (direction) {
        case '→': stepVec.x = 1; break;
        case '←': stepVec.x = -1; break;
        case '↑': stepVec.z = -1; break;
        case '↓': stepVec.z = 1; break;
    }

    const startPos = playerMesh.position.clone();
    const endPos = playerMesh.position.clone().add(new THREE.Vector3(stepVec.x, 0, stepVec.z));
    const duration = 200;
    let startTime = null;

    function animate(currentTime) {
        if (startTime === null) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1);
        playerMesh.position.lerpVectors(startPos, endPos, t);
        renderer.render(scene, camera);
        if (t < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// ##############
// ## ゲーム制御 ##
// ##############

/**
 * ゲームを開始または再開します：プレイヤー位置をリセットし、AIから経路を取得し、移動をアニメーション化します。
 *
 * @param {MapConfig} mapConfig 現在のマップの設定オブジェクト。
 */
async function startGame(mapConfig) {
    if (playerMesh) {
        const layout = mapConfig.layout;
        const cells = mapConfig.cells;
        const mapDisplayHeight = layout.length;
        const mapDisplayWidth = layout[0].length;
        let startX, startY;

        for (let j = 0; j < mapDisplayHeight; j++) {
            for (let i = 0; i < mapDisplayWidth; i++) {
                const alias = layout[j][i];
                const cellDef = cells[alias];
                if (cellDef && cellDef.type === 'start') {
                    startX = i;
                    startY = j;
                    break;
                }
            }
            if (startX !== undefined) break;
        }

        if (startX !== undefined && startY !== undefined) {
            playerMesh.position.set(startX, 0.5, startY);
        } else {
            console.error("Start type cell not found in map layout for startGame. Player position not reset.");
            playerMesh.position.set(0, 0.5, 0); // Default fallback
        }
    } else {
        console.warn(
            'startGameの前にplayerMeshが初期化されていません。プレイヤーが表示されないか、制御できない可能性があります。'
        );
    }
    renderer.render(scene, camera);

    const moves = await window.fetchPathFromAI(
        mapConfig,
        window.OPENAI_API_KEY
    );

    if (!moves || moves.length === 0) {
        alert(
            'ゴールに到達できるルートが見つかりませんでした。AIが経路を生成できなかったか、設定に問題がある可能性があります。'
        );
        return;
    }

    let stepIndex = 0;
    function executeMove() {
        if (stepIndex < moves.length) {
            movePlayer(moves[stepIndex]);
            stepIndex++;
            setTimeout(executeMove, 500);
        }
    }
    executeMove();
}

// ###################
// ## イベントリスナー ##
// ###################

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }
});
