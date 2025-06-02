/**
 * ★ 生徒はこのファイルのマップ設定のみを編集してください ★
 *
 * 現在のマップの設定オブジェクトです。
 * 生徒はこのオブジェクトのプロパティ値を変更することで、
 * マップのレイアウト、スタート/ゴール位置、罠の位置を変更できます。
 *
 * @type {object} mapConfig - このマップの主要な設定オブジェクト。
 * @property {number} width - マップの幅（タイル数）。例: 8 はマップの幅がタイル8つ分であることを意味します。
 *                            マップの横マス数。
 * @property {number} height - マップの高さ（タイル数）。例: 8 はマップの高さがタイル8つ分であることを意味します。
 *                             マップの縦マス数。
 * @property {{x: number, y: number}} start - プレイヤーの開始座標。
 *                                            'x' は水平位置 (0 から width-1 まで)、
 *                                            'y' は奥行きの位置 (0 から height-1 まで) です。
 *                                            スタート座標 { x:0, y:0 } のように指定。
 * @property {{x: number, y: number}} goal - ゴール/宝物の座標。
 *                                           'start' と同じ座標系を使用します。
 *                                           ゴール座標 { x:5, y:5 } のように指定。
 * @property {Array<{x: number, y: number}>} traps - 罠の座標の配列。
 *                                                  配列内の各オブジェクトは 'x' と 'y' プロパティを持つ必要があります。
 *                                                  罠の座標リスト（複数指定可）。
 */
const mapConfig = {
    width: 8,
    height: 8,
    start: { x: 1, y: 1 },
    goal: { x: 6, y: 6 },
    traps: [
        { x: 3, y: 2 },
        { x: 4, y: 4 },
        { x: 2, y: 5 },
        { x: 5, y: 1 },
    ]
};

// 他のファイルは触らずに、この mapConfig だけを自由に変更してください
window.mapConfig = mapConfig;
