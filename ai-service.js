/**
 * 3Dマップナビゲーションのためのコアゲームロジック。
 * このファイルは、シーン設定、オブジェクト作成、プレイヤー移動、
 * AIによる経路探索（ai-service.js経由）、およびゲーム状態管理を扱います。
 */

// ###########
// ## 型定義 ##
// ###########

/**
 * @template {string} CellKey - mapConfig.cells のキーを表すリテラル型。
 * @typedef {object} MapConfig
 * @property {Array<Array<CellKey>>} layout - mapConfig.cells のキーであるセルキーの2次元配列。
 * @property {Object<CellKey, CellDefinition>} cells - レイアウトで使用される各セルキーの定義。
 */

/**
 * @typedef {object} CellDefinition
 * @property {"start"|"goal"|"trap"|"object"|"normal"} [type] - セルの機能的な型。
 * @property {string} [image] - セルの画像へのパス。
 * @property {string} [color] - セルのフォールバック色（例: 16進文字列）。
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

    // マップのタイルを作成
    for (let j = 0; j < mapDisplayHeight; j++) { // y座標（行）
        for (let i = 0; i < mapDisplayWidth; i++) { // x座標（列）
            const alias = layout[j][i];
            const cellDef = cells[alias];
            
            const geometry = new THREE.PlaneGeometry(1, 1); // 1x1ユニットのタイル
            let colorValue = 0xffffff; // 未定義の場合はデフォルトで白に

            if (cellDef && cellDef.color) {
                // 16進文字列の色を解析試行。無効な場合はフォールバック
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
            // 平面を回転させて水平にする（床）
            tile.rotation.x = -Math.PI / 2;
            // タイルを3Dシーンに配置（iはX、jはZに対応）
            tile.position.set(i, 0, j);
            scene.add(tile);
        }
    }

    // プレイヤーキャラクターのメッシュを作成
    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    // プレイヤーマテリアルの色は独立して設定、または必要に応じて派生可能
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x4444ff }); 
    playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

    if (startX !== undefined && startY !== undefined) {
        // プレイヤーを開始座標に配置、床より少し上（Y=0.5）
        playerMesh.position.set(startX, 0.5, startY);
    } else {
        console.error("Start type cell not found in map layout. Player not placed in createMapObjects.");
        playerMesh.position.set(0, 0.5, 0); // 'start'タイプのセルが見つからない場合のデフォルト配置
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
            // プレイヤー位置をマップの開始地点にリセット
            playerMesh.position.set(startX, 0.5, startY);
        } else {
            console.error("Start type cell not found in map layout for startGame. Player position not reset.");
            playerMesh.position.set(0, 0.5, 0); // デフォルトのフォールバック
        }
    } else {
        console.warn(
            'startGameの前にplayerMeshが初期化されていません。プレイヤーが表示されないか、制御できない可能性があります。'
        );
    }
    renderer.render(scene, camera);

    // aiService.jsのfetchPathFromAI関数を使用してAIから経路を取得
    // window.OPENAI_API_KEY は、学生が secret.example.js を secret.js にコピーし、
    // 自身のAPIキーを設定し、HTMLで secret.js を読み込むことで設定される想定です。
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

    // 遅延を挟んで移動を順番に実行
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

// ########################
// ## アプリケーション初期化 ##
// ########################

/**
 * マップアプリケーションを初期化します。
 * シーン、オブジェクトの作成、イベントリスナーの設定など、共通の初期化処理を行います。
 * @param {MapConfig} mapConfig - 使用するマップの設定オブジェクト。 (例: map-1/map.js や map-2/map.js から提供される)
 */
function initializeAppMap(mapConfig) {
    if (mapConfig) {
        // APIキーの確認 (secret.js が読み込まれ、有効なキーが設定されているか)
        if (
            typeof window.OPENAI_API_KEY !== 'undefined' &&
            window.OPENAI_API_KEY !== 'YOUR_DUMMY_API_KEY_HERE'
        ) {
            initScene(mapConfig);
            createMapObjects(mapConfig);
            
            if (renderer && scene && camera) { 
                renderer.render(scene, camera);
            } else {
                console.error(
                    'レンダラー、シーン、またはカメラが初期レンダリング呼び出し前に初期化されていません。'
                );
            }
            
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.addEventListener('click', () => {
                    startGame(mapConfig);
                });
            }
        } else {
            console.error(
                'OpenAI APIキーが正しく設定されていません。指示に従って secret.js を設定してください。'
            );
            alert(
                'OpenAI APIキーが正しく設定されていません。\n\n手順:\n1. ルートの secret.example.js を secret.js にコピーします。\n2. secret.js 内のダミーキーを実際のキーに置き換えます。\n3. このHTMLファイル内の script タグのコメントを解除します。\n\n上記を確認してください。'
            );
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.disabled = true;
                startButton.innerText = 'APIキー未設定';
            }
        }
    } else {
        console.error(
            'mapConfig が定義されていません。map.js が正しく読み込まれ、window.mapConfig を定義しているか確認してください。'
        );
        alert(
            'mapConfig が見つかりません。map.js を確認してください。'
        );
    }
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
