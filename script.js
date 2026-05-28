let currentLevel = 1;
const maxLevels = 20;

let totalPeelsNeeded = 3; 
let visiblePeelsCount = 0; 

let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 85;

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

    // BUILD NESTED 3D JOINT SKELETON TREE
    let rootSegment = null;
    let parentSegment = null;

    for (let i = 1; i <= 5; i++) {
        const segment = document.createElement('div');
        segment.classList.add('peel-segment', `seg-${i}`);

        const shapeOuter = document.createElement('div');
        shapeOuter.classList.add('peel-shape');

        const shapeInner = document.createElement('div');
        shapeInner.classList.add('peel-inner');

        if (randomDir === 'down') {
            shapeOuter.style.background = "linear-gradient(90deg, #e0b20c 0%, #f5d742 30%, #fae366 70%, #dbad0b 100%)";
        }

        segment.appendChild(shapeOuter);
        segment.appendChild(shapeInner);

        if (i === 1) {
            rootSegment = segment; // Bottom Hinge base linked directly to container
        } else {
            parentSegment.appendChild(segment); // Nest deeper to inherit cascading rotations
        }
        parentSegment = segment;
    }

    peel.appendChild(rootSegment);

    // Apply strict clean stacking micro-rotations
    let randomRotation = (Math.random() * 6) - 3; 
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
    setTreeTransitions(activePeel, ""); // Strip old animations for direct tracking response

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

    // Distributed Joint Physics: Each segment curls back up to -38 degrees.
    // Combined across 5 joints, this creates a beautiful, circular 190-degree spiral loop!
    const segmentTargetRotX = progress * -38; 
    const segments = activePeel.querySelectorAll('.peel-segment');

    segments.forEach((seg) => {
        // Front peel curls forward (+X), side peels curl backward (-X)
        if (direction === 'down') {
            seg.style.transform = `rotateX(${progress * 38}deg)`;
        } else {
            seg.style.transform = `rotateX(${segmentTargetRotX}deg)`;
        }
    });

    // Translate the anchor point slightly downward as it rolls down the core
    const liveTranslateY = progress * 20;

    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.1)}deg) translateY(${liveTranslateY}px) translateX(${deltaX * 0.1}px)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.1)}deg) translateY(${liveTranslateY}px) translateX(${deltaX * 0.1}px)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `rotate(${baseRot}deg) translateY(${deltaY * 0.3}px)`;
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
        
        // Snap-back animation curves on release
        setTreeTransitions(activePeel, "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2);");
        
        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
        
        const segments = activePeel.querySelectorAll('.peel-segment');
        segments.forEach(seg => seg.style.transform = "rotateX(0deg)");

        const transientPeel = activePeel;
        setTimeout(() => {
            if (transientPeel && !transientPeel.classList.contains('peeled-away')) {
                setTreeTransitions(transientPeel, "");
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

    // Direct skeletal roll down to the base roots before vanishing
    const segments = peel.querySelectorAll('.peel-segment');
    segments.forEach(seg => {
        seg.style.transition = "transform 0.5s ease-in !important";
        seg.style.transform = (direction === 'down') ? "rotateX(60deg)" : "rotateX(-60deg)";
    });

    if (direction === 'left') {
        peel.style.transform = `rotate(${baseRot - 30}deg) translate(-80px, 120px) scale(0.1)`;
    } else if (direction === 'right') {
        peel.style.transform = `rotate(${baseRot + 30}deg) translate(80px, 120px) scale(0.1)`;
    } else {
        peel.style.transform = `rotate(${baseRot}deg) translateY(180px) scale(0.1)`;
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

// Helper to inject transitions smoothly down the skeleton node tree
function setTreeTransitions(peelElement, transitionValue) {
    peelElement.style.transition = transitionValue;
    const segments = peelElement.querySelectorAll('.peel-segment');
    segments.forEach(seg => seg.style.transition = transitionValue);
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
