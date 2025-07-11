# 用語と一貫性に関する分析

## 1. 概要

本ドキュメントは、プロジェクト内の命名規則、ユビキタス言語、およびコンテキストの表記揺れについて分析した結果をまとめたものです。

<br />

## 2. 命名規則

プロジェクト全体で、以下の命名規則が概ね一貫して適用されています。

-   **JavaScript ファイル名**: `camelCase` (例: `game.js`, `ai-fetch.js`)
-   **Markdown ファイル名 (`_references` ディレクトリ内)**: `kebab-case` (例: `3d-game-issues-analysis.md`)
-   **JavaScript 変数・関数名**: `camelCase` (例: `mapConfig`, `loadThreeJS`, `renderMap`)
-   **JavaScript 定数**: `UPPER_SNAKE_CASE` (例: `movementKey.UP`)
-   **JavaScript 型定義**: `PascalCase` (例: `MapConfig`, `GameContext`)

**評価**: ファイルの種類によって命名規則が異なる点はありますが、それぞれのコンテキスト内では一貫性が保たれており、可読性に大きな問題はありません。

<br />

## 3. ユビキタス言語（主要な用語）

プロジェクト内で頻繁に使用される主要な用語は以下の通りです。これらの用語は、コードとドキュメント間で一貫して使用されています。

-   `mapConfig`: マップ設定オブジェクト
-   `layout`: マップのグリッド構造
-   `cell`: 個々のセル定義（タイプ、色、画像、説明など）
-   `start`, `end`, `trap`, `object`, `normal`, `custom`: セルタイプ
-   `robot`: プレイヤーキャラクター
-   `prompt`: AI への指示全般
-   `systemPrompt`: AI の基本的な振る舞いを定義する指示
-   `routePrompt`: ユーザーからの具体的な移動指示
-   `movementKey`: 移動方向を定義する定数（UP, DOWN, LEFT, RIGHT）
-   `threeJS`: 3D レンダリングライブラリ
-   `renderer`, `scene`, `camera`: Three.js の主要コンポーネント
-   `gameContext`: ゲームの状態と Three.js 要素を保持するオブジェクト
-   `pathFetcher`: AI から経路を取得する関数
-   `gameViewerEl`, `gameResponseViewerEl`, `gameTriggerEl`: ゲーム UI の DOM 要素

**評価**: 主要な用語はプロジェクト全体で統一されており、概念の理解を助けています。

<br />

## 4. コンテキストの不整合・表記揺れ

### 4.1. 致命的な不整合: 数値指示の解釈

-   **意図（ドキュメント）**: `_references/resolved/numeric-instruction-issue-analysis.md` および `_references/resolved/direct-numeric-instruction-removal-spec.md` では、AI が直接的な数値指示（例: 「4マス進む」）を移動回数として解釈しないようにすることが目標とされています。
-   **現状（コード）**: `ai-system-prompt.js` 内の `generateNumericalUnderstandingSection()` 関数は、AI に対して「Nマス進む」という指示をN回の移動として解釈するよう明示的に教えています。また、`generateStepByStepSection()` にも数値指示の例が含まれています。

**問題点**: 意図と実装が直接的に矛盾しています。AI はシステムプロンプトに従うため、数値指示を移動回数として解釈してしまいます。これは、数値指示の理解を排除するという目標を達成する上で最も重要な不整合です。

<br />

### 4.2. 軽微な不整合: `object` タイプに関する用語

-   **コード**: `map-1/map.js` や `map-2/map.js` ではセルタイプとして `object` が定義され、`game.js` では `renderObstacleModel` 関数が `object` タイプのセルをレンダリングするために使用されています。
-   **ドキュメント/UI**: `_references/rich-rendering-plan.md` では `object` タイプが「障害物」や「土管」として言及されています。

**問題点**: コード上の抽象的なタイプ名 (`object`) と、UI 上の具体的な表現（「障害物」「土管」）との間に用語のずれがあります。機能的には問題ありませんが、`object` が具体的に何を指すのかをより明確にするか、タイプ名を `obstacle` に統一することで、より一貫性が向上します。

<br />

### 4.3. その他の用語の一貫性

-   `end` タイプ（ゴール/宝箱）、`trap` タイプ（針）、`robot`（プレイヤー）など、他の主要な概念については、コードとドキュメント間でタイプ名と視覚的表現の対応関係が明確であり、一貫性が保たれています。

<br />

### 4.4. システムプロンプトの進化と残存課題

-   `_references/ai-navigation-improvement-plan.md` で提案された改善点（トラップやゴールの位置のマスクなど）は、`ai-system-prompt.js` に反映されています。
-   しかし、`_references/resolved/numeric-instruction-issue-analysis.md` や `_references/resolved/landmark-instruction-deep-analysis.md` で議論された、数値指示の扱いに関する深い問題や、否定的な表現が AI の解釈に与える影響については、現在の `ai-system-prompt.js` ではまだ完全に解決されていない可能性があります。特に、前述の数値指示の解釈に関する矛盾が残っています。

<br />

## 5. 結論と推奨事項

プロジェクトの命名規則とユビキタス言語は概ね良好ですが、**AI の数値指示の解釈に関する不整合は、ゲームの意図された挙動に直接影響するため、最優先で修正すべき課題です。**

**推奨事項:**

1.  `ai-system-prompt.js` から `generateNumericalUnderstandingSection()` および数値指示に関する具体的な例を削除し、AI が数値を移動回数として解釈しないようにプロンプトを修正する。
2.  `object` タイプについて、コードとドキュメント間の用語の統一を検討する（例: タイプ名を `obstacle` に変更するか、`object` が「障害物」を意味することを明示的に記述する）。
3.  `_references/resolved/landmark-instruction-deep-analysis.md` で提案されている「ポジティブファースト・アプローチ」や「否定的な表現の改善」を `ai-system-prompt.js` に適用し、AI の指示解釈の精度をさらに向上させることを検討する。
