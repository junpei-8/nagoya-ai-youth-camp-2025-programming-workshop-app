# ゲームエラーハンドリング仕様書

<br />

## 概要

ゲーム内のエラーハンドリングとロギングを統一するため、`game-handler.js` に共通の `gameLogger` と `GameError` クラスを定義します。

<br />

## gameLogger の仕様

### 基本構造

```javascript
const gameLogger = {
    success(message, options = {})
    info(message, options = {})
    error(message, options = {})
    warning(message, options = {})
    debug(message, options = {})
}
```

### パラメータ

- `message: string | string[]` - ログメッセージ（配列の場合は console.log に展開して渡される）
- `options: { alert?: boolean }` - オプション設定
  - `alert: true` の場合、アラートも表示する

### 使用例

```javascript
// 単純なログ
gameLogger.info('ゲームを開始しました');

// 配列でのログ
gameLogger.debug(['AI からの経路:', moves]);

// アラート付きログ
gameLogger.error('接続エラーが発生しました', { alert: true });
```

<br />

## GameError クラスの仕様

### 基本構造

```javascript
class GameError extends Error {
    constructor(message, options = {})
    log()
}
```

### コンストラクタパラメータ

- `message: string | string[]` - エラーメッセージ
  - 文字列の場合：そのまま Error のメッセージとして使用
  - 配列の場合：最初の要素を Error メッセージとし、全要素を詳細情報として保持
- `options: { shouldAlert?: boolean }` - オプション設定
  - `shouldAlert: true` の場合、`log()` メソッド呼び出し時にアラートも表示

### メソッド

- `log()` - エラーをログに出力（gameLogger.error を使用）

### 使用例

```javascript
// 単純なエラー
throw new GameError('ゲームの初期化に失敗しました');

// アラート付きエラー
throw new GameError('重大なエラーが発生しました', { shouldAlert: true });

// 詳細情報付きエラー
throw new GameError(['API エラー', error.message, error.stack], { shouldAlert: true });

// エラーのキャッチとログ出力
try {
    // 処理
} catch (error) {
    if (error instanceof GameError) {
        error.log();
    }
    throw error;
}
```

<br />

## エラーハンドリングの方針

### 処理を停止する必要があるエラー

`GameError` を使用してスローします。

```javascript
// Three.js のロードエラー
throw new GameError('Three.js の動的インポートに失敗しました', { shouldAlert: true });

// ゲームの初期化エラー
throw new GameError(['ゲームのセットアップに失敗しました', error], { shouldAlert: true });
```

### 処理を継続できる正常系エラー

`gameLogger.error()` を使用してログ出力のみ行います。

```javascript
// トラップ接触（ゲームオーバー）
gameLogger.error('トラップに接触しました！\nゲームオーバーです。', { alert: true });

// AI 経路取得エラー（リトライ可能）
gameLogger.error(['AI 経路の取得に失敗しました:', error]);
```

<br />

## 実装場所

- `game-handler.js` - gameLogger と GameError の定義
- 各ゲームファイル - game-handler.js をインポートして使用

<br />

## 移行計画

1. `game-handler.js` ファイルを新規作成
2. `gameLogger` を game.js から game-handler.js に移動
3. `GameError` クラスを game-handler.js に実装
4. game.js 内のエラーハンドリングを新しい方式に更新
5. 他のファイル（ai-fetch.js など）も必要に応じて更新