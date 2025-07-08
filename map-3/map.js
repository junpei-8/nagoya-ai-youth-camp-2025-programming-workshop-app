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
        ['s', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 't', 'n', 'o', 'n', 't', 'n', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 't', 'n'],
        ['n', 't', 'n', 'n', 'n', 't', 'n', 'n', 'n', 'n'],
        ['n', 'n', 'n', 'o', 'n', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 't', 'n', 'n', 'n', 't', 'n', 'o', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n'],
        ['n', 't', 'n', 'n', 't', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'n', 'n', 't', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'e'],
    ],
    cell: {
        s: {
            type: 'start',
            color: '#6B7ADB',
        },
        e: {
            type: 'end',
            color: '#F59E0B',
        },
        t: {
            type: 'trap',
            color: '#DC2626',
        },
        o: {
            type: 'object',
            color: '#92400E',
        },
        n: {
            type: 'normal',
            color: '#D4A574',
        },
    },
};
