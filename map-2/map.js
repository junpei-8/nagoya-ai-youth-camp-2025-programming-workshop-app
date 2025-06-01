const mapConfig = {
  width: 7,
  height: 7,
  tileSize: 32, // Assuming tileSize is consistent
  start: { x: 1, y: 1 },
  goal: { x: 5, y: 5 }, // Corrected goal to be within 0-6 range for a 7x7 grid
  traps: [{ x: 3, y: 2 }, { x: 4, y: 4 }],
  layout: [ // Example layout, can be adjusted
    "#######",
    "#S    #",
    "# # # #",
    "#  T  #",
    "# ### #",
    "#   T G#", // Adjusted G to be within bounds
    "#######"
  ]
};
