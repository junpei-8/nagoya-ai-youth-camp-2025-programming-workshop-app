/**
 * ロボット（プレイヤー）を描画する。
 *
 * @param   {object} params         パラメータ
 * @param   {object} params.threeJS Three.js インスタンス
 * @param   {number} params.x       X座標
 * @param   {number} params.y       Y座標
 * @param   {number} params.z       Z座標
 * @returns {object}                ロボットのメッシュオブジェクト
 */
export function renderRobot({ threeJS, x, y, z }) {
    const group = new threeJS.Group();

    // メインボディ（丸みを帯びた箱型）
    const bodyGeometry = new threeJS.BoxGeometry(0.6, 0.5, 0.5);
    const bodyMaterial = new threeJS.MeshStandardMaterial({
        color: 0xf5f5dc, // ベージュ色
        metalness: 0.1,
        roughness: 0.7,
    });
    const body = new threeJS.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.35;

    // ボディの角を丸くするためにスケール調整
    body.scale.set(1, 1, 0.9);
    group.add(body);

    // 顔のプレート（青色のスクリーン部分）
    const faceGeometry = new threeJS.BoxGeometry(0.35, 0.25, 0.02);
    const faceMaterial = new threeJS.MeshStandardMaterial({
        color: 0x4a90e2, // 明るい青色
        metalness: 0.2,
        roughness: 0.6,
    });
    const face = new threeJS.Mesh(faceGeometry, faceMaterial);
    face.position.set(0, 0.35, 0.26); // ボディの前面に配置
    group.add(face);

    // 目（左）
    const eyeGeometry = new threeJS.BoxGeometry(0.08, 0.12, 0.02);
    const eyeMaterial = new threeJS.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2,
    });
    const leftEye = new threeJS.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.35, 0.27);
    group.add(leftEye);

    // 目（右）
    const rightEye = new threeJS.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.35, 0.27);
    group.add(rightEye);

    // 車輪（左）
    const wheelGeometry = new threeJS.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const wheelMaterial = new threeJS.MeshStandardMaterial({
        color: 0x2c2c2c,
        metalness: 0.3,
        roughness: 0.8,
    });
    const leftWheel = new threeJS.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-0.35, 0.15, 0);
    group.add(leftWheel);

    // 車輪（右）
    const rightWheel = new threeJS.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(0.35, 0.15, 0);
    group.add(rightWheel);

    // 上部の三角マーカー（方向を示す）
    const markerGeometry = new threeJS.ConeGeometry(0.1, 0.15, 4);
    const markerMaterial = new threeJS.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.8,
    });
    const marker = new threeJS.Mesh(markerGeometry, markerMaterial);
    marker.position.y = 0.7;
    marker.rotation.y = Math.PI / 4; // 45度回転してダイヤモンド形に
    group.add(marker);

    // 位置を設定
    group.position.set(x, y, z);

    return group;
}

/**
 * 障害物（土管）を描画する。
 *
 * @param   {object} params         パラメータ
 * @param   {object} params.threeJS Three.js インスタンス
 * @param   {number} params.x       X座標
 * @param   {number} params.z       Z座標
 * @returns {object}                土管のメッシュオブジェクト
 */
export function renderObstacle({ threeJS, x, z }) {
    const group = new threeJS.Group();

    // 土管の本体
    const pipeGeometry = new threeJS.CylinderGeometry(0.4, 0.4, 0.8, 16);
    const pipeMaterial = new threeJS.MeshStandardMaterial({
        color: 0x228822,
        metalness: 0.1,
        roughness: 0.8,
    });
    const pipe = new threeJS.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.y = 0.4;
    group.add(pipe);

    // 土管の縁（上）
    const rimGeometry = new threeJS.TorusGeometry(0.4, 0.05, 8, 16);
    const rimMaterial = new threeJS.MeshStandardMaterial({
        color: 0x33aa33,
        metalness: 0.1,
        roughness: 0.8,
    });
    const topRim = new threeJS.Mesh(rimGeometry, rimMaterial);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 0.8;
    group.add(topRim);

    // 土管の縁（下）
    const bottomRim = new threeJS.Mesh(rimGeometry, rimMaterial);
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.y = 0;
    group.add(bottomRim);

    // 位置を設定
    group.position.set(x, 0, z);

    return group;
}

/**
 * トラップ（針）を描画する。
 *
 * @param   {object} params         パラメータ
 * @param   {object} params.threeJS Three.js インスタンス
 * @param   {number} params.x       X座標
 * @param   {number} params.z       Z座標
 * @returns {object}                針のメッシュオブジェクト
 */
export function renderTrap({ threeJS, x, z }) {
    const group = new threeJS.Group();

    // ベース（土台）
    const baseGeometry = new threeJS.BoxGeometry(0.9, 0.05, 0.9);
    const baseMaterial = new threeJS.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.5,
        roughness: 0.3,
    });
    const base = new threeJS.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.025;
    group.add(base);

    // 針を複数配置
    const spikeMaterial = new threeJS.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.8,
        roughness: 0.2,
    });

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const spikeGeometry = new threeJS.ConeGeometry(0.08, 0.3, 8);
            const spike = new threeJS.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(i * 0.25, 0.2, j * 0.25);
            group.add(spike);
        }
    }

    // 位置を設定
    group.position.set(x, 0, z);

    return group;
}

/**
 * ゴール（宝箱）を描画する。
 *
 * @param   {object} params         パラメータ
 * @param   {object} params.threeJS Three.js インスタンス
 * @param   {number} params.x       X座標
 * @param   {number} params.z       Z座標
 * @returns {object}                宝箱のメッシュオブジェクト
 */
export function renderGoal({ threeJS, x, z }) {
    const group = new threeJS.Group();

    // 宝箱の本体
    const boxGeometry = new threeJS.BoxGeometry(0.7, 0.5, 0.5);
    const boxMaterial = new threeJS.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.1,
        roughness: 0.9,
    });
    const box = new threeJS.Mesh(boxGeometry, boxMaterial);
    box.position.y = 0.25;
    group.add(box);

    // 宝箱の蓋
    const lidGeometry = new threeJS.BoxGeometry(0.7, 0.15, 0.5);
    const lidMaterial = new threeJS.MeshStandardMaterial({
        color: 0xa0522d,
        metalness: 0.1,
        roughness: 0.9,
    });
    const lid = new threeJS.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 0.525, -0.1);
    lid.rotation.x = -0.3; // 少し開いた状態
    group.add(lid);

    // 金の装飾（中央）
    const decorationGeometry = new threeJS.BoxGeometry(0.1, 0.3, 0.02);
    const decorationMaterial = new threeJS.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.7,
        roughness: 0.3,
    });
    const decoration = new threeJS.Mesh(decorationGeometry, decorationMaterial);
    decoration.position.set(0, 0.25, 0.26);
    group.add(decoration);

    // 金の装飾（横バー）
    const barGeometry = new threeJS.BoxGeometry(0.7, 0.05, 0.02);
    const bar = new threeJS.Mesh(barGeometry, decorationMaterial);
    bar.position.set(0, 0.25, 0.26);
    group.add(bar);

    // 位置を設定
    group.position.set(x, 0, z);

    return group;
}

/**
 * 通常のタイルを描画する。
 *
 * @param   {object} params         パラメータ
 * @param   {object} params.threeJS Three.js インスタンス
 * @param   {number} params.x       X座標
 * @param   {number} params.z       Z座標
 * @param   {number} params.color   タイルの色
 * @returns {object}                タイルのメッシュオブジェクト
 */
export function renderTile({ threeJS, x, z, color }) {
    const geometry = new threeJS.PlaneGeometry(0.98, 0.98);
    const material = new threeJS.MeshStandardMaterial({
        color: color,
        side: threeJS.DoubleSide,
    });

    const tile = new threeJS.Mesh(geometry, material);
    tile.rotation.x = -Math.PI / 2; // X軸を中心に-90度回転して水平に
    tile.position.set(x, 0.01, z); // 盤面の上に少し浮かせて配置

    return tile;
}
