# 3D ゲーム表示問題の分析と解決策

<br />

## 現在の問題点

### 1. 盤面のはみ出し問題

**症状**

-   盤面が黒い枠（game-viewer）からはみ出している
-   上部の空白が下部より大きい（カメラアングルの影響）
-   一部の領域が見えない

**原因分析**

-   カメラの距離計算（`mapMaxSize * 1.5`）が不十分
-   FOV 計算でのマージン（`halfMapSize = mapMaxSize / 2 + 1.5`）が適切でない
-   PerspectiveCamera の特性上、手前（下部）より奥（上部）の方が視野に多く必要

**解決策**

```javascript
// より遠くから見る
const cameraDistance = mapMaxSize * 2.0; // 1.5 → 2.0

// 上部により多くのマージンを確保
const cameraOffsetZ = cameraDistance * 0.3; // 0.4 → 0.3（カメラを少し手前に）

// FOVを再計算（上部の追加マージンを考慮）
const topMargin = 2.0; // 上部用の追加マージン
const halfMapSizeWithMargin = mapMaxSize / 2 + topMargin;
```

### 2. プレイヤーの位置ずれ問題

**症状**

-   プレイヤーがマスの中心から少しずれて止まる

**原因分析**

-   現在のタイル配置：`tile.position.set(i, 0.01, j)` → i,j は 0 ベースの整数
-   プレイヤーの初期位置：`position.start.x`と`position.start.y`が整数であることが前提
-   問題：座標系の不一致または浮動小数点の誤差

**解決策**

```javascript
// プレイヤーの位置を常に整数に丸める
player.position.set(
    Math.round(mapContext.position.start.x),
    0.4,
    Math.round(mapContext.position.start.y)
);

// movePlayer内でも最終位置を整数に丸める
const endPos = new threeJS.Vector3(
    Math.round(targetX),
    player.position.y,
    Math.round(targetZ)
);
```

### 3. 盤外移動問題

**症状**

-   境界チェックを実装したにも関わらず、プレイヤーが盤外に出る

**原因分析**

-   `mapDisplayWidth`と`mapDisplayHeight`が GameContext に正しく含まれていない可能性
-   `setupPlayerMoverButton`内のリセット処理での座標設定

**解決策**

```javascript
// GameContextの確認とデバッグ
console.log('Map dimensions:', mapDisplayWidth, 'x', mapDisplayHeight);
console.log('Current position:', player.position.x, player.position.z);
console.log('Target position:', targetX, targetZ);

// より厳密な境界チェック
if (
    targetX < 0 ||
    targetX > mapDisplayWidth - 1 ||
    targetZ < 0 ||
    targetZ > mapDisplayHeight - 1
) {
    return;
}
```

<br />

## 実装順序

1. **盤面のはみ出し修正**

    - カメラ距離と FOV の調整
    - 上下の空白バランス改善

2. **プレイヤー位置の修正**

    - 整数座標への丸め処理追加
    - 初期位置と移動後の位置を統一

3. **盤外移動の修正**
    - GameContext の確認
    - 境界チェックの強化
    - デバッグログの追加
