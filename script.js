let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; 
let visiblePeelsCount = 0; 

// Drag thresholds
let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 75;

// Boot lifecycle wrapper
document.addEventListener("DOMContentLoaded", () => {
    startLevel();
});

function startLevel() {
    document.getElementById('level-display').innerText = `Level ${currentLevel}/${maxLevels}`;
    document.getElementById('win-message').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
    
    // Level scaling calculation (Doubling values sequence)
    totalPeelsNeeded = 3 * Math.pow(2, currentLevel - 1);
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    // Clear nodes
    document.getElementById('peel-spawn-layer').innerHTML = "";
    visiblePeelsCount = 0;

    // Build stack (capped at 20 processing threads to bypass performance rendering throttling)
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
    
    const directions = ['left', 'right', 'down'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    peel.dataset.direction = randomDir;

    if (randomDir === 'left') {
        peel.classList.add('left-peel');
    } else if (randomDir === 'right') {
        peel.classList.add('right-peel');
    } else {
        peel.classList.add('front-peel');
    }

    const shapeInner = document.createElement('div');
    shapeInner.classList.add('peel-shape');

    let randomRotation = 0; 
    
    if (randomDir === 'left') {
        shapeInner.style.borderRadius = "100% 0% 20% 50% / 60% 0% 10% 40%";
        randomRotation = -4 - (Math.random() * 8); 
    } else if (randomDir === 'right') {
        shapeInner.style.borderRadius = "0% 100% 50% 20% / 0% 60% 40% 10%";
        randomRotation = 4 + (Math.random() * 8); 
    } else {
        shapeInner.style.borderRadius = "50% 50% 30% 30% / 40% 40% 60% 60%";
        shapeInner.style.background = "#f5d742"; 
        randomRotation = (Math.random() * 6) - 3; 
    }

    peel.style.transform = `rotate(${randomRotation}deg)`;
    peel.dataset.baseRotation = randomRotation; 

    peel.appendChild(shapeInner);
    container.appendChild(peel);

    peel.addEventListener('pointerdown', startDrag);
}

function startDrag(e) {
    if (activePeel) return;
    
    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
    activePeel.style.zIndex = 100; 
    activePeel.style.transition = ""; // Kill snap-back transitions during active tracking
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
    const baseRot = parseFloat(activePeel.dataset.baseRotation) || 0;

    // Track input progression scalar (0.0 to 1.0)
    let progress = 0;
    if (direction === 'left') progress = Math.min(Math.abs(deltaX) / PEEL_THRESHOLD, 1);
    if (direction === 'right') progress = Math.min(Math.abs(deltaX) / PEEL_THRESHOLD, 1);
    if (direction === 'down') progress = Math.min(Math.max(0, deltaY) / PEEL_THRESHOLD, 1);

    // Calculate real-time interactive geometric transformations
    const liveRotateX = progress * -120; 
    const liveScale = 1 - (progress * 0.3); 
    const liveClipTop = progress * 100;

    // Stream rendering values live to the DOM clip matrix
    activePeel.style.clipPath = `polygon(0% ${liveClipTop}%, 100% ${liveClipTop}%, 100% 100%, 0% 100%)`;

    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${Math.abs(deltaX) * 0.4}px) rotate(${baseRot + (deltaX * 0.2)}deg) rotateX(${liveRotateX}deg) scale(${liveScale})`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${deltaX * 0.4}px) rotate(${baseRot + (deltaX * 0.2)}deg) rotateX(${liveRotateX}deg) scale(${liveScale})`;
    } else if (direction === 'down' && deltaY > 0) {
        const frontRotateX = progress * 140;
        activePeel.style.transform = `translateY(${deltaY}px) rotate(${baseRot}deg) rotateX(${frontRotateX}deg) scale(${liveScale})`;
    }

    // Evaluate success bounds threshold crossings
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
        
        // Elastic rebound execution if let go early
        activePeel.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), clip-path 0.3s ease";
        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
        activePeel.style.clipPath = "none"; 
        
        const transientPeel = activePeel;
        setTimeout(() => {
            if (transientPeel && !transientPeel.classList.contains('peeled-away')) {
                transientPeel.style.transition = "";
            }
        }, 300);
    }

    activePeel = null;
}

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    const direction = peel.dataset.direction;
    const baseRot = parseFloat(peel.dataset.baseRotation) || 0;

    // Final exaggerated explosive vector releases
    if (direction === 'left') {
        peel.style.transform = `translate(-200px, 250px) rotate(${baseRot - 90}deg) rotateX(-180deg) scale(0.05)`;
    } else if (direction === 'right') {
        peel.style.transform = `translate(200px, 250px) rotate(${baseRot + 90}deg) rotateX(-180deg) scale(0.05)`;
    } else {
        peel.style.transform = `translateY(300px) rotate(${baseRot}deg) rotateX(270deg) scale(0.05)`;
    }

    peel.style.clipPath = `polygon(50% 100%, 50% 100%, 100% 100%, 0% 100%)`;

    totalPeelsNeeded--;
    visiblePeelsCount--;
    
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

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
