let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; 
let visiblePeelsCount = 0; 

// Drag thresholds
let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 75;

// Strict boot setup wrapper
document.addEventListener("DOMContentLoaded", () => {
    startLevel();
});

function startLevel() {
    document.getElementById('level-display').innerText = `Level ${currentLevel}/${maxLevels}`;
    document.getElementById('win-message').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
    
    // Level scaling algorithm: Level 1 = 3, Level 2 = 6, Level 3 = 12, etc.
    totalPeelsNeeded = 3 * Math.pow(2, currentLevel - 1);
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    // Clear structural canvas
    document.getElementById('peel-spawn-layer').innerHTML = "";
    visiblePeelsCount = 0;

    // Build visual peel layers (Cap visible elements at 20 to avoid browser lag)
    let peelsToRender = Math.min(totalPeelsNeeded, 20);
    for (let i = 0; i < peelsToRender; i++) {
        spawnPeelElement();
    }
}

function spawnPeelElement() {
    visiblePeelsCount++;
    const container = document.getElementById('peel-spawn-layer');
    
    const peel = document.createElement('div');
    peel.classList.add('peel');
    
    // Assign direction parameters
    const directions = ['left', 'right', 'down'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    peel.dataset.direction = randomDir;

    // Bind JavaScript choice to CSS positioning coordinates
    if (randomDir === 'left') {
        peel.classList.add('left-peel');
    } else if (randomDir === 'right') {
        peel.classList.add('right-peel');
    } else {
        peel.classList.add('front-peel');
    }

    const shapeInner = document.createElement('div');
    shapeInner.classList.add('peel-shape');

    // FIXED: Smart directional rotations to prevent the tulip fanning effect
    let randomRotation = 0; 
    
    if (randomDir === 'left') {
        shapeInner.style.borderRadius = "100% 0% 20% 50
