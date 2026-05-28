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
    
    const base = activePeel.querySelector('.peel-shape');
    const flap = activePeel.querySelector('.peel-inner');
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

    const base = activePeel.querySelector('.peel-shape');
    const flap = activePeel.querySelector('.peel-inner');

    const liveScaleY = 1 - (progress * 0.95); 
    const rollAngle = progress * 140; 

    if (base && flap) {
        if (direction === 'down') {
            base.style.transform = `rotateX(${rollAngle}deg) scaleY(${liveScaleY})`;
