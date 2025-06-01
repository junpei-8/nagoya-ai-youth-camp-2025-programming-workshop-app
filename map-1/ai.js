// Find a path from start to end using Breadth-First Search
function findPath(start, end, mapLayout) {
  const queue = [[start]];
  const visited = new Set([`${start.x}-${start.y}`]);

  while (queue.length > 0) {
    const path = queue.shift();
    const { x, y } = path[path.length - 1];

    if (x === end.x && y === end.y) {
      return path; // Path found
    }

    // Explore neighbors (up, down, left, right)
    const neighbors = [
      { x, y: y - 1 }, // Up
      { x, y: y + 1 }, // Down
      { x: x - 1, y }, // Left
      { x: x + 1, y }  // Right
    ];

    for (const neighbor of neighbors) {
      const key = `${neighbor.x}-${neighbor.y}`;
      if (
        neighbor.x >= 0 && neighbor.x < mapLayout[0].length &&
        neighbor.y >= 0 && neighbor.y < mapLayout.length &&
        mapLayout[neighbor.y][neighbor.x] !== '#' && // Check for walls
        !visited.has(key)
      ) {
        visited.add(key);
        const newPath = [...path, neighbor];
        queue.push(newPath);
      }
    }
  }

  return null; // No path found
}
