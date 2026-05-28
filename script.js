let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; 
let visiblePeelsCount = 0; 

let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 80;

document.addEventListener("DOMContentLoaded", () => {
    startLevel();
});

function startLevel() {
    document.getElementById('level-display').innerText = `Level ${currentLevel}/${maxLevels}`;
    document.getElementById('win-message').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
    
    totalPeelsNeeded = 3 * Math.pow(2, currentLevel - 1);
    document.getElementById('peel-counter').innerText = `Peels Remaining: ${totalPeelsNeeded}`;

    document.getElementById('peel-spawn-layer').innerHTML = "";
    visiblePeelsCount = 0;

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

    if (randomDir === 'left') peel.classList.add('left-peel');
    else if (randomDir === 'right') peel.classList.add('right-peel');
    else peel.classList.add('front-peel');

    const shapeOuter = document.createElement('div');
    shapeOuter.classList.add('peel-shape');

    const shapeInner = document.createElement('div');
    shapeInner.classList.add('peel-inner');

    if (randomDir === 'down') {
        shapeOuter.style.background = "linear-gradient(90deg, #e0b20c 0%, #f5d742 30%, #fae366 70%, #dbad0b 100%)";
    }

    peel.appendChild(shapeOuter);
    peel.appendChild(shapeInner);

    // Minor random tilt variance to give individual layers natural depth
    let randomRotation = (Math.random() * 4) - 2; 
    peel.style.transform = `rotate(${randomRotation}deg)`;
    peel.dataset.baseRotation = randomRotation; 

    container.appendChild(peel);
    peel.addEventListener('pointerdown', startDrag);
}

function startDrag(e) {
    if (activePeel) return;
    
    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
    activePeel.style.zIndex = 100;
    
    // Clear old transition rules instantly for raw responsiveness
    const outer = activePeel.querySelector('.peel-shape');
    const inner = activePeel.querySelector('.peel-inner');
    activePeel.style.transition = "";
    outer.style.transition = "";
    inner.style.transition = "";

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

    let progress = 0;
    if (direction === 'left') progress = Math.min(Math.abs(deltaX) / PEEL_THRESHOLD, 1);
    if (direction === 'right') progress = Math.min(Math.abs(deltaX) / PEEL_THRESHOLD, 1);
    if (direction === 'down') progress = Math.min(Math.max(0, deltaY) / PEEL_THRESHOLD, 1);

    const outer = activePeel.querySelector('.peel-shape');
    const inner = activePeel.querySelector('.peel-inner');

    // AUTHENTIC CURL PHYSIC:
    // The unpeeled section gets clipped from the top down.
    // Simultaneously, the shape flips over on rotateX to mimic the peeled flap curling backwards!
    const clipTop = progress * 100;
    const liveRotateX = progress * -150; // Sweeps backward up to 150 degrees
    const liveScaleY = 1 - (progress * 0.4); // Naturally scales down to look tighter

    // Apply clean top-down mask
    activePeel.style.clipPath = `polygon(0% ${clipTop}%, 100% ${clipTop}%, 100% 100%, 0% 100%)`;

    // Rotate the inner layers to flip back into 3D view space
    if (direction === 'down') {
        outer.style.transform = `rotateX(${progress * 150}deg) scaleY(${liveScaleY})`;
        inner.style.transform = `rotateY(180deg) rotateX(${progress * 150}deg) scaleY(${liveScaleY})`;
    } else {
        outer.style.transform = `rotateX(${liveRotateX}deg) scaleY(${liveScaleY})`;
        inner.style.transform = `rotateY(180deg) rotateX(${liveRotateX}deg) scaleY(${liveScaleY})`;
    }

    // Directional root tracking translations
    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.15)}deg) translateX(${deltaX * 0.3}px) translateY(${Math.abs(deltaX) * 0.2}px)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.15)}deg) translateX(${deltaX * 0.3}px) translateY(${deltaX * 0.2}px)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `rotate(${baseRot}deg) translateY(${deltaY * 0.4}px)`;
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
        
        const outer = activePeel.querySelector('.peel-shape');
        const inner = activePeel.querySelector('.peel-inner');

        // Bouncy snap back to flat rest state
        const snapTransition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        activePeel.style.transition = snapTransition + ", clip-path 0.3s ease";
        outer.style.transition = snapTransition;
        inner.style.transition = snapTransition;

        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
        activePeel.style.clipPath = "none";
        
        outer.style.transform = "rotateX(0deg) scaleY(1)";
        inner.style.transform = "rotateY(180deg) rotateX(0deg) scaleY(1)";

        const transientPeel = activePeel;
        setTimeout(() => {
            if (transientPeel && !transientPeel.classList.contains('peeled-away')) {
                transientPeel.style.transition = "";
                const tOuter = transientPeel.querySelector('.peel-shape');
                const tInner = transientPeel.querySelector('.peel-inner');
                if (tOuter) tOuter.style.transition = "";
                if (tInner) tInner.style.transition = "";
            }
        }, 400);
    }

    activePeel = null;
}

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    const direction = peel.dataset.direction;
    const baseRot = parseFloat(peel.dataset.baseRotation) || 0;

    // Fling away cleanly off layout bounds
    if (direction === 'left') {
        peel.style.transform = `rotate(${baseRot - 45}deg) translate(-160px, 160px) scale(0.05)`;
    } else if (direction === 'right') {
        peel.style.transform = `rotate(${baseRot + 45}deg) translate(160px, 160px) scale(0.05)`;
    } else {
        peel.style.transform = `rotate(${baseRot}deg) translateY(220px) scale(0.05)`;
    }

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
