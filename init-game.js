// init-game.js
// このファイルは、ゲームの初期化処理、APIキーの確認、および
// スタートボタンのイベントリスナー設定を行います。

// DOMが完全に読み込まれた後に実行することを保証する場合 (ただし、現在のscriptタグの配置順でも動作する想定)
// document.addEventListener('DOMContentLoaded', () => {

    if (window.mapConfig) {
        // APIキーの確認 (secret.js が読み込まれ、有効なキーが設定されているか)
        // window.OPENAI_API_KEY は、学生が secret.js を作成・設定し、HTMLで読み込むことで定義される想定です。
        if (typeof window.OPENAI_API_KEY !== 'undefined' && window.OPENAI_API_KEY !== "YOUR_DUMMY_API_KEY_HERE") {

            // グローバルスコープから必要な関数や変数を取得
            // これらは core.js や map.js などで定義されている必要があります。
            const { initScene, createMapObjects, startGame, renderer, scene, camera } = window;

            if (typeof initScene !== 'function' || typeof createMapObjects !== 'function' || typeof startGame !== 'function') {
                console.error("ゲーム初期化に必要な関数 (initScene, createMapObjects, startGame) がグローバルスコープに見つかりません。core.js が正しく読み込まれているか確認してください。");
                alert("ゲームの初期化に失敗しました。開発者コンソールを確認してください。");
                // return; // Ensure we don't proceed if core functions are missing
                // If using top-level script, 'return' is not in a function, so this would be an error.
                // Consider wrapping in an IIFE or using a flag to prevent further execution if this is critical.
            }

            // Proceed only if core functions are available
            if (typeof initScene === 'function' && typeof createMapObjects === 'function' && typeof startGame === 'function') {
                initScene(window.mapConfig);
                createMapObjects(window.mapConfig);

                // renderer, scene, camera は initScene によってグローバルスコープに設定される想定
                // Re-fetch from window scope after initScene in case they are reassigned.
                const currentRenderer = window.renderer;
                const currentScene = window.scene;
                const currentCamera = window.camera;

                if (currentRenderer && currentScene && currentCamera) {
                    currentRenderer.render(currentScene, currentCamera); // 初期レンダリング
                } else {
                    console.error("レンダラー、シーン、またはカメラが初期レンダリング呼び出し前に初期化されていません。initSceneが正しく実行されたか確認してください。");
                }

                const startButton = document.getElementById('startButton');
                if (startButton) {
                    startButton.addEventListener('click', () => {
                        startGame(window.mapConfig); // startGame は core.js で定義された async 関数
                    });
                } else {
                    console.error("スタートボタン (id='startButton') がHTML内に見つかりません。");
                }
            }

        } else {
            console.error("OpenAI APIキーが正しく設定されていません。指示に従って secret.js を設定してください。");
            alert("OpenAI APIキーが正しく設定されていません。\n\n手順:\n1. ルートの secret.example.js を secret.js にコピーします。\n2. secret.js 内のダミーキーを実際のキーに置き換えます。\n3. 各マップのHTMLファイル内の <script src=\"../secret.js\"></script> タグのコメントを解除します。\n\n上記を確認してください。");

            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.disabled = true;
                startButton.innerText = "APIキー未設定";
            }
        }
    } else {
        console.error("mapConfig が定義されていません。map.js が正しく読み込まれ、window.mapConfig を定義しているか確認してください。");
        // map.js が先に読み込まれるため、このアラートは map.js が存在しないか壊れている場合に表示される
        alert("マップ設定 (mapConfig) が見つかりません。map.js を確認してください。");

        // スタートボタンを無効化するなどのフォールバック処理
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = true;
            startButton.innerText = "マップ設定エラー";
        }
    }

// }); // DOMContentLoaded の閉じタグ (もし使用する場合)
