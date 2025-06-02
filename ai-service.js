// ai-service.js

// ##################################################################################
// ## ★★★ 学生への指示 ★★★                                                        ##
// ## 以下の `STUDENT_API_KEY` の引用符の間に、自分のOpenAI APIキーを貼り付けてください。##
// ## 例: const STUDENT_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";             ##
// ##################################################################################
const STUDENT_API_KEY = "ここにあなたのOpenAI APIキーを貼り付けてください";

/**
 * @file ai-service.js
 * @description このファイルは、AI（例：ChatGPT）とのやり取りを処理し、
 *              マップ設定に基づいて経路探索を行います（現在はシミュレーション）。
 *              APIキーはこのファイル内で直接設定されます。
 */

/**
 * AIに経路探索をリクエストし、結果を取得します（シミュレーション）。
 * APIキーはこのファイルの上部で定義された `STUDENT_API_KEY` を使用します。
 *
 * @param {MapConfig} mapConfig - マップの設定オブジェクト。
 *                                  これには、マップの寸法（width, height）、
 *                                  スタート地点（start）、ゴール地点（goal）、
 *                                  罠の座標（traps）が含まれます。
 * @returns {Promise<Array<'→'|'←'|'↑'|'↓'> | null>} 経路を示す方向の配列、または経路が見つからない場合はnull。
 *                                                     現在はハードコードされた経路または単純なロジックを返します。
 */
async function fetchPathFromAI(mapConfig) {
    console.log("AIサービスに経路探索をリクエスト中:", mapConfig);
    console.log("使用APIキー (先頭5文字):", STUDENT_API_KEY ? STUDENT_API_KEY.substring(0, 5) + "..." : "APIキーが設定されていません");

    // ChatGPTへのプロンプトの概念的な構築
    // const prompt = `
    // あなたは宝探しゲームのAIです。以下のマップ設定に基づいて、
    // スタートからゴールまでの最短経路を、罠を避けて見つけてください。
    // マップ幅: ${mapConfig.width}
    // マップ高さ: ${mapConfig.height}
    // スタート: (${mapConfig.start.x}, ${mapConfig.start.y})
    // ゴール: (${mapConfig.goal.x}, ${mapConfig.goal.y})
    // 罠: ${JSON.stringify(mapConfig.traps)}
    // 出力は、['→','↓','←','↑'] のような、方向を示す文字列の配列だけにしてください。
    // `;
    // console.log("生成されたプロンプト (概念):", prompt);

    // API呼び出しのシミュレーション
    return new Promise(resolve => {
        setTimeout(() => {
            // シミュレーション: 単純な右、下への移動を試みるか、
            // または特定のマップ設定に対してハードコードされた経路を返す。
            // ここでは、デモンストレーションのために非常に基本的な経路を返します。
            // 実際のChatGPT API連携では、ここでfetch APIを使用してリクエストを送信します。

            let path = null;
            if (mapConfig.goal.x > mapConfig.start.x) {
                path = ['→'];
            } else if (mapConfig.goal.x < mapConfig.start.x) {
                path = ['←'];
            } else if (mapConfig.goal.y > mapConfig.start.y) {
                path = ['↓'];
            } else if (mapConfig.goal.y < mapConfig.start.y) {
                path = ['↑'];
            }

            // 簡単なデモ用のパス (ゴールが右下にあると仮定)
            if (mapConfig.start.x === 0 && mapConfig.start.y === 0 && mapConfig.goal.x === 5 && mapConfig.goal.y === 5) {
                 path = ['→', '→', '→', '→', '→', '↓', '↓', '↓', '↓', '↓'];
            } else if (mapConfig.width === 8 && mapConfig.height === 8 && mapConfig.start.x === 1 && mapConfig.start.y === 1 && mapConfig.goal.x === 6 && mapConfig.goal.y === 6) {
                // map-2 のデフォルト設定に近い場合の仮パス
                path = ['↓', '↓', '↓', '↓', '↓', '→', '→', '→', '→', '→'];
            }


            if (path) {
                console.log("AIからの経路受信 (シミュレーション):", path);
                resolve(path);
            } else {
                console.warn("AIからの経路受信失敗 (シミュレーション): 経路が見つかりませんでした。");
                resolve(null);
            }
        }, 1000); // 1秒の遅延をシミュレート
    });
}

// グローバルスコープに公開（またはES6モジュールとしてエクスポート）
window.fetchPathFromAI = fetchPathFromAI;

/**
 * MapConfig 型定義 (core.js と重複するが、参照のためここに記載)
 * @typedef {object} MapConfig
 * @property {number} width - マップの幅（タイル数）。
 * @property {number} height - マップの高さ（タイル数）。
 * @property {{x: number, y: number}} start - スタート座標。
 * @property {{x: number, y: number}} goal - ゴール座標。
 * @property {Array<{x: number, y: number}>} traps - 罠の座標リスト。
 */
