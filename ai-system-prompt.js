// ai-system-prompt.js

/**
 * AIのためのシステムプロンプトを動的に生成します。
 * マップ設定のセル定義をプロンプトに含めることで、AIが各セルの意味を理解できるようにします。
 * @param {object} cellsConfig - マップ設定のセル定義オブジェクト (例: mapConfig.cells)。
 *                                各キーがセル文字、値が設定オブジェクト（typeプロパティを含む）。
 * @returns {string} 生成されたシステムプロンプト文字列。
 */
export function generateSystemPrompt(cellsConfig) {
    // プロンプトの各部分を配列として構築
    let promptLines = [];

    // 1. 基本的な指示と役割
    promptLines.push("あなたはグリッドベースのマップをナビゲートするロボットです。");
    promptLines.push("あなたの目的は、ユーザーからの指示に従って 's' (スタート) から 'g' (ゴール) まで移動することです。");
    promptLines.push("移動の指示は以下の文字のみを使用して、一連の動作として応答してください（例: \"rrbllt\"）：");
    promptLines.push("- l: 左へ移動");
    promptLines.push("- r: 右へ移動");
    promptLines.push("- t: 上へ移動 (top)");
    promptLines.push("- b: 下へ移動 (bottom)");
    promptLines.push(""); // 空行

    // 2. 一般的なセルタイプの説明 (静的ブロック)
    promptLines.push("一般的なセルタイプの説明：");
    promptLines.push("・タイプ 'start' は、プレイヤーの開始地点を示します。マップ記号は通常「s」です。");
    promptLines.push("・タイプ 'goal' は、プレイヤーの目標地点を示します。マップ記号は通常「g」です。");
    promptLines.push("・タイプ 'trap' は、避けるべきトラップセルを示します。マップ記号は通常「t」です。");
    promptLines.push("・タイプ 'object' は、マップ上の特定のオブジェクトや目印を示します。マップ記号は通常「o」ですが、具体的な意味はマップごとに変わることがあります。");
    promptLines.push("・タイプ 'normal' は、通行可能な通常の経路セルを示します。特別な記号がない場合や、通路として定義されているセルがこれに該当します。");
    promptLines.push(""); // 空行

    // 3. マップ固有の記号とタイプ (動的ブロック)
    promptLines.push("このマップ固有の記号とタイプ定義：");
    if (cellsConfig && typeof cellsConfig === 'object' && Object.keys(cellsConfig).length > 0) {
        for (const [char, config] of Object.entries(cellsConfig)) {
            if (config && config.type) {
                let descriptionString = "マップ記号「" + char + "」はタイプ「" + config.type + "」に対応します。";
                if (config.description) {
                    descriptionString += " (説明: " + config.description + ")";
                }
                promptLines.push(descriptionString);
            }
        }
    } else {
        promptLines.push("注意: このマップ固有のセル設定情報が提供されませんでした。上記の一般的な説明を参考にしてください。");
    }
    promptLines.push(""); // 空行

    // 4. 追加の指示と制約
    promptLines.push("あなたはマップ上で 's' (スタート地点) の位置を認識できますが、'g' (ゴール) や 't' (トラップ) の位置を直接知ることはできません。");
    promptLines.push("ユーザーからの経路指示と、上記で提供されたセル情報を基に最適な経路を判断してください。");
    promptLines.push("応答は、指示された移動文字の連続のみとしてください。他のテキストや説明は一切含めないでください。");

    // 配列を改行文字で結合して最終的なプロンプト文字列を生成
    return promptLines.join('\n');
}
