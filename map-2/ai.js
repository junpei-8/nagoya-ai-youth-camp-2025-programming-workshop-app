/**
 * map.js を編集してマップを変更してください。ここは触らないでください。
 */
function findPath(config) {
    const { width, height, start, goal, traps } = config;
    const dirs = [
        { dx: 1, dz: 0, name: '→' }, // Right
        { dx: -1, dz: 0, name: '←' }, // Left
        { dx: 0, dz: 1, name: '↓' },  // Down (along Z axis)
        { dx: 0, dz: -1, name: '↑' }, // Up (along Z axis)
    ];

    const passable = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => true)
    );
    traps.forEach(t => {
        if (t.x >= 0 && t.x < width && t.y >= 0 && t.y < height) {
            passable[t.x][t.y] = false;
        }
    });

    const queue = [];
    queue.push({ x: start.x, y: start.y, path: [] });
    const visited = new Set([`${start.x},${start.y}`]);

    while (queue.length > 0) {
        const node = queue.shift();

        if (node.x === goal.x && node.y === goal.y) {
            return node.path;
        }

        for (const d of dirs) {
            const nx = node.x + d.dx;
            const ny = node.y + d.dz;

            if (
                nx >= 0 && nx < width &&
                ny >= 0 && ny < height &&
                passable[nx][ny] &&
                !visited.has(`${nx},${ny}`)
            ) {
                visited.add(`${nx},${ny}`);
                queue.push({ x: nx, y: ny, path: node.path.concat(d.name) });
            }
        }
    }
    return null; // No path found
}

// グローバルに公開
window.findPath = findPath;
