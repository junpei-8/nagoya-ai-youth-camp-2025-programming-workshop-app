# `ai-system-prompt.js` リファクタリング計画

`ai-system-prompt.js` の可読性、保守性を向上させるためのリファクタリング計画です。

## 1. 全体構成の見直し

-   **現状**: `+=` 演算子による文字列の逐次結合でプロンプト全体を構築しており、見通しが悪い。
-   **改善案**:
    -   各プロンプトセクションを個別の関数として定義する。
    -   メインの `generateSystemPrompt` 関数では、これらの関数を呼び出し、結果をテンプレートリテラルで結合する。これにより、全体の構造が明確になり、各部分の責務が分離される。

## 2. 重複記述の削減

-   **現状**: 複数のセクションで同様の記述が繰り返されている。
    -   **座標系の説明**: 「2. 座標系と方向の理解」と「5. 固有マップの説明」で重複。
    -   **移動キーの例**: `movementKey` を使った移動例が各所で個別に記述されている。
-   **改善案**:
    -   座標系の説明を一つの共通関数または定数にまとめる。
    -   移動キーの文字列 (`W`, `S`, `A`, `D`) を使った移動例を生成するヘルパー関数を作成し、冗長な記述を置き換える。

## 3. ロジックと静的テキストの分離

-   **現状**: プロンプトを生成するためのロジック（ループ処理など）が、静的なテキスト定義の中に混在している。
    -   例: 「5. 固有マップの説明」、「6. 固有マップの記号とタイプ」、「8. 認識可能なオブジェクトの位置」
-   **改善案**:
    -   マップレイアウト、セル定義、認識可能オブジェクトの位置を解析・整形するロジックを、それぞれ独立したヘルパー関数に切り出す。
    -   これにより、プロンプトの構造とデータ処理のロジックが明確に分離され、テストや修正が容易になる。

## 4. 可読性の向上

-   **現状**: 長大な文字列が `+` や `+=` で連結されており、コードが読みにくい。
-   **改善案**:
    -   テンプレートリテラルを全面的に採用し、文字列の埋め込みや改行を直感的に記述できるようにする。
    -   各セクションを関数に分けることで、それぞれの役割が明確になり、コードの塊が小さくなるため、可読性が向上する。

## 5. 修正対象の具体的な関数と処理

-   **`generateSystemPrompt(mapConfig)`**:
    -   内部の処理を、後述するヘルパー関数の呼び出しに置き換える。
-   **新規作成するヘルパー関数**:
    -   `createRoleSection()`: あなたの役割
    -   `createCoordinateSystemSection(movementKey)`: 座標系と方向
    -   `createMovementInstructionSection(movementKey)`: 移動の指示
    -   `createCellTypesSection()`: 一般的なセルタイプの説明
    -   `createMapLayoutSection(mapConfig)`: 固有マップのレイアウト
    -   `createMapLegendSection(mapConfig)`: 固有マップの記号とタイプ
    -   `createUserRoleSection()`: ユーザーの役割
    -   `createVisibleObjectsSection(mapConfig)`: 認識可能なオブジェクト
    -   `createInterpretationSection()`: 限定的な情報での指示解釈
    -   `createNumericInstructionSection(movementKey)`: 数値の理解と移動
    -   `createStepByStepInstructionSection(movementKey)`: 段階的な指示
    -   `createImplicitInfoSection()`: 暗黙的な情報
    -   `createCorePrinciplesSection()`: 指示解釈の原則
    -   `createMindsetSection()`: 実行時の心構え
    -   `createOutputFormatSection(movementKey)`: 最終的な出力形式

この計画に沿ってリファクタリングを進めます。
