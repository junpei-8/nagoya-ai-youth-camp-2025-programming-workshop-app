/**
 * 3Dマップナビゲーションのためのコアゲームロジック。
 * このファイルは、シーン設定、オブジェクト作成、プレイヤー移動、
 * AIによる経路探索（ai-service.js経由）、およびゲーム状態管理を扱います。
 */

// ###########
// ## 型定義 ##
// ###########

/**
 * @typedef {object}        MapConfig  このマップの主要な設定オブジェクト。
 *
 * @property {number}       width      マップの幅（タイル数）。例: 6 はマップの幅がタイル6つ分であることを意味します。
 *                                     マップの横マス数。
 *
 * @property {number}       height     マップの高さ（タイル数）。例: 6 はマップの高さがタイル6つ分であることを意味します。
 *                                     マップの縦マス数。
 *
 * @property {Point}        start      プレイヤーの開始座標。
 *                                     'x' は水平位置 (0 から width-1 まで)、
 *                                     'y' は奥行きの位置 (0 から height-1 まで) です。
 *                                     スタート座標 { x:0, y:0 } のように指定。
 * @property {Point}        goal       ゴール/宝物の座標。
 *                                     'start' と同じ座標系を使用します。
 *                                     ゴール座標 { x:5, y:5 } のように指定。
 *
 * @property {Array<Point>} traps      罠の座標の配列。
 *                                     配列内の各オブジェクトは 'x' と 'y' プロパティを持つ必要があります。
 *                                     罠の座標リスト（複数指定可）。
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
    // メインシーンを作成
    scene = new THREE.Scene();

    // 透視投影カメラを設定
    // 引数: 視野角(FOV), アスペクト比, 近クリッピング平面, 遠クリッピング平面
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // マップを見下ろすようにカメラを配置
    // X: マップ幅の中心, Y: 高い位置（マップ幅 * 1.5 で良好な概観）, Z: マップ高さの中心
    camera.position.set(
        mapConfig.width / 2,
        mapConfig.width * 1.5,
        mapConfig.height / 2
    );
    // カメラをマップ平面の中心に向ける (Y=0)
    camera.lookAt(
        new THREE.Vector3(mapConfig.width / 2, 0, mapConfig.height / 2)
    );

    // WebGLレンダラーをアンチエイリアス有効で設定（エッジを滑らかに）
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // ウィンドウ全体サイズに設定

    // レンダラーのcanvas要素をDOMに追加
    const container = document.getElementById('container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        // 指定されたコンテナが見つからない場合のフォールバック
        console.error(
            "ID 'container' のコンテナが見つかりません。レンダラーを document.body に追加します。"
        );
        document.body.appendChild(renderer.domElement);
    }

    // 環境光を追加（シーン全体を照らす）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 白色光、強度60%
    scene.add(ambientLight);

    // 指向性ライトを追加（太陽光をシミュレートし、設定されていれば影を落とす）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 白色光、強度80%
    directionalLight.position.set(0, 10, 0); // シーンの上に配置し、下向きに照らす
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
    const { width, height, start, goal, traps } = mapConfig;

    // マップの寸法に基づいて床タイルを作成
    for (let i = 0; i < width; i++) {
        // 3D空間のX軸に対応
        for (let j = 0; j < height; j++) {
            // 3D空間のZ軸に対応
            const geometry = new THREE.PlaneGeometry(1, 1); // 1x1ユニットのタイル
            let color = 0x888888; // デフォルトの色: 灰色

            // タイルの種類（ゴール、罠、通常）に基づいて色を決定
            if (goal.x === i && goal.y === j) {
                color = 0xffd700; // ゴールタイルは金色
            } else if (traps.some((trap) => trap.x === i && trap.y === j)) {
                color = 0xff0000; // 罠タイルは赤色
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                side: THREE.DoubleSide,
            });
            const tile = new THREE.Mesh(geometry, material);

            // 平面を回転させて水平にする（床）
            tile.rotation.x = -Math.PI / 2;
            // 3Dシーンにタイルを配置（iはX、jはZに対応、床なのでYは0）
            tile.position.set(i, 0, j);
            scene.add(tile);
        }
    }

    // プレイヤーキャラクターのメッシュを作成
    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // 小さな立方体
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // 青色
    playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    // プレイヤーを開始座標に配置、床より少し上（Y=0.5）
    playerMesh.position.set(start.x, 0.5, start.y);
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

    // XZ平面上の2D移動のためのステップベクトルを初期化
    let stepVec = { x: 0, z: 0 };

    // 方向矢印に基づいて座標の変化を決定
    switch (direction) {
        case '→': // 右（正のX）
            stepVec.x = 1;
            break;
        case '←': // 左（負のX）
            stepVec.x = -1;
            break;
        case '↑': // 上（画面上では前進、Three.jsの一般的なマップビューでは負のZ）
            stepVec.z = -1;
            break;
        case '↓': // 下（画面上では後退、正のZ）
            stepVec.z = 1;
            break;
    }

    const startPos = playerMesh.position.clone(); // 現在位置
    // ステップベクトルを加算して目標位置を計算（地面移動なのでYは変更なし）
    const endPos = playerMesh.position
        .clone()
        .add(new THREE.Vector3(stepVec.x, 0, stepVec.z));

    const duration = 200; // アニメーション時間（ミリ秒）
    let startTime = null; // アニメーション開始時間を追跡

    // requestAnimationFrameを使用したアニメーションループで滑らかな表示を実現
    function animate(currentTime) {
        if (startTime === null) {
            startTime = currentTime; // 最初のフレームでstartTimeを初期化
        }
        const elapsedTime = currentTime - startTime;
        // 補間係数 't' (0から1) を計算
        const t = Math.min(elapsedTime / duration, 1);

        // startPosからendPosへプレイヤー位置を滑らかに補間
        playerMesh.position.lerpVectors(startPos, endPos, t);
        renderer.render(scene, camera); // 各フレームでシーンを再レンダリング

        if (t < 1) {
            // アニメーションが完了していなければ継続
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate); // アニメーションループを開始
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
    // プレイヤー位置をマップの開始地点にリセット
    if (playerMesh) {
        playerMesh.position.set(mapConfig.start.x, 0.5, mapConfig.start.y);
    } else {
        // このケースは、initSceneとcreateMapObjectsが最初に呼び出されれば理想的には発生しないはずです。
        console.warn(
            'startGameの前にplayerMeshが初期化されていません。プレイヤーが表示されないか、制御できない可能性があります。'
        );
    }
    renderer.render(scene, camera); // 開始位置にプレイヤーがいる状態でシーンをレンダリング

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
        ); // 経路が見つからない場合にアラート
        return;
    }

    // 遅延を挟んで移動を順番に実行
    let stepIndex = 0;
    function executeMove() {
        if (stepIndex < moves.length) {
            movePlayer(moves[stepIndex]);
            stepIndex++;
            setTimeout(executeMove, 500); // 移動間の遅延500ミリ秒
        }
    }
    executeMove(); // 移動シーケンスを開始
}

// ###################
// ## イベントリスナー ##
// ###################

// ウィンドウリサイズイベントを処理して、ビューポートとカメラ設定を更新し続けます。
window.addEventListener('resize', () => {
    if (camera && renderer) {
        // カメラのアスペクト比を更新
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix(); // アスペクト比の変更を適用

        // レンダラーのサイズを更新
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera); // 新しい寸法でシーンを再レンダリング
    }
});
