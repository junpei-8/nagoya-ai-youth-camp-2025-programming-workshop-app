/**
 * ★ 生徒はこのファイルのマップ設定のみを編集してください ★
 *
 * 現在のマップの設定オブジェクトです。
 * 生徒はこのオブジェクトのプロパティ値を変更することで、
 * マップのレイアウト、スタート/ゴール位置、罠の位置を変更できます。
 *
 * @type {MapConfig}
 */
const mapConfig = {
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    traps: [
        { x: 2, y: 1 },
        { x: 3, y: 3 },
    ],
};

// 他のファイルは触らずに、この mapConfig だけを自由に変更してください
window.mapConfig = mapConfig;
