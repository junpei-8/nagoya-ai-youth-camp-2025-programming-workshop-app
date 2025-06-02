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
    layout: [
      ["s", "n", "n", "n", "n", "n"],
      ["n", "n", "t", "n", "n", "n"],
      ["n", "n", "o1", "n", "n", "n"],
      ["n", "n", "n", "t", "n", "n"],
      ["n", "n", "n", "n", "n", "n"],
      ["n", "n", "n", "n", "n", "g"]
    ],
    cells: {
      's': { type: 'start', image: 'images/start_tile.png', color: '#4444FF' },
      'g': { type: 'goal', image: 'images/goal_tile.png', color: '#FFD700' },
      't': { type: 'trap', image: 'images/trap_tile.png', color: '#FF0000' },
      'o1': { type: 'object', image: 'images/object1_tile.png', color: '#00FF00' },
      'n': { type: 'normal', image: 'images/normal_tile.png', color: '#888888' }
    }
};

// 他のファイルは触らずに、この mapConfig だけを自由に変更してください
window.mapConfig = mapConfig;
