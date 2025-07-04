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
    const cameraDistance = mapMaxSize * 2.2;
    const topMargin = 2.5;
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

    // マップタイルを作成
    for (let j = 0; j < mapDisplayHeight; j++) {
        for (let i = 0; i < mapDisplayWidth; i++) {
            const cellAlias = layout[j][i];
            const cellDef = mapConfig.cell[cellAlias];
            // タイルを平面ジオメトリで作成（盤面の上に配置）
            const geometry = new threeJS.PlaneGeometry(0.98, 0.98);
            let colorValue = 0xcccccc; // 未定義タイル用のデフォルト色

            // セル定義がない場合はスキップ
            if (!cellDef) {
                continue;
            }

            // セルの色を設定
            if (cellDef.color) {
                const parsedColor = parseInt(
                    cellDef.color.replace('#', ''),
                    16
                );
                colorValue = isNaN(parsedColor) ? colorValue : parsedColor;
            }

            // セルのマテリアルを作成
            const tile = new threeJS.Mesh(
                geometry,
                new threeJS.MeshStandardMaterial({
                    color: colorValue,
                    side: threeJS.DoubleSide,
                })
            );

            // セルの位置を設定
            tile.rotation.x = -Math.PI / 2; // X軸を中心に-90度回転して水平に
            tile.position.set(i, 0.01, j); // 盤面の上に少し浮かせて配置

            // セルをシーンに追加
            scene.add(tile);
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
    };
}

/**
 * プレイヤーキャラクターを作成し、シーンに追加する。
 *
 * @param   {object}          params            プレイヤー作成パラメータ
 * @param   {ThreeJS}         params.threeJS    Three.js インスタンス
 * @param   {MapContext}      params.mapContext マップコンテキスト
 * @returns                                     プレイヤー
 */
function createPlayer({ threeJS, mapContext }) {
    // プレイヤーを作成
    const player = new threeJS.Mesh(
        // プレイヤーの形状
        new threeJS.BoxGeometry(0.8, 0.8, 0.8),
        // プレイヤーの色
        new threeJS.MeshStandardMaterial({
            color: 0x4444ff,
        })
    );

    // プレイヤーの位置を設定（盤面の上に配置、整数座標に丸める）
    player.position.set(
        Math.round(mapContext.position.start.x),
        0.4, // 盤面の上面(Y=0)からプレイヤーの半分の高さ(0.4)分上に配置
        Math.round(mapContext.position.start.y)
    );

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
 * ゲームの主要なセットアップ処理を行う。\
 * Three.js のロード、マップレンダリング、プレイヤー作成を順番に実行する。
 *
 * @param   {object}               params           セットアップパラメータ
 * @param   {HTMLElement}          params.element   レンダリング対象の要素
 * @param   {object}               params.mapConfig マップ設定オブジェクト
 * @returns                                         コンテキストオブジェクト
 * @throws  {Error}                                 Three.js のロードまたはゲームの初期化に失敗した場合エラーをスロー
 */
export async function setupGame({ element, mapConfig }) {
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
 * 移動コマンド文字の定義。
 */
export const movementKeys = {
    LEFT: 'l',
    RIGHT: 'r',
    UP: 'u',
    DOWN: 'd',
};

/**
 * プレイヤーを指定された方向に1ステップ移動させ、アニメーション表示する。
 *
 * @param {object}      params           移動パラメータ
 * @param {GameContext} params.context   ゲームコンテキストオブジェクト
 * @param {string}      params.direction 移動方向
 */
export function movePlayer({ context, direction }) {
    const {
        threeJS,
        scene,
        camera,
        renderer,
        player,
        mapDisplayWidth,
        mapDisplayHeight,
    } = context;

    const stepVec = { x: 0, z: 0 }; // 移動ベクトル
    switch (direction) {
        case movementKeys.RIGHT:
            stepVec.x = 1;
            break; // 右 (Right)

        case movementKeys.LEFT:
            stepVec.x = -1;
            break; // 左 (Left)

        case movementKeys.UP:
            stepVec.z = -1;
            break; // 上 (Up)

        case movementKeys.DOWN:
            stepVec.z = 1;
            break; // 下 (Down)

        default:
            return; // 未知の方向の場合は何もしない
    }

    // 現在位置を整数に丸めてから計算（浮動小数点誤差を防ぐ）
    const currentX = Math.round(player.position.x);
    const currentZ = Math.round(player.position.z);
    const startPos = player.position.clone();

    const targetX = currentX + stepVec.x;
    const targetZ = currentZ + stepVec.z;

    // 盤外への移動を防ぐ（デバッグ情報付き）
    console.log(
        'Current:',
        currentX,
        currentZ,
        'Target:',
        targetX,
        targetZ,
        'Map size:',
        mapDisplayWidth,
        'x',
        mapDisplayHeight
    );
    if (
        targetX < 0 ||
        targetX >= mapDisplayWidth ||
        targetZ < 0 ||
        targetZ >= mapDisplayHeight
    ) {
        console.log('盤外への移動をブロックしました');
        return; // 盤外への移動はキャンセル
    }

    // 最終位置も整数座標にする
    const endPos = new threeJS.Vector3(targetX, player.position.y, targetZ);

    // アニメーションの設定
    const duration = 240;
    let startTime = null;

    // アニメーションループ
    function animate(currentTime) {
        if (startTime === null) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1); // 進行度 (0から1)
        player.position.lerpVectors(startPos, endPos, t); // 線形補間で中間位置を計算
        renderer.render(scene, camera); // シーンをレンダリング
        if (t < 1) requestAnimationFrame(animate);
    }

    // アニメーション開始
    requestAnimationFrame(animate);
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
export function setupPlayerMoverButton({
    element,
    mapConfig,
    gameContext,
    pathFetcher,
}) {
    const { scene, camera, renderer, player } = gameContext;

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
        player.position.set(Math.round(startX), 0.4, Math.round(startY));
        renderer.render(scene, camera);

        try {
            // 経路を取得
            const moves = await pathFetcher();

            // 経路をコンソールに出力
            console.log('AIからの経路:', moves);

            // 経路がない場合はエラーを表示して終了
            if (!moves || moves.length === 0) {
                alert('AIから有効な経路が返されませんでした。');
                return;
            }

            const movingDelay = 240;
            const moveSequence = moves[0]; // "lru" のような文字列
            for (let i = 0; i < moveSequence.length; i++) {
                const moveChar = moveSequence[i];
                await new Promise((resolve) =>
                    setTimeout(resolve, i === 0 ? 0 : movingDelay)
                );
                movePlayer({
                    context: gameContext,
                    direction: moveChar,
                });
            }

            // ↓ エラーが発生した場合の処理
        } catch (error) {
            console.error(
                'AI経路取得またはプレイヤー移動の実行中にエラーが発生しました:',
                error
            );

            // ↓ 処理が全て完了した時の処理
        } finally {
            element.disabled = false; // 処理完了後またはエラー時にボタンを再度有効化
        }
    });
}
