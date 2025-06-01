/**
 * ★ 生徒はこのファイルのマップ設定のみを編集してください ★
 * width, height : マップの横・縦マス数
 * start : スタート座標 { x:0, y:0 } のように
 * goal : ゴール座標 { x:5, y:5 } のように
 * traps : 罠の座標リスト（複数指定可）
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
