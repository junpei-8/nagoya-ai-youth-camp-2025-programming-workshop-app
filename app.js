// ##############
// ## ロガー関数 ##
// ##############

/**
 * @typedef {object} AppLogOptions
 *
 * @property {boolean} [alert] アラートも表示するかどうか
 * @property {Function} [logger] コンソール出力メソッド（console.log, console.error, console.info等）
 */

/**
 * @typedef {object} LogParams
 *
 * @property {string}          type    ログタイプ
 * @property {string}          color   ログの色
 * @property {string|string[]} message ログメッセージ
 */

/**
 * 内部ログ処理関数。
 *
 * @param {LogParams}     params ログパラメータ
 * @param {AppLogOptions} options オプション設定
 */
function log(params, options = {}) {
    const { type, message, color } = params;
    const timestamp = new Date().toLocaleTimeString();
    const header = `[${type.toUpperCase()}]`;
    const style = `color: ${color}; font-weight: bold;`;

    // コンソール出力メソッドの選択（デフォルトはconsole.log）
    const consoleMethod = options.logger || console.log;

    // ヘッダーとメッセージを出力
    const headerWithTime = `%c${header} ${timestamp}`;
    if (Array.isArray(message)) {
        // 配列の場合、各要素間に改行を挿入した新しい配列を作成
        const messageWithNewlines = message.flatMap((item, index) => index === 0 ? [item] : [' \n', item]); // prettier-ignore
        consoleMethod(headerWithTime, style, '\n', ...messageWithNewlines);
    } else {
        consoleMethod(headerWithTime, style, '\n', message);
    }

    // アラートオプションが有効な場合
    if (options.alert) {
        let alertContent;

        /** Primitive 型のみフィルタリングする関数 */
        const filterPrimitives = (item) => {
            const type = typeof item;
            return (
                type === 'string' ||
                type === 'number' ||
                type === 'boolean' ||
                item === null ||
                item === undefined
            );
        };

        // ↓ 配列の場合 Primitive 型のみ抽出
        if (Array.isArray(message)) {
            const primitiveMessages = message.filter(filterPrimitives);
            alertContent = primitiveMessages.join('\n');

            // 単一の Primitive 型の場合
        } else if (filterPrimitives(message)) {
            alertContent = String(message);

            // ↓ Primitive 型でない場合は空文字
        } else {
            alertContent = '';
        }

        // アラートメッセージを構築（ヘッダーなし）
        if (alertContent) {
            alert(alertContent);
        }
    }
}

/**
 * アプリケーション用の共通ロガー関数。
 */
export const AppLogger = {
    /**
     * 成功メッセージをログに出力する。
     *
     * @param {any|any[]} message ログメッセージ
     * @param {AppLogOptions}      options オプション設定
     */
    success(message, options = {}) {
        log({ type: 'success', message, color: '#4CAF50' }, options);
    },

    /**
     * 情報メッセージをログに出力する。
     *
     * @param {any|any[]} message ログメッセージ
     * @param {AppLogOptions}      options オプション設定
     */
    info(message, options = {}) {
        log(
            { type: 'info', message, color: '#2196F3' },
            { ...options, logger: console.info }
        );
    },

    /**
     * エラーメッセージをログに出力する。
     *
     * @param {any|any[]} message ログメッセージ
     * @param {AppLogOptions}      options オプション設定
     */
    error(message, options = {}) {
        log(
            { type: 'error', message, color: '#F44336' },
            { ...options, logger: console.error }
        );
    },

    /**
     * 警告メッセージをログに出力する。
     *
     * @param {any|any[]} message ログメッセージ
     * @param {AppLogOptions}      options オプション設定
     */
    warning(message, options = {}) {
        log(
            { type: 'warning', message, color: '#FF9800' },
            { ...options, logger: console.warn }
        );
    },

    /**
     * デバッグメッセージをログに出力する。
     *
     * @param {any|any[]} message ログメッセージ
     * @param {AppLogOptions}      options オプション設定
     */
    debug(message, options = {}) {
        log(
            { type: 'debug', message, color: '#9E9E9E' },
            { ...options, logger: console.debug }
        );
    },

    /**
     * グループを開始する。
     *
     * @param {string} label グループのラベル
     */
    group(label) {
        console.group(label);
    },

    /**
     * 折りたたみ可能なグループを開始する。
     *
     * @param {string} label グループのラベル
     */
    groupCollapsed(label) {
        console.groupCollapsed(label);
    },

    /**
     * グループを終了する。
     */
    groupEnd() {
        console.groupEnd();
    },
};

// ##############
// ## エラー定義 ##
// ##############

/**
 * @typedef {object} AppErrorOptions
 *
 * @property {boolean} [shouldAlert] アラートも表示するかどうか
 */

/**
 * アプリケーション専用のエラークラス。
 * 処理を停止する必要があるエラーに使用する。
 *
 * @extends Error
 */
export class AppError extends Error {
    /**
     * エラーの詳細情報。
     *
     * @type {string|string[]}
     */
    details;

    /**
     * アラート表示の有無。
     *
     * @type {boolean}
     */
    shouldAlert;

    /**
     * AppError のコンストラクタ。
     *
     * @param {string|string[]}  message エラーメッセージ
     * @param {AppErrorOptions} options オプション設定
     */
    constructor(message, options = {}) {
        // 配列の場合は最初の要素をエラーメッセージとする
        const errorMessage = Array.isArray(message) ? message[0] : message;
        super(errorMessage);

        this.name = 'AppError';
        this.details = message;
        this.shouldAlert = options.shouldAlert || false;
    }

    /**
     * エラーをログに出力する。
     */
    log() {
        // エラーオブジェクト自体も含めてログ出力
        const logMessage = Array.isArray(this.details)
            ? [...this.details, this]
            : [this.details, this];
        AppLogger.error(logMessage, { alert: this.shouldAlert });
    }
}
