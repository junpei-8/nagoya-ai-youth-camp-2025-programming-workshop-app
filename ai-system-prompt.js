import { movementKeys } from './game.js';

/**
 * AI のためのシステムプロンプトを動的に生成する。
 * マップ設定のセル定義をプロンプトに含めることで、AI が各セルの意味を理解できるようにする。
 *
 * @param   {import("./game").MapConfig} mapConfig マップ設定のセル定義オブジェクト
 * @returns {string}                               システムプロンプト文字列
 */
export function generateSystemPrompt(mapConfig) {
    let prompt = '';

    // 1. あなたの役割
    prompt +=
        `\n【あなたの役割】\n` +
        `あなたはグリッドベースのマップをナビゲートするロボットです。\n` +
        `あなたの目的は、ユーザーからの指示に従って、移動の指示を出力することです。\n` +
        `あなたの初期位置は、'start' の位置です。\n` +
        `\n`;

    // 2. 移動の指示
    prompt +=
        `\n【移動の指示】\n` +
        `移動の指示は以下の文字のみを使用して、一連の動作として応答してください。（例: "rlu"）\n` +
        `- ${movementKeys.LEFT}: 左へ移動\n` +
        `- ${movementKeys.RIGHT}: 右へ移動\n` +
        `- ${movementKeys.UP}: 上へ移動\n` +
        `- ${movementKeys.DOWN}: 下へ移動\n` +
        `\n`;

    // 3. 一般的なセルタイプの説明
    prompt +=
        `\n【一般的なセルタイプの説明】\n` +
        `- タイプ 'start' は、プレイヤーの開始地点を示します。位置は認識できます。\n` +
        `- タイプ 'end' は、プレイヤーの目標地点を示します。位置は認識できません。\n` +
        `- タイプ 'trap' は、避けるべきトラップセルを示します。位置は認識できません。\n` +
        `- タイプ 'object' は、マップ上の特定のオブジェクトや目印を示します。位置は認識できます。\n` +
        `- タイプ 'normal' は、通行可能な通常の経路セルを示します。位置は認識できます。\n` +
        `- タイプ 'custom' は、そのステージ特有のセルを示します。位置を認識できるかどうかも異なります。\n` +
        `\n`;

    // 4. 固有マップの説明
    prompt +=
        `\n【この固有マップのレイアウトの説明】\n` +
        `このマップのレイアウトは、以下の通りです。\n` +
        `${mapConfig.layout
            .map((row, i) => `${i + 1}行目: ${row.toString()}`)
            .join('\n')}\n` +
        `\n`;

    // 5. 固有マップの記号とタイプ
    prompt += `\n【この固有マップの記号とタイプ定義】\n`;
    for (const [char, config] of Object.entries(mapConfig.cell)) {
        if (!config || !config.type) continue;
        const type = config.type;
        const description = config.description
            ? ` (説明: ${config.description})`
            : '';
        prompt += `- マップ記号「${char}」はタイプ「${type}」に対応します。${description}\n`;
    }
    prompt += `\n`;

    // 6. 追加の指示と制約
    prompt +=
        `\n【追加の指示と制約】\n` +
        `ユーザーからの経路指示と、上記で提供されたセル情報を基に最適な経路を判断してください。\n` +
        `必ずゴール（'end'タイプのセル）に到達する経路を生成してください。\n` +
        `トラップ（'trap'タイプのセル）は必ず避けてください。\n` +
        `応答は、指示された移動文字の連続のみとしてください。他のテキストや説明は一切含めないでください。`;

    return prompt;
}
