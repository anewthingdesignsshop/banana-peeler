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

    const staticBase = document.createElement('div');
    staticBase.classList.add('static-base');

    const rollingFlap = document.createElement('div');
    rollingFlap.classList.add('rolling-flap');

    if (randomDir === 'down') {
        staticBase.style.background = "linear-gradient(90deg, #e0b20c 0%, #f5d742 30%, #fae366 70%, #dbad0b 100%)";
    }

    peel.appendChild(staticBase);
    peel.appendChild(rollingFlap);

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
    
    const base = activePeel.querySelector('.static-base');
    const flap = activePeel.querySelector('.rolling-flap');
    activePeel.style.transition = "";
    if (base) base.style.transition = "";
    if (flap) flap.style.transition = "";

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

    const base = activePeel.querySelector('.static-base');
    const flap = activePeel.querySelector('.rolling-flap');

    // Smooth pure 3D scaling loops (Keeps the organic silhouette completely intact!)
    const liveScaleY = 1 - (progress * 0.95); 
    const rollAngle = progress * 140; 

    if (base && flap) {
        if (direction === 'down') {
            base.style.transform = `rotateX(${rollAngle}deg) scaleY(${liveScaleY})`;
            flap.style.transform = `rotateY(180deg) rotateX(${rollAngle}deg) scaleY(${liveScaleY})`;
        } else {
            base.style.transform = `rotateX(${-rollAngle}deg) scaleY(${liveScaleY})`;
            flap.style.transform = `rotateY(180deg) rotateX(${-rollAngle}deg) scaleY(${liveScaleY})`;
        }
    }

    // Directional layout shifts
    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.08)}deg) translateX(${deltaX * 0.15}px) translateY(${Math.abs(deltaX) * 0.1}px)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.08)}deg) translateX(${deltaX * 0.15}px) translateY(${deltaX * 0.1}px)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `rotate(${baseRot}deg) translateY(${deltaY * 0.15}px)`;
    }

    if (
        (direction === 'left' && deltaX < -PEEL_THRESHOLD) ||
        (direction === 'right' && deltaX > PEEL_THRESHOLD) ||
        (direction === 'down' && deltaY > PEEL_THRESHOLD)
    ) {
        successfulPeel(e.pointerId);
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
        
        const base = activePeel.querySelector('.static-base');
        const flap = activePeel.querySelector('.rolling-flap');

        const snapTransition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        activePeel.style.transition = snapTransition;
        if (base) base.style.transition = snapTransition;
        if (flap) flap.style.transition = snapTransition;

        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
        
        if (base) base.style.transform = "rotateX(0deg) scaleY(1)";
        if (flap) flap.style.transform = "rotateY(180deg) rotateX(0deg) scaleY(1)";

        const transientPeel = activePeel;
        setTimeout(() => {
            if (transientPeel && !transientPeel.classList.contains('peeled-away')) {
                transientPeel.style.transition = "";
                const b = transientPeel.querySelector('.static-base');
                const f = transientPeel.querySelector('.rolling-flap');
                if (b) b.style.transition = "";
                if (f) f.style.transition = "";
            }
        }, 400);
    }

    activePeel = null;
}

function successfulPeel(pointerId) {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    try { peel.releasePointerCapture(pointerId); } catch(err) {}

    const direction = peel.dataset.direction;
    const baseRot = parseFloat(peel.dataset.baseRotation) || 0;

    if (direction === 'left') {
        peel.style.transform = `rotate(${baseRot - 35}deg) translate(-140px, 140px) scale(0.01)`;
    } else if (direction === 'right') {
        peel.style.transform = `rotate(${baseRot + 35}deg) translate(140px, 140px) scale(0.01)`;
    } else {
        peel.style.transform = `rotate(${baseRot}deg) translateY(200px) scale(0.01)`;
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
