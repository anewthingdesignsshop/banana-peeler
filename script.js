let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; 
let visiblePeelsCount = 0; 

// Pointer tracking variables
let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 75;

// CHANGE THIS BLOCK RIGHT HERE:
document.addEventListener("DOMContentLoaded", () => {
    // This forces the game to wait until the HTML container exists!
    startLevel(); 
});

// Remove any loose "startLevel();" calls that might be sitting outside this block.
