/**
 * 現在のマップの設定オブジェクトです。
 *
 * このオブジェクトのプロパティ値を変更することで、\
 * マップのレイアウト、スタート/エンド位置、罠の位置を変更できます。
 *
 * @type {import("../game").MapConfig}
 */
export const mapConfig = {
    layout: [
        ['s', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 't', 'n', 'n', 'n'],
        ['n', 'n', 'o', 'n', 'n', 'n'],
        ['n', 'n', 'n', 't', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'e'],
    ],
    cell: {
        s: {
            type: 'start',
            image: 'images/start_tile.png',
            color: '#4444FF',
        },
        e: {
            type: 'end',
            image: 'images/end_tile.png',
            color: '#FFD700',
        },
        t: {
            type: 'trap',
            image: 'images/trap_tile.png',
            color: '#FF0000',
        },
        o: {
            type: 'object',
            image: 'images/object1_tile.png',
            color: '#00FF00',
        },
        n: {
            type: 'normal',
            image: 'images/normal_tile.png',
            color: '#888888',
        },
    },
};
