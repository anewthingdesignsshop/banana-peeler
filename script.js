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

    // Smart directional rotations to prevent the layout from flaring out like a tulip
    let randomRotation = 0; 
    
    if (randomDir === 'left') {
        shapeInner.style.borderRadius = "100% 0% 20% 50% / 60% 0% 10% 40%";
        // Left peels ONLY lean slightly left (-4 to -12 degrees)
        randomRotation = -4 - (Math.random() * 8); 
    } else if (randomDir === 'right') {
        shapeInner.style.borderRadius = "0% 100% 50% 20% / 0% 60% 40% 10%";
        // Right peels ONLY lean slightly right (+4 to +12 degrees)
        randomRotation = 4 + (Math.random() * 8); 
    } else {
        shapeInner.style.borderRadius = "50% 50% 30% 30% / 40% 40% 60% 60%";
        shapeInner.style.background = "#f5d742"; 
        // Center/front peels stay almost perfectly straight (-3 to +3 degrees)
        randomRotation = (Math.random() * 6) - 3; 
    }

    peel.style.transform = `rotate(${randomRotation}deg)`;
    peel.dataset.baseRotation = randomRotation; 

    peel.appendChild(shapeInner);
    container.appendChild(peel);

    // Attach interaction listeners
    peel.addEventListener('pointerdown', startDrag);
}

function startDrag(e) {
    if (activePeel) return;
    
    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
    activePeel.style.zIndex = 100; 
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
    const baseRot = parseFloat(peel.dataset.baseRotation) || 0;

    // Fixed 3D Curl Transitions mapping to our perspective layer
    if (direction === 'left') {
        peel.style.transform = `translate(-80px, 120px) rotate(${baseRot - 45}deg) rotateX(-110deg)`;
    } else if (direction === 'right') {
        peel.style.transform = `translate(80px, 120px) rotate(${baseRot + 45}deg) rotateX(-110deg)`;
    } else {
        peel.style.transform = `translateY(140px) rotate(${baseRot}deg) rotateX(120deg)`;
    }

    totalPeelsNeeded--;
    visiblePeelsCount--;
    
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    // Auto-replenish queue safely from stack up to the 20 element max screen limit
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
