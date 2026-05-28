let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; // Tracks how many remaining peels must be discarded
let visiblePeelsCount = 0; // Tracks current peels physically rendered on screen

// Pointer tracking variables
let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 75;

document.addEventListener("DOMContentLoaded", () => {
    startLevel();
});

function startLevel() {
    document.getElementById('level-display').innerText = `Level ${currentLevel}/${maxLevels}`;
    document.getElementById('win-message').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
    
    // Level scaling math: Level 1 = 3. Level 2 = 6, Level 3 = 12, etc.
    totalPeelsNeeded = 3 * Math.pow(2, currentLevel - 1);
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    // Clear any previous peels
    document.getElementById('peel-spawn-layer').innerHTML = "";
    visiblePeelsCount = 0;

    // Populate visual peels (cap rendering at 20 max to avoid browser lag)
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
    
    // Assign a random direction layout style
    const directions = ['left', 'right', 'down'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    peel.dataset.direction = randomDir;

    // Apply slightly randomized styling variants for curvature organic layering
    const shapeInner = document.createElement('div');
    shapeInner.classList.add('peel-shape');

    let randomRotation = (Math.random() * 24) - 12; // angle variation between -12deg and 12deg
    
    if (randomDir === 'left') {
        shapeInner.style.borderRadius = "100% 0% 20% 50% / 60% 0% 10% 40%";
    } else if (randomDir === 'right') {
        shapeInner.style.borderRadius = "0% 100% 50% 20% / 0% 60% 40% 10%";
    } else {
        shapeInner.style.borderRadius = "50% 50% 30% 30% / 40% 40% 60% 60%";
        shapeInner.style.background = "#f5d742"; // slight color variation for middle layers
    }

    peel.style.transform = `rotate(${randomRotation}deg)`;
    peel.dataset.baseRotation = randomRotation; // save base angle coordinate data

    peel.appendChild(shapeInner);
    container.appendChild(peel);

    // Bind touch/mouse tracking hooks
    peel.addEventListener('pointerdown', startDrag);
}

function startDrag(e) {
    if (activePeel) return;
    
    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
    activePeel.style.zIndex = 100; // Bring currently dragged item to the very top
    activePeel.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;

    activePeel.addEventListener('pointermove', drag);
    activePeel.addEventListener('pointerup', stopDrag);
}

function drag(e) {
    if (!activePeel) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const direction = activePeel.dataset.direction;
    const baseRot = parseFloat(activePeel.dataset.baseRotation);

    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${Math.abs(deltaX)*0.5}px) rotate(${baseRot + deltaX*0.3}deg)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${deltaX*0.5}px) rotate(${baseRot + deltaX*0.3}deg)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `rotate(${baseRot}deg) translateY(${deltaY}px) scaleY(${1 - deltaY*0.002})`;
    }

    if (
        (direction === 'left' && deltaX < -PEEL_THRESHOLD) ||
        (direction === 'right' && deltaX > PEEL_THRESHOLD) ||
        (direction === 'down' && deltaY > PEEL_THRESHOLD)
    ) {
        successfulPeel();
    }
}

function stopDrag(e) {
    if (!activePeel) return;

    activePeel.releasePointerCapture(e.pointerId);
    activePeel.removeEventListener('pointermove', drag);
    activePeel.removeEventListener('pointerup', stopDrag);

    if (activePeel && !activePeel.classList.contains('peeled-away')) {
        activePeel.style.cursor = 'grab';
        activePeel.style.zIndex = "";
        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
    }

    activePeel = null;
}

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    const direction = peel.dataset.direction;
    if (direction === 'left') peel.style.transform = 'translate(-200px, 100px) rotate(-140deg)';
    if (direction === 'right') peel.style.transform = 'translate(200px, 100px) rotate(140deg)';
    if (direction === 'down') peel.style.transform = 'translateY(220px) scaleY(0.1)';

    totalPeelsNeeded--;
    visiblePeelsCount--;
    
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    // Dynamic endless refill check: if we need more down the line, auto-replenish visual space
    if (totalPeelsNeeded >= 20 && visiblePeelsCount < 20) {
        spawnPeelElement();
    }

    if (totalPeelsNeeded === 0) {
        handleLevelWin();
    }
    
    activePeel = null;
}

function handleLevelWin() {
    if (currentLevel === maxLevels) {
        document.getElementById('win-message').innerText = "🎉 Unbelievable! You completed all 20 Levels! You are the Banana Master! 👑";
    } else {
        document.getElementById('win-message').innerText = "Level Complete! 🍌";
        document.getElementById('next-btn').style.display = 'inline-block';
    }
}

function goToNextLevel() {
    if (currentLevel < maxLevels) {
        currentLevel++;
        startLevel();
    }
}
