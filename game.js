import {
    renderRobotModel,
    renderObstacleModel,
    renderTrapModel,
    renderGoalModel,
    renderTileModel,
} from './game-model.js';

// ###########
// ## 型定義 ##
// ###########

/**
 * @typedef {object} ThreeJS
 */

/**
 * @typedef {object} MapConfig
 *
 * @property {string[][]}                    layout マップレイアウト
 * @property {Record<string, MapCellConfig>} cell   セル定義
 */

/**
 * @typedef {object} MapCellConfig
 *
 * @property {MapCellConfigType} type          セルタイプ
 * @property {string}            [image]       セル画像パス
 * @property {string}            [color]       セル色
 * @property {string}            [description] セルの説明
 */

/**
 * @typedef {"start"|"end"|"trap"|"object"|"normal"|"custom"} MapCellConfigType
 */

// #############
// ## 共通処理 ##
// #############

/**
 * Three.js ライブラリを動的にインポートする。
 *
 * @returns {Promise<object>} Three.js インスタンス
 * @throws  {Error}           Three.js のロードに失敗した場合エラーをスロー
 */
async function loadThreeJS() {
    try {
        const threeJS = await import('https://esm.sh/three@0.177.0');
        return threeJS;

        // ↓ エラーが発生した場合はエラーをスロー
    } catch (error) {
        console.error('Three.js の動的インポートに失敗しました:', error);
        alert('Three.js の読み込みに失敗しました。ゲームを開始できません。');
        throw error;
    }
}

/**
 * requestAnimationFrameをPromiseでラップする関数。
 *
 * @returns {Promise<number>} タイムスタンプ
 */
function animateFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame((timestamp) => resolve(timestamp));
    });
}

// ######################
// ## ゲームのセットアップ ##
// ######################

/**
 * @typedef {ReturnType<typeof renderMap>} MapContext
 */

/**
 * カメラの設定を更新する共通関数
 * @param {object} params パラメータ
 * @param {object} params.camera カメラオブジェクト
 * @param {number} params.mapDisplayWidth マップの幅
 * @param {number} params.mapDisplayHeight マップの高さ
 */
function updateCameraSettings({ camera, mapDisplayWidth, mapDisplayHeight }) {
    // マップの最大サイズを取得
    const mapMaxSize = Math.max(mapDisplayWidth, mapDisplayHeight);

    // FOVを計算して盤面がcanvas内に確実に収まるようにする
    // カメラ距離を増やしてより広い範囲を表示
    const cameraDistance = mapMaxSize * 2.5; // 2.2 から 2.5 に変更
    const topMargin = 3.0; // 2.5 から 3.0 に増やして余白を確保
    const halfMapSizeWithMargin = mapMaxSize / 2 + topMargin;
    const fov =
        2 * Math.atan(halfMapSizeWithMargin / cameraDistance) * (180 / Math.PI);

    // カメラのFOVを更新
    camera.fov = fov;
    camera.updateProjectionMatrix();

    // カメラの位置を設定
    const cameraHeight = cameraDistance * 0.52;
    const cameraOffsetZ = cameraDistance * 0.48;
    camera.position.set(
        (mapDisplayWidth - 1) / 2,
        cameraHeight,
        (mapDisplayHeight - 1) / 2 + cameraOffsetZ
    );

    // カメラの向きを設定
    camera.lookAt((mapDisplayWidth - 1) / 2, 0, (mapDisplayHeight - 1) / 2);
}

/**
 * マップをレンダリングし、基本的なシーンを設定する。
 *
 * @param   {object}      params           レンダリングパラメータ
 * @param   {ThreeJS}     params.threeJS   Three.js インスタンス
 * @param   {HTMLElement} params.element   レンダリング対象の要素
 * @param   {MapConfig}   params.mapConfig マップ設定オブジェクト
 * @returns                                マップコンテキスト
 * @throws  {Error}                        スタート位置またはエンド位置が見つからない場合にエラーをスロー
 */
function renderMap({ threeJS, element, mapConfig }) {
    // スタート位置とエンド位置を検索
    const layout = mapConfig.layout;

    /**
     * @type {{
     *  start: { x: number; y: number };
     *  end: { x: number; y: number };
     * }}
     */
    const position = {};

    // 宝箱を保存するための変数
    let goalChest = null;

    // スタート位置とエンド位置を検索
    for (let j = 0; j < layout.length; j++) {
        for (let i = 0; i < layout[j].length; i++) {
            const cellAlias = layout[j][i];
            const cellDef = mapConfig.cell[cellAlias];

            // セル定義がない場合はスキップ
            if (!cellDef) {
                continue;
            }

            // セルタイプに応じて位置を設定
            if (cellDef.type === 'start') {
                position.start = { x: i, y: j };
            }
            if (cellDef.type === 'end') {
                position.end = { x: i, y: j };
            }
        }
    }

    // スタート位置またはエンド位置が見つからない場合はエラーをスロー
    if (!position.start) {
        throw new Error('マップに開始位置が見つかりません。');
    }
    if (!position.end) {
        throw new Error('マップに終了位置が見つかりません。');
    }

    // シーンを作成
    const scene = new threeJS.Scene();

    // マップのレイアウトを取得
    const mapDisplayWidth = layout[0].length;
    const mapDisplayHeight = layout.length;

    // game-viewer のサイズから正方形のサイズを計算
    const minSize = Math.min(element.offsetWidth, element.offsetHeight);

    // PerspectiveCamera を作成（初期FOVは後で設定）
    const camera = new threeJS.PerspectiveCamera(45, 1, 0.1, 1000);

    // カメラの設定を更新
    updateCameraSettings({ camera, mapDisplayWidth, mapDisplayHeight });

    // レンダラーを作成
    const renderer = new threeJS.WebGLRenderer({ antialias: true });
    renderer.setSize(minSize, minSize);
    renderer.setClearColor(0xffffff); // 背景色を白に設定
    element.appendChild(renderer.domElement);

    // 環境光を作成
    const ambientLight = new threeJS.AmbientLight(0xffffff, 0.6); // 環境光
    scene.add(ambientLight);

    // 平行光源を作成
    const directionalLight = new threeJS.DirectionalLight(0xffffff, 0.8); // 平行光源
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // ベースとなる大きな盤面を作成
    const boardGeometry = new threeJS.BoxGeometry(
        mapDisplayWidth,
        0.3,
        mapDisplayHeight
    );
    const boardMaterial = new threeJS.MeshStandardMaterial({
        color: 0x8b6f47, // 木目調の色
        side: threeJS.DoubleSide,
    });
    const board = new threeJS.Mesh(boardGeometry, boardMaterial);
    board.position.set(
        (mapDisplayWidth - 1) / 2,
        -0.15,
        (mapDisplayHeight - 1) / 2
    );
    scene.add(board);

    // オブジェクトとトラップの位置を記録
    const objectPositions = [];
    const trapPositions = [];

    // マップタイルを作成
    for (let j = 0; j < mapDisplayHeight; j++) {
        for (let i = 0; i < mapDisplayWidth; i++) {
            const cellAlias = layout[j][i];
            const cellDef = mapConfig.cell[cellAlias];

            // セル定義がない場合はスキップ
            if (!cellDef) {
                continue;
            }

            // セルタイプに応じて適切なレンダリング関数を呼び出す
            let element = null;

            switch (cellDef.type) {
                case 'object':
                    element = renderObstacleModel({
                        threeJS,
                        x: i,
                        z: j,
                    });
                    // オブジェクトの位置を記録
                    objectPositions.push({ x: i, y: j });
                    break;
                case 'trap':
                    element = renderTrapModel({ threeJS, x: i, z: j });
                    // トラップの位置を記録
                    trapPositions.push({ x: i, y: j });
                    break;
                case 'end':
                    // ゴールは宝箱で表示するが、タイルの色も表示
                    let endColorValue = 0xcccccc;
                    if (cellDef.color) {
                        const parsedColor = parseInt(
                            cellDef.color.replace('#', ''),
                            16
                        );
                        endColorValue = isNaN(parsedColor)
                            ? endColorValue
                            : parsedColor;
                    }
                    // タイルを描画
                    const endTile = renderTileModel({
                        threeJS,
                        x: i,
                        z: j,
                        color: endColorValue,
                    });
                    scene.add(endTile);
                    // 宝箱を追加
                    element = renderGoalModel({ threeJS, x: i, z: j });
                    goalChest = element; // 宝箱を保存
                    break;
                case 'start':
                    // スタートタイルは通常のタイルとして描画
                    let startColorValue = 0xcccccc;
                    if (cellDef.color) {
                        const parsedColor = parseInt(
                            cellDef.color.replace('#', ''),
                            16
                        );
                        startColorValue = isNaN(parsedColor)
                            ? startColorValue
                            : parsedColor;
                    }
                    element = renderTileModel({
                        threeJS,
                        x: i,
                        z: j,
                        color: startColorValue,
                    });
                    break;
                case 'normal':
                default:
                    // 通常のタイルを描画
                    let colorValue = 0xcccccc; // デフォルト色
                    if (cellDef.color) {
                        const parsedColor = parseInt(
                            cellDef.color.replace('#', ''),
                            16
                        );
                        colorValue = isNaN(parsedColor)
                            ? colorValue
                            : parsedColor;
                    }
                    element = renderTileModel({
                        threeJS,
                        x: i,
                        z: j,
                        color: colorValue,
                    });
                    break;
            }

            // 要素をシーンに追加
            if (element) {
                scene.add(element);
            }
        }
    }

    // 初期レンダリング
    renderer.render(scene, camera);

    // リサイズハンドラーは setupGame で設定される
    return {
        scene,
        camera,
        renderer,
        position,
        mapDisplayWidth,
        mapDisplayHeight,
        goalChest, // 宝箱を返す
        objectPositions, // オブジェクトの位置を返す
        trapPositions, // トラップの位置を返す
    };
}

/**
 * プレイヤーキャラクターを作成し、シーンに追加する。
 *
 * @param   {object}     params            プレイヤー作成パラメータ
 * @param   {ThreeJS}    params.threeJS    Three.js インスタンス
 * @param   {MapContext} params.mapContext マップコンテキスト
 * @returns                                     プレイヤー
 */
function createPlayer({ threeJS, mapContext }) {
    // ロボット（プレイヤー）を作成
    const player = renderRobotModel({
        threeJS,
        x: Math.round(mapContext.position.start.x),
        y: 0, // Y座標は renderRobot 内で調整される
        z: Math.round(mapContext.position.start.y),
    });

    // プレイヤーをシーンに追加
    mapContext.scene.add(player);

    // プレイヤー表示のための初期レンダリング
    mapContext.renderer.render(mapContext.scene, mapContext.camera);

    return player;
}

/**
 * @typedef {Awaited<ReturnType<typeof setupGame>>} GameContext
 */

/**
 * ゲームのレンダリング処理を行う。\
 * Three.js のロード、マップレンダリング、プレイヤー作成を順番に実行する。
 *
 * @param   {object}      params           セットアップパラメータ
 * @param   {HTMLElement} params.element   レンダリング対象の要素
 * @param   {object}      params.mapConfig マップ設定オブジェクト
 * @returns                                コンテキストオブジェクト
 * @throws  {Error}                        Three.js のロードまたはゲームの初期化に失敗した場合エラーをスロー
 */
export async function renderGame({ element, mapConfig }) {
    const threeJS = await loadThreeJS();

    // マップをレンダリングし、シーン、カメラ、レンダラーを取得
    const mapContext = renderMap({
        threeJS,
        element,
        mapConfig,
    });

    // プレイヤーを作成
    const player = createPlayer({
        threeJS,
        mapContext,
    });

    // ウィンドウリサイズ処理を更新
    window.addEventListener('resize', () => {
        if (mapContext.camera && mapContext.renderer && element) {
            // game-viewer のサイズから正方形のサイズを再計算
            const newMinSize = Math.min(
                element.offsetWidth,
                element.offsetHeight
            );

            // カメラの設定を更新
            updateCameraSettings({
                camera: mapContext.camera,
                mapDisplayWidth: mapContext.mapDisplayWidth,
                mapDisplayHeight: mapContext.mapDisplayHeight,
            });

            // レンダラーのサイズを正方形に更新
            mapContext.renderer.setSize(newMinSize, newMinSize);
            mapContext.renderer.render(mapContext.scene, mapContext.camera);
        }
    });

    // ゲームコンテキストを返す
    return {
        threeJS,
        player,
        ...mapContext,
    };
}

// #####################
// ## 移動関連のロジック ##
// #####################

/**
 * 宝箱が回転しながら上昇するアニメーション。
 *
 * @param {GameContext} context ゲームコンテキスト
 */
function animateGoalChest(context) {
    const { renderer, scene, camera, goalChest } = context;

    if (!goalChest) return;

    const duration = 2000; // 2秒間のアニメーション
    let startTime = null;
    const startY = goalChest.position.y;
    const targetY = startY + 1.5; // 1.5ユニット上昇（以前の3から減らした）
    const totalRotations = 5; // 5回転

    function animate(currentTime) {
        if (startTime === null) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1);

        // 上昇
        goalChest.position.y = startY + (targetY - startY) * t;

        // 回転（最後に正面を向く）
        if (t < 1) {
            // アニメーション中は回転
            goalChest.rotation.y = t * Math.PI * 2 * totalRotations;
        } else {
            // アニメーション終了時は正面を向く
            goalChest.rotation.y = 0;
            // アニメーション完了後に成功アラートを表示
            setTimeout(() => {
                alert('ゴールに到達しました！ おめでとうございます！');
            }, 100);
        }

        renderer.render(scene, camera);

        if (t < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

/**
 * 移動コマンド文字の定義。
 */
export const movementKey = {
    LEFT: '←',
    RIGHT: '→',
    UP: '↑',
    DOWN: '↓',
};

/**
 * プレイヤーを指定された方向に1ステップ移動させ、アニメーション表示する。
 *
 * @param   {object}        params           移動パラメータ
 * @param   {GameContext}   params.context   ゲームコンテキストオブジェクト
 * @param   {string}        params.direction 移動方向
 * @returns {Promise<void>}              アニメーション完了時に解決されるPromise
 */
export async function movePlayer({ context, direction }) {
    const {
        threeJS,
        scene,
        camera,
        renderer,
        player,
        mapDisplayWidth,
        mapDisplayHeight,
    } = context;

    // 方向の設定と早期リターン
    const directionConfig = {
        [movementKey.RIGHT]: { x: 1, z: 0, rotation: Math.PI / 2 },
        [movementKey.LEFT]: { x: -1, z: 0, rotation: -Math.PI / 2 },
        [movementKey.UP]: { x: 0, z: -1, rotation: Math.PI },
        [movementKey.DOWN]: { x: 0, z: 1, rotation: 0 },
    };

    const config = directionConfig[direction];
    if (!config) {
        console.log('未知の方向:', direction);
        return; // 未知の方向の場合は早期リターン
    }

    const stepVec = { x: config.x, z: config.z };
    const targetRotationY = config.rotation;

    // 現在位置を整数に丸めてから計算（浮動小数点誤差を防ぐ）
    const currentX = Math.round(player.position.x);
    const currentZ = Math.round(player.position.z);
    const startPos = player.position.clone();

    const targetX = currentX + stepVec.x;
    const targetZ = currentZ + stepVec.z;

    // 盤外への移動を防ぐ（早期リターン）
    const isOutOfBounds =
        targetX < 0 ||
        targetX >= mapDisplayWidth ||
        targetZ < 0 ||
        targetZ >= mapDisplayHeight;
    if (isOutOfBounds) {
        console.log(
            `盤外への移動をブロック: (${currentX},${currentZ}) -> (${targetX},${targetZ})`
        );
        return;
    }

    // オブジェクトとの衝突判定（早期リターン）
    const isObjectCollision = context.objectPositions.some(
        (pos) => pos.x === targetX && pos.y === targetZ
    );
    if (isObjectCollision) {
        console.log('オブジェクトとの衝突を検出しました');
        return;
    }

    // トラップとの衝突判定（移動を許可し、移動後にチェック）
    const isTrapCollision = context.trapPositions.some(
        (pos) => pos.x === targetX && pos.y === targetZ
    );

    // 最終位置も整数座標にする
    const endPos = new threeJS.Vector3(targetX, player.position.y, targetZ);

    // アニメーションの設定
    const duration = 240;
    const rotationDuration = 100; // 回転用の短い持続時間
    const startRotationY = player.rotation.y;

    // 回転角度の差を最短経路に調整
    let rotationDiff = targetRotationY - startRotationY;
    if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

    // アニメーション開始
    const startTime = await animateFrame();
    let currentTime = startTime;

    // アニメーションループ
    while (true) {
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1); // 進行度 (0から1)
        const rotationT = Math.min(elapsedTime / rotationDuration, 1); // 回転用の進行度

        // 位置の補間
        player.position.lerpVectors(startPos, endPos, t);

        // 回転の補間（より早く完了）
        player.rotation.y = startRotationY + rotationDiff * rotationT;

        renderer.render(scene, camera); // シーンをレンダリング

        // アニメーション完了判定
        if (t >= 1) {
            break;
        }

        // 次のフレームを待つ
        currentTime = await animateFrame();
    }

    // 移動完了時の処理
    // トラップに到達したかチェック
    if (isTrapCollision) {
        console.log('トラップに接触しました！');
        context.gameOver = true;
        requestAnimationFrame(() =>
            alert('トラップに接触しました！ ゲームオーバーです。')
        );
        return; // 早期リターン
    }

    // ゴールに到達したかチェック
    const isGoal =
        targetX === context.position.end.x &&
        targetZ === context.position.end.y;
    if (isGoal) {
        console.log('ゴールに到達しました！');
        animateGoalChest(context);
    }
}

/**
 * 宝箱を初期状態にリセットする関数。
 *
 * @param {GameContext} gameContext ゲームコンテキスト
 */
function resetGoalChest(gameContext) {
    const { goalChest } = gameContext;
    if (goalChest) {
        // 宝箱の回転と位置を初期化
        goalChest.rotation.y = 0;
        goalChest.position.y = 0;
        console.log('宝箱を初期状態にリセットしました');
    }
}

/**
 * AIレスポンス表示エリアをレンダリングする。
 *
 * @param {HTMLElement} element レンダリング対象の要素
 */
function renderGameAIResponseViewer(element) {
    // ラベルを作成
    const label = document.createElement('div');
    label.id = 'ai-response-label';
    label.textContent = 'AIからの指示';

    // レスポンス表示エリアを作成
    const response = document.createElement('div');
    response.id = 'ai-response';

    // 要素を追加
    element.appendChild(label);
    element.appendChild(response);
}

/**
 * ゲームトリガーボタンをレンダリングする。
 *
 * @param {HTMLElement} element レンダリング対象の要素
 */
function renderGameTrigger(element) {
    element.textContent = 'スタート';
}

/**
 * プレイヤー移動処理を開始するボタンのセットアップとイベントリスナーの追加。
 *
 * @param {object}            params             設定パラメータ
 * @param {HTMLButtonElement} params.element     処理を開始するボタン要素
 * @param {MapConfig}         params.mapConfig   マップ設定オブジェクト
 * @param {GameContext}       params.gameContext ゲームコンテキストオブジェクト
 * @param {function}          params.pathFetcher AIから経路を取得する関数
 */
function setupPlayerMoverButton({
    element,
    mapConfig,
    gameContext,
    pathFetcher,
}) {
    const { scene, camera, renderer, player } = gameContext;

    // 初回実行フラグ
    let hasRunOnce = false;

    // ボタンの初期化はrenderGameTriggerで実行済み

    // GameContextにmapDisplayWidthとmapDisplayHeightが含まれているか確認
    console.log(
        'GameContext check:',
        gameContext.mapDisplayWidth,
        'x',
        gameContext.mapDisplayHeight
    );

    element.addEventListener('click', async () => {
        console.log('AIによる経路指示に基づくプレイヤー移動を開始します...');
        element.disabled = true; // 処理中にボタンを無効化

        // 再実行時に宝箱をリセット
        if (hasRunOnce) {
            resetGoalChest(gameContext);

            // ゲームオーバーフラグをリセット
            gameContext.gameOver = false;

            // レスポンス表示をクリア
            const responseEl = document.getElementById('ai-response');
            if (responseEl) {
                responseEl.innerHTML = '';
                responseEl.classList.remove('visible');
            }
        }

        // スタート位置にプレイヤーをリセット (オプション)
        let startX, startY;
        let startPositionFound = false;
        for (let j = 0; j < mapConfig.layout.length; j++) {
            const rowIndex = mapConfig.layout[j].findIndex(
                (cellAlias) => mapConfig.cell[cellAlias]?.type === 'start'
            );
            if (rowIndex !== -1) {
                startX = rowIndex;
                startY = j;
                startPositionFound = true;
                break;
            }
        }

        // スタート地点が見つからない場合はエラーを表示して終了
        if (!startPositionFound) {
            alert(
                'スタート地点がマップ設定に見つかりませんでした。プレイヤーはリセットされません。'
            );
            return;
        }

        // プレイヤーをスタート地点に移動（整数座標に丸める）
        player.position.set(Math.round(startX), 0, Math.round(startY));
        // プレイヤーの向きを初期化（下向き = 手前向き）
        player.rotation.y = 0;
        renderer.render(scene, camera);

        // ローディング表示
        const originalText = element.textContent;
        const originalHTML = element.innerHTML;

        // スピナーを追加
        element.innerHTML = '<span class="spinner"></span>回答待ち';

        try {
            // 経路を取得
            const moves = await pathFetcher();

            // ChatGPTからのレスポンスが完了したら「実行中...」に変更
            element.innerHTML = '実行中...';

            // 経路をコンソールに出力
            console.log('AIからの経路:', moves);

            // レスポンス表示領域の更新
            const responseEl = document.getElementById('ai-response');

            if (responseEl) {
                responseEl.innerHTML = '';
                responseEl.classList.remove('visible');

                // 矢印を一つずつ表示
                const arrows = moves[0].split('');
                const directionMap = {
                    u: '↑',
                    d: '↓',
                    l: '←',
                    r: '→',
                };

                arrows.forEach((arrow, index) => {
                    const span = document.createElement('span');
                    span.textContent = directionMap[arrow] || arrow;
                    span.style.animationDelay = `${index * 100}ms`;
                    responseEl.appendChild(span);
                });

                // 少し遅れて全体を表示
                setTimeout(() => {
                    responseEl.classList.add('visible');
                }, 50);
            }

            // 経路がない場合はエラーを表示して終了
            if (!moves || moves.length === 0) {
                alert('AIから有効な経路が返されませんでした。');
                return;
            }

            const movingDelay = 80; // 移動間の遅延を短縮
            const moveSequence = moves[0]; // "lru" のような文字列

            // 移動をキャンセル可能にするためのフラグ
            let shouldContinue = true;
            const movePromises = [];

            // ゲームオーバー監視用のインターバル
            const gameOverCheckInterval = setInterval(() => {
                if (gameContext.gameOver) {
                    shouldContinue = false;
                    clearInterval(gameOverCheckInterval);
                }
            }, 40);

            // 全ての移動を並列に開始しますが、前の移動の完了を待機
            let previousMovePromise = Promise.resolve();

            for (let i = 0; i < moveSequence.length; i++) {
                // 移動を中断すべきかチェック
                if (!shouldContinue || gameContext.gameOver) {
                    console.log('ゲームオーバーのため移動を中断します');
                    break;
                }

                const moveChar = moveSequence[i];
                const currentIndex = i;

                // 前の移動完了と遅延を待ってから次の移動を開始
                previousMovePromise = previousMovePromise.then(async () => {
                    // ゲームオーバーチェック
                    if (gameContext.gameOver) {
                        shouldContinue = false;
                        return;
                    }

                    // 初回以外は遅延を入れる
                    if (currentIndex > 0) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, movingDelay)
                        );
                    }

                    // 再度ゲームオーバーチェック
                    if (gameContext.gameOver) {
                        shouldContinue = false;
                        return;
                    }

                    // 移動を実行
                    return movePlayer({
                        context: gameContext,
                        direction: moveChar,
                    });
                });
            }

            // 最後の移動の完了を待つ
            await previousMovePromise;

            clearInterval(gameOverCheckInterval);

            // ↓ エラーが発生した場合の処理
        } catch (error) {
            console.error(
                'AI経路取得またはプレイヤー移動の実行中にエラーが発生しました:',
                error
            );
            // エラー時もHTMLを復元
            element.innerHTML = originalHTML;

            // ↓ 処理が全て完了した時の処理
        } finally {
            element.disabled = false; // 処理完了後またはエラー時にボタンを再度有効化

            // 初回実行後にボタンのラベルを「再実行」に変更
            if (!hasRunOnce) {
                element.innerHTML = '再実行';
                hasRunOnce = true;
            } else {
                // 2回目以降は「再実行」に戻す
                element.innerHTML = '再実行';
            }
        }
    });
}

/**
 * ゲームの統合セットアップを行う。
 * 各要素のレンダリング、ゲームの初期化、イベントハンドラの設定を行う。
 *
 * @param {object} params セットアップパラメータ
 * @param {HTMLElement} params.gameViewerEl ゲーム表示エリア
 * @param {HTMLElement} params.responseViewerEl AIレスポンス表示エリア
 * @param {HTMLElement} params.triggerEl トリガーボタン
 * @param {object} params.mapConfig マップ設定
 * @param {function} params.pathFetcher 経路取得関数
 */
export async function setupGame({
    gameViewerEl,
    responseViewerEl,
    triggerEl,
    mapConfig,
    pathFetcher,
}) {
    // AIレスポンス表示エリアをレンダリング
    renderGameAIResponseViewer(responseViewerEl);

    // トリガーボタンをレンダリング
    renderGameTrigger(triggerEl);

    // ゲームをレンダリング
    const gameContext = await renderGame({
        element: gameViewerEl,
        mapConfig,
    });

    // プレイヤー移動ボタンをセットアップ
    setupPlayerMoverButton({
        element: triggerEl,
        mapConfig,
        gameContext,
        pathFetcher,
    });

    return gameContext;
}
