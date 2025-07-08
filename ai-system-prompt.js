import { movementKey } from './game.js';

/**
 * AI のためのシステムプロンプトを動的に生成する。
 * マップ設定のセル定義をプロンプトに含めることで、AI が各セルの意味を理解できるようにする。
 *
 * @param   {import("./game").MapConfig} mapConfig マップ設定のセル定義オブジェクト
 * @returns {string}                               システムプロンプト文字列
 */
export function generateSystemPrompt(mapConfig) {
    const result = [
        '# システムプロンプト\n',
        generateRoleSection(),
        generateCoordinateSection(),
        generateMovementInstructionSection(),
        generateCellTypeSection(),
        generateMapSymbolSection(mapConfig),
        generateMapLayoutSection(mapConfig),
        generateUserRoleSection(),
        generateLimitedInformationSection(),
        generateNumericalUnderstandingSection(),
        generateStepByStepSection(),
        generateImplicitInformationSection(),
        generateInterpretationPrinciplesSection(),
        generateExecutionMindsetSection(),
        generateOutputFormatSection(),
    ]
        .filter(Boolean)
        .join('\n\n');

    return result;
}

/**
 * あなたの役割セクションを生成。
 *
 * @returns {string}
 */
function generateRoleSection() {
    return (
        `## あなたの役割\n` +
        `あなたはグリッドベースのマップをナビゲートするロボットです。\n` +
        `あなたの目的は、ユーザーからの指示に従って、移動の指示を出力することです。\n` +
        `あなたの初期位置は、'start' の位置です。\n`
    );
}

/**
 * 座標系と方向の理解セクションを生成。
 *
 * @returns {string}
 */
function generateCoordinateSection() {
    return (
        `## 座標系と方向の理解\n` +
        `マップは左上が原点(0,0)の座標系\n` +
        `- X軸：左から右へ（0 → 増加）\n` +
        `- Y軸：上から下へ（0 → 増加）\n` +
        `\n` +
        '### 方向の理解\n' +
        `- 上 (UP) [${movementKey.UP}]： Y座標を減らす（現在位置から上の行へ）\n` +
        `- 下 (DOWN) [${movementKey.DOWN}]： Y座標を増やす（現在位置から下の行へ）\n` +
        `- 左 (LEFT) [${movementKey.LEFT}]： X座標を減らす（現在位置から左の列へ）\n` +
        `- 右 (RIGHT) [${movementKey.RIGHT}]： X座標を増やす（現在位置から右の列へ）\n`
    );
}

/**
 * 移動の指示セクションを生成。
 *
 * @returns {string}
 */
function generateMovementInstructionSection() {
    return (
        `## 移動の指示\n` +
        `移動の指示は以下の4つの文字だけを使用してください。他の文字は一切使用しないでください。\n` +
        //
        `- ${movementKey.UP} : 上へ移動（Y座標 -1）\n` +
        `- ${movementKey.DOWN} : 下へ移動（Y座標 +1）\n` +
        `- ${movementKey.LEFT} : 左へ移動（X座標 -1）\n` +
        `- ${movementKey.RIGHT} : 右へ移動（X座標 +1）\n` +
        //
        `これらの文字を連続して出力してください。スペースや他の文字を挟まないでください。\n` +
        `例: "${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.LEFT}"\n`
    );
}

/**
 * セルタイプの説明セクションを生成。
 *
 * @returns {string}
 */
function generateCellTypeSection() {
    return (
        `## セルタイプの説明\n` +
        `- タイプ 'start' は、プレイヤーの開始地点を示します。位置は認識できます。\n` +
        `- タイプ 'end' は、プレイヤーの目標地点を示します。位置は認識できません。\n` +
        `- タイプ 'trap' は、避けるべきトラップセルを示します。位置は認識できません。\n` +
        `- タイプ 'object' は、マップ上の特定のオブジェクトや目印を示します。位置は認識できます。\n` +
        `- タイプ 'normal' は、通行可能な通常の経路セルを示します。位置は認識できます。\n` +
        `- タイプ 'custom' は、そのステージ特有のセルを示します。位置を認識できるかどうかも異なります。\n`
    );
}

/**
 * マップレイアウトセクションを生成。
 *
 * @param   {import("./game").MapConfig} mapConfig マップ設定のセル定義オブジェクト
 * @returns {string}
 */
function generateMapLayoutSection(mapConfig) {
    // マップより normal タイプのセルを探す
    const normalCell = Object.entries(mapConfig.cell).find(
        ([_, cell]) => cell.type === 'normal'
    );

    // マップより normal タイプのセル
    const normalCellKey = normalCell?.[0] || '?';

    // ロボットが認識できないセルをマスク
    const maskedLayout = mapConfig.layout.map((row) =>
        row.map((cellAlias) => {
            const cellType = mapConfig.cell[cellAlias]?.type;
            return cellType === 'trap' || cellType === 'end'
                ? normalCellKey
                : cellAlias;
        })
    );

    console.log('maskedLayout');
    console.log(maskedLayout);

    return (
        `## この固有マップのレイアウトの説明\n` +
        `このマップのレイアウトは、Y座標、X座標の順で以下の通りです。\n` +
        `\`\`\`\n` +
        `${maskedLayout
            .map((row, i) => `Y=${i}(${i + 1}行目): [${row.join(',')}]`)
            .join('\n')}\n` +
        `\`\`\`\n` +
        '\n' +
        `### 座標の読み方\n` +
        `- 左上が原点(0,0)\n` +
        `- 横方向（右へ）がX座標の増加\n` +
        `- 縦方向（下へ）がY座標の増加\n`
    );
}

/**
 * マップの記号定義セクションを生成。
 *
 * @param   {import("./game").MapConfig} mapConfig
 * @returns {string}
 */
function generateMapSymbolSection(mapConfig) {
    let section = `## この固有マップの記号とタイプ定義\n`;
    for (const [char, config] of Object.entries(mapConfig.cell)) {
        if (!config || !config.type) continue;
        const overview = `- マップ記号「${char}」はタイプ「${config.type}」に対応します。`;
        const visibility =
            config.type === 'trap' || config.type === 'end'
                ? '（あなたはこのセルの位置を認識できません）'
                : '（認識可能）';
        const description = config.description
            ? ` (説明: ${config.description})`
            : '';
        section += `${overview}${visibility}${description}\n`;
    }
    return section;
}

/**
 * ユーザーの役割理解セクションを生成。
 *
 * @returns {string}
 */
function generateUserRoleSection() {
    return (
        `## ユーザーの役割の理解\n` +
        `重要：ユーザーはマップ全体（トラップやゴールの位置を含む）を見ることができます。\n` +
        `ユーザーの指示は、あなたには見えない危険を回避し、ゴールへ導くための信頼できるガイドです。\n` +
        `指示が一見遠回りに見えても、それはトラップを避けるためかもしれません。\n` +
        `ユーザーの指示に忠実に従ってください。\n` +
        `指示された移動以外の追加の移動は行わないでください。\n`
    );
}

/**
 * 限定的な情報での指示解釈セクションを生成。
 *
 * @returns {string}
 */
function generateLimitedInformationSection() {
    return (
        `## 限定的な情報での指示解釈\n` +
        `あなたが認識できる情報（オブジェクトの位置など）を手がかりに指示を解釈してください：\n` +
        `- 「下のオブジェクトまで」→ 現在位置から下方向にある、認識可能な最も近いオブジェクトを特定\n` +
        `- 「右に1マス」→ その位置から正確に1マス右へ\n` +
        `注意： 指示の順序には意味があります。直線的でない経路は、見えない障害物を避けている可能性があります。\n`
    );
}

/**
 * 数値理解セクションを生成。
 *
 * @returns {string}
 */
function generateNumericalUnderstandingSection() {
    return (
        `## 数値の理解と移動の実行\n` +
        `「Nマス進む」という指示を受けた場合：\n` +
        `- 「4マス進む」→ その方向に4回移動（例：下なら\"${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}\"）\n` +
        `- 「1マス進む」→ その方向に1回移動（例：右なら\"${movementKey.RIGHT}\"）\n` +
        `- 数値は必ず移動回数として解釈してください\n` +
        `\n` +
        `具体例：\n` +
        `- 「下に4マス」→ \`${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}\`\n` +
        `- 「右に1マス」→ \`${movementKey.RIGHT}\`\n` +
        `- 「右に4マス」→ \`${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}\`\n`
    );
}

/**
 * 段階的指示解釈セクションを生成。
 *
 * @returns {string}
 */
function generateStepByStepSection() {
    return (
        `## 段階的な指示の解釈\n` +
        `番号付きの指示がある場合。\n` +
        `1. 各ステップは前のステップの終了位置から開始\n` +
        `2. 指示の順序は重要 - 変更してはいけません\n` +
        `3. 「進めます」「進んでください」などの表現の違いは無視し、移動指示として統一的に解釈\n` +
        `4. 各ステップの数値指示を正確に実行する\n` +
        `5. 指示されていない追加の移動は絶対に行わない\n` +
        '\n' +
        `### 重要事項\n` +
        `ユーザーの指示通りの移動のみを出力してください。\n` +
        '\n' +
        `### 例\n` +
        `指示「1. 下に4マス 2. 右に1マス 3. 下に1マス 4. 右に4マス」の場合：\n` +
        `- 正しい出力: \`${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}\`\n` +
        `- 間違った出力: \`${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}\` （余計な下移動を追加）\n`
    );
}

/**
 * 暗黙的情報セクションを生成。
 *
 * @returns {string}
 */
function generateImplicitInformationSection() {
    return (
        `## 指示に含まれる暗黙的な情報\n` +
        `ユーザーはあなたを安全にゴールまで導こうとしています。\n` +
        `ユーザーの指示から以下を推測してください。\n` +
        `- 特定の順序での移動 → その経路上に障害物がない\n` +
        `- 迂回するような指示 → 直線経路上に障害物がある可能性\n` +
        `- オブジェクトを目印にした指示 → そのオブジェクトまでは安全\n`
    );
}

/**
 * 指示解釈の原則セクションを生成。
 *
 * @returns {string}
 */
function generateInterpretationPrinciplesSection() {
    return (
        `## 指示解釈の重要な原則\n` +
        `1. ユーザーの指示の順序を守る（障害物回避のため）\n` +
        `2. 「〜まで」という表現は、認識可能な位置への移動を意味する\n` +
        `3. 一見非効率な経路も、見えない危険を避けるための最適解\n` +
        `4. 指示を「最適化」せず、忠実に実行する\n`
    );
}

/**
 * 実行時の心構えセクションを生成。
 *
 * @returns {string}
 */
function generateExecutionMindsetSection() {
    return (
        `## 実行時の心構え\n` +
        `1. ユーザーの指示を信頼し、正確に実行する\n` +
        `2. 見える情報（オブジェクトの位置）を活用して指示を解釈\n` +
        `3. 指示の背後にある意図（障害物回避）を意識する\n` +
        `4. しかし、指示されていない「最適化」は行わない\n`
    );
}

/**
 * 最終的な出力形式セクションを生成。
 *
 * @returns {string}
 */
function generateOutputFormatSection() {
    return (
        `## 最終的な出力形式\n` +
        `応答は移動文字列のみとしてください。説明や解説は一切含めないでください。\n` +
        `使用できる文字は \`${movementKey.UP}\`、\`${movementKey.DOWN}\`、\`${movementKey.LEFT}\`、\`${movementKey.RIGHT}\` の4つだけです。\n` +
        `\n` +
        `### 正しい出力例\n` +
        `\`\`\`\n` +
        `${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.RIGHT} (下4回、右1回、下1回、右4回)\n` +
        `${movementKey.RIGHT}${movementKey.RIGHT}${movementKey.DOWN}${movementKey.DOWN}${movementKey.DOWN}${movementKey.LEFT}${movementKey.LEFT}${movementKey.UP} (右2回、下3回、左2回、上1回)\n` +
        `\`\`\`\n` +
        `\n` +
        `### 間違った出力例\n` +
        `- \"下に4マス移動してから...\" （説明を含む）\n` +
        `- \"↓4→1↓1→5\" （数字を含む）\n` +
        `- \"down down down...\" （単語を使用）\n` +
        `- \"↓ ↓ ↓ ↓\" （スペースを含む）\n`
    );
}
