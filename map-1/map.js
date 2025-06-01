/**
 * ★ 生徒はこのファイルのマップ設定のみを編集してください ★
 * width, height : マップの横・縦マス数
 * start : スタート座標 { x:0, y:0 } のように
 * goal : ゴール座標 { x:5, y:5 } のように
 * traps : 罠の座標リスト（複数指定可）
 */
const mapConfig = {
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    traps: [
        { x: 2, y: 1 },
        { x: 3, y: 3 },
    ]
};

// 他のファイルは触らずに、この mapConfig だけを自由に変更してください
window.mapConfig = mapConfig;
