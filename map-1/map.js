/**
 * ★ 生徒はこのファイルのマップ設定のみを編集してください ★
 *
 * Configuration object for the current map.
 * Students should modify the values of the properties in this object
 * to change the map layout, start/goal positions, and traps.
 *
 * @type {object} mapConfig - The main configuration object for this map.
 * @property {number} width - The width of the map in tiles (e.g., 6 means 6 tiles wide).
 *                            マップの横マス数。
 * @property {number} height - The height of the map in tiles (e.g., 6 means 6 tiles high).
 *                             マップの縦マス数。
 * @property {{x: number, y: number}} start - The starting coordinates of the player.
 *                                            'x' is the horizontal position (0 to width-1),
 *                                            'y' is the depth position (0 to height-1).
 *                                            スタート座標 { x:0, y:0 } のように指定。
 * @property {{x: number, y: number}} goal - The coordinates of the goal/treasure.
 *                                           Uses the same coordinate system as 'start'.
 *                                           ゴール座標 { x:5, y:5 } のように指定。
 * @property {Array<{x: number, y: number}>} traps - An array of trap coordinates.
 *                                                  Each object in the array should have 'x' and 'y' properties.
 *                                                  罠の座標リスト（複数指定可）。
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
// (Do not touch other files; only modify this mapConfig freely)
window.mapConfig = mapConfig;
