// game.js

// Three.js は動的にインポートします
let THREE; // グローバルTHREEインスタンス（loadThreeJSで設定）

// グローバルに近いスコープでシーン関連の変数を保持 (必要に応じてリファクタリング検討)
// TODO: これらの変数をクラスやオブジェクトにまとめて管理することを検討
let scene, camera, renderer, playerMesh;


/**
 * Three.jsライブラリを動的にインポートします。
 * 成功した場合、THREEインスタンスを返します。
 * @returns {Promise<object>} Three.jsインスタンス。
 * @throws {Error} Three.jsのロードに失敗した場合。
 */
async function loadThreeJS() {
    if (!THREE) {
        try {
            const THREE_INSTANCE = await import("https://esm.sh/three@0.128.0");
            THREE = THREE_INSTANCE;
            console.log("Three.js の読み込みに成功しました。"); // Three.js loaded successfully.
        } catch (error) {
            console.error("Three.js の動的インポートに失敗しました:", error);
            alert("Three.jsの読み込みに失敗しました。ゲームを開始できません。");
            throw error;
        }
    }
    return THREE;
}

/**
 * マップをレンダリングし、基本的なシーンを設定します。(内部ヘルパー関数)
 * @param {object} params - レンダリングパラメータ。
 * @param {HTMLElement} params.containerElement - Three.jsレンダラーのDOMコンテナ。
 * @param {object} params.mapConfig - マップ設定オブジェクト。
 * @param {object} params.THREE_INSTANCE - Three.jsインスタンス。
 * @returns {object} シーン、カメラ、レンダラーを含むオブジェクト。
 */
function _renderMapLogic({ containerElement, mapConfig, THREE_INSTANCE }) {
    // 既存のレンダラーがあればクリーンアップ
    if (renderer) {
        if (renderer.domElement.parentNode === containerElement) {
            containerElement.removeChild(renderer.domElement);
        }
        renderer.dispose(); // WebGLコンテキストを解放
        renderer = null; // 参照をクリア
    }

    scene = new THREE_INSTANCE.Scene();
    const aspectRatio = containerElement.offsetWidth / containerElement.offsetHeight;
    camera = new THREE_INSTANCE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);

    const layout = mapConfig.layout;
    const mapDisplayWidth = layout[0].length;
    const mapDisplayHeight = layout.length;

    camera.position.set(mapDisplayWidth / 2, mapDisplayWidth * 1.5, mapDisplayHeight / 2);
    camera.lookAt(new THREE_INSTANCE.Vector3(mapDisplayWidth / 2, 0, mapDisplayHeight / 2));

    renderer = new THREE_INSTANCE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElement.offsetWidth, containerElement.offsetHeight);
    containerElement.appendChild(renderer.domElement);

    const ambientLight = new THREE_INSTANCE.AmbientLight(0xffffff, 0.6); // 環境光
    scene.add(ambientLight);
    const directionalLight = new THREE_INSTANCE.DirectionalLight(0xffffff, 0.8); // 平行光源
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // マップタイルを作成
    for (let j = 0; j < mapDisplayHeight; j++) {
        for (let i = 0; i < mapDisplayWidth; i++) {
            const cellAlias = layout[j][i];
            const cellDef = mapConfig.cells[cellAlias];
            const geometry = new THREE_INSTANCE.PlaneGeometry(1, 1); // 1x1 サイズの平面ジオメトリ
            let colorValue = 0xcccccc; // 未定義タイル用のデフォルト色

            if (!cellDef) {
                console.warn(`セル '${cellAlias}' の定義が mapConfig.cells に見つかりません。デフォルト色を使用します。`);
                continue; // 次のセルへ
            }

            if (cellDef.color) {
                const parsedColor = parseInt(cellDef.color.replace("#", ""), 16);
                colorValue = isNaN(parsedColor) ? colorValue : parsedColor;
            }

            const material = new THREE_INSTANCE.MeshStandardMaterial({ color: colorValue, side: THREE_INSTANCE.DoubleSide });
            const tile = new THREE_INSTANCE.Mesh(geometry, material);
            tile.rotation.x = -Math.PI / 2; // X軸を中心に-90度回転して床にする
            tile.position.set(i, 0, j); // XZ平面に配置
            scene.add(tile);
        }
    }

    renderer.render(scene, camera); // 初期レンダリング
    console.log("マップのレンダリングが完了しました。"); // Map rendered.

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', () => {
        if (camera && renderer && containerElement) {
            camera.aspect = containerElement.offsetWidth / containerElement.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerElement.offsetWidth, containerElement.offsetHeight);
            renderer.render(scene, camera); // リサイズ後にもレンダリング
        }
    });

    return { scene, camera, renderer };
}

/**
 * プレイヤーキャラクターを作成し、シーンに追加します。(内部ヘルパー関数)
 * @param {object} params - プレイヤー作成パラメータ。
 * @param {THREE.Scene} params.scene - Three.js シーンオブジェクト。
 * @param {object} params.mapConfig - マップ設定オブジェクト。
 * @param {object} params.THREE_INSTANCE - Three.jsインスタンス。
 * @returns {THREE.Mesh|null} 作成されたプレイヤーメッシュ。問題発生時はnull。
 */
function _createPlayerLogic({ scene: currentScene, mapConfig, THREE_INSTANCE }) {
    if (!currentScene) {
        console.error("シーンが提供されていません。プレイヤーを作成できません。");
        return null;
    }

    const layout = mapConfig.layout;
    let startX, startY;

    // スタート地点を検索 (リファクタリング)
    let startPositionFound = false;
    for (let j = 0; j < layout.length; j++) {
        const rowIndex = layout[j].findIndex(cellAlias => mapConfig.cells[cellAlias]?.type === 'start');
        if (rowIndex !== -1) {
            startX = rowIndex;
            startY = j;
            startPositionFound = true;
            break;
        }
    }

    if (!startPositionFound) {
        console.error("マップに開始地点 's' が見つかりません。プレイヤーを (0,0) に配置します。");
        startX = 0; // フォールバック位置
        startY = 0; // フォールバック位置
    }

    const playerGeometry = new THREE_INSTANCE.BoxGeometry(0.8, 0.8, 0.8); // プレイヤーの形状
    const playerMaterial = new THREE_INSTANCE.MeshStandardMaterial({ color: 0x4444ff }); // プレイヤーの色
    playerMesh = new THREE_INSTANCE.Mesh(playerGeometry, playerMaterial);
    playerMesh.position.set(startX, 0.5, startY); // 床より少し上に配置
    currentScene.add(playerMesh);

    // プレイヤー表示のための初期レンダリング
    if (renderer && camera) { // グローバルなrendererとcameraを使用
        renderer.render(currentScene, camera);
    }

    return playerMesh;
}

/**
 * ゲームの主要なセットアップ処理を行います。
 * Three.jsのロード、マップレンダリング、プレイヤー作成を順番に実行します。
 * @param {object} params - セットアップパラメータ。
 * @param {HTMLElement} params.containerElement - Three.jsレンダラーのDOMコンテナ。
 * @param {object} params.mapConfig - マップ設定オブジェクト。
 * @returns {Promise<object>} ゲームコンテキストオブジェクト ({ scene, camera, renderer, playerMesh, THREE: THREE_INSTANCE })。
 * @throws {Error} Three.jsのロードまたはゲームの初期化に失敗した場合。
 */
export async function setupGame({ containerElement, mapConfig }) {
    const THREE_INSTANCE = await loadThreeJS(); // Three.jsをロード (失敗時はエラーがスローされる)

    // マップをレンダリングし、シーン、カメラ、レンダラーを取得
    const { scene: localScene, camera: localCamera, renderer: localRenderer } = _renderMapLogic({ containerElement, mapConfig, THREE_INSTANCE });

    // プレイヤーを作成
    const localPlayerMesh = _createPlayerLogic({ scene: localScene, mapConfig, THREE_INSTANCE });

    if (!localPlayerMesh) {
        console.error("プレイヤーメッシュの作成に失敗しました。");
        throw new Error("プレイヤーメッシュの作成に失敗しました。"); // エラーをスローして初期化失敗を通知
    }

    // ゲームコンテキストを返す
    return { scene: localScene, camera: localCamera, renderer: localRenderer, playerMesh: localPlayerMesh, THREE: THREE_INSTANCE };
}


/**
 * プレイヤーを指定された方向に1ステップ移動させ、アニメーション表示します。
 * @param {object} params - 移動パラメータ。
 * @param {object} params.gameContext - ゲームコンテキストオブジェクト ({ scene, camera, renderer, playerMesh, THREE })。
 * @param {'↑'|'↓'|'←'|'→'} params.direction - 移動方向。
 */
export function movePlayer({ gameContext, direction }) {
    if (!gameContext) {
        console.error("gameContextが提供されていません。movePlayerは実行できません。");
        return;
    }
    const { playerMesh: currentPMesh, scene: currentScene, camera: currentCamera, renderer: currentRenderer, THREE: THREE_INSTANCE } = gameContext;

    if (!currentPMesh) {
        console.error("プレイヤーメッシュ (currentPMesh) がgameContextに提供されていません。");
        return;
    }
    if (!currentScene) {
        console.error("シーン (currentScene) がgameContextに提供されていません。");
        return;
    }
    if (!currentCamera) {
        console.error("カメラ (currentCamera) がgameContextに提供されていません。");
        return;
    }
    if (!currentRenderer) {
        console.error("レンダラー (currentRenderer) がgameContextに提供されていません。");
        return;
    }
    if (!THREE_INSTANCE) {
        console.error("Three.jsインスタンス (THREE_INSTANCE) がgameContextに提供されていません。");
        return;
    }

    let stepVec = { x: 0, z: 0 }; // 移動ベクトル
    switch (direction) {
        case '→': stepVec.x = 1; break;
        case '←': stepVec.x = -1; break;
        case '↑': stepVec.z = -1; break;
        case '↓': stepVec.z = 1; break;
        default: console.warn(`未定義の移動方向: ${direction}`); return; // 未知の方向の場合は何もしない
    }

    const startPos = currentPMesh.position.clone(); // 現在位置を保存
    const endPos = currentPMesh.position.clone().add(new THREE_INSTANCE.Vector3(stepVec.x, 0, stepVec.z)); // 目標位置を計算
    const duration = 200; // アニメーション時間 (ミリ秒)
    let startTime = null; // アニメーション開始時間

    // アニメーションループ
    function animate(currentTime) {
        if (startTime === null) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1); // 進行度 (0から1)
        currentPMesh.position.lerpVectors(startPos, endPos, t); // 線形補間で中間位置を計算
        currentRenderer.render(currentScene, currentCamera); // シーンをレンダリング
        if (t < 1) {
            requestAnimationFrame(animate); // アニメーション継続
        }
    }
    requestAnimationFrame(animate); // アニメーション開始
}


/**
 * プレイヤー移動処理を開始するボタンのセットアップとイベントリスナーの追加。
 * @param {object} params - 設定パラメータ。
 * @param {HTMLButtonElement} params.buttonElement - 処理を開始するボタン要素。
 * @param {object} params.mapConfig - マップ設定オブジェクト。
 * @param {string} params.systemPrompt - AI用のシステムプロンプト。
 * @param {string} params.routePrompt - AI用の経路指示プロンプト。
 * @param {object} params.gameContext - ゲームコンテキストオブジェクト ({ scene, camera, renderer, playerMesh, THREE })。
 * @param {function} params.fetchPathFunction - AIから経路を取得する関数。
 * @param {string} params.apiKey - OpenAI APIキー。
 */
export function setupPlayerMoverButton({
    buttonElement,
    mapConfig,
    systemPrompt,
    routePrompt,
    gameContext,
    fetchPathFunction,
    apiKey // apiKeyをパラメータとして受け取る
}) {
    if (!buttonElement) {
        console.error("プレイヤー移動ボタン要素が見つかりません。");
        return;
    }

    if (!gameContext) {
        console.error("gameContextが提供されていません。ボタンのセットアップを中止します。");
        buttonElement.disabled = true;
        return;
    }
    const { scene, camera, renderer, playerMesh: currentPMesh, THREE: THREE_INSTANCE } = gameContext;

    if (!THREE_INSTANCE) {
        console.error("Three.jsインスタンス (THREE_INSTANCE) がgameContextに提供されていません。ボタンのセットアップを中止します。");
        buttonElement.disabled = true; // ボタンを無効化
        alert("Three.jsの読み込みエラーのため、処理を開始できません。");
        return;
    }
    if (!currentPMesh) {
        console.error("プレイヤーメッシュ (currentPMesh) がgameContextに提供されていません。ボタンのセットアップを中止します。");
        buttonElement.disabled = true; // ボタンを無効化
        return;
    }

    buttonElement.addEventListener('click', async () => {
        console.log("AIによる経路指示に基づくプレイヤー移動を開始します...");
        buttonElement.disabled = true; // 処理中にボタンを無効化

        if (!mapConfig || !mapConfig.layout || !mapConfig.cells) {
            console.warn("mapConfig.layout または mapConfig.cells が未定義です。プレイヤーをリセットできません。");
            // この場合でもAIによる経路探索は試みるかもしれないので、ここでは早期リターンしない
        } else {
            // スタート位置にプレイヤーをリセット (オプション)
            let startX, startY;
            let startPositionFound = false;
            for (let j = 0; j < mapConfig.layout.length; j++) {
                const rowIndex = mapConfig.layout[j].findIndex(cellAlias => mapConfig.cells[cellAlias]?.type === 'start');
                if (rowIndex !== -1) {
                    startX = rowIndex;
                    startY = j;
                    startPositionFound = true;
                    break;
                }
            }

            if (startPositionFound) {
                currentPMesh.position.set(startX, 0.5, startY);
                renderer.render(scene, camera); // 位置変更を反映
            } else {
                console.warn("スタート地点がマップ設定に見つかりませんでした。プレイヤーはリセットされません。");
            }
        }

        try {
            const moves = await fetchPathFunction({
                systemPrompt,
                routePrompt,
                mapConfig,
                apiKey
            });

            if (!moves || moves.length === 0) {
                console.warn("AIから有効な経路が返されませんでした。");
                // AIからの経路がない場合のアラートはfetchPathFunction内で処理される想定
                buttonElement.disabled = false; // ボタンを再度有効化
                return;
            }

            console.log("AIからの経路:", moves);
            for (let i = 0; i < moves.length; i++) {
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 500));
                movePlayer({
                    gameContext,
                    direction: moves[i]
                });
            }
        } catch (error) {
            console.error("AI経路取得または実行中にエラーが発生しました:", error);
            // エラー発生時のアラートはfetchPathFunction内で処理される想定
        } finally {
            buttonElement.disabled = false; // 処理完了後またはエラー時にボタンを再度有効化
        }
    });
}
