/**
 * 現在のマップの設定オブジェクトです。
 *
 * このオブジェクトのプロパティ値を変更することで、\
 * マップのレイアウト、スタート/エンド位置、罠の位置を変更できます。
 *
 * @type {import("../game").MapConfig}
 */
export const mapConfig = {
    cell: {
        s: {
            type: 'start',
            color: '#6B7ADB',
            description: 'スタート地点',
        },
        e: {
            type: 'end',
            color: '#F59E0B',
            description: 'お宝の場所',
        },
        t: {
            type: 'trap',
            color: '#DC2626',
            description: 'トラップ',
        },
        o: {
            type: 'object',
            color: '#92400E',
            description: 'オブジェクト（土管）',
        },
        n: {
            type: 'normal',
            color: '#D4A574',
        },
    },
    layout: [
        ['s', 'n', 'o', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 'o', 'n', 'n', 'n', 'n', 'n'],
        ['n', 'n', 'o', 'n', 't', 'o', 'n', 'n'],
        ['n', 'n', 'o', 'n', 'n', 'o', 'n', 'n'],
        ['n', 'n', 'o', 'n', 'n', 'o', 't', 'n'],
        ['n', 'n', 'o', 'n', 'n', 'o', 'n', 'n'],
        ['n', 'n', 'n', 'n', 'n', 'o', 'n', 'n'],
        ['t', 'n', 'n', 'n', 'n', 'o', 'n', 'e'],
    ],
};
