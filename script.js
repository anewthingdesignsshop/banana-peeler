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

    // BUILD CHAINED SKELETON
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
            rootSegment = segment;
        } else {
            parentSegment.appendChild(segment);
        }
        parentSegment = segment;
    }

    peel.appendChild(rootSegment);

    // Strict alignment micro-rotations to keep everything locked in the banana silhouette
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
    setTreeTransitions(activePeel, "");

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

    // Distributed Joint Physics: Curvature math applied down the spine hierarchy chain
    // Segment 1 (base) rotates less, while segments 2-5 curl progressively further
    const segmentTargetRotX = progress * -35; 
    const segments = activePeel.querySelectorAll('.peel-segment');

    segments.forEach((seg) => {
        if (direction === 'down') {
            seg.style.transform = `rotateX(${progress * 35}deg)`;
        } else {
            // Check if it's the root segment (seg-1) to reduce base translation tilt
            if (seg.classList.contains('seg-1')) {
                seg.style.transform = `rotateX(${segmentTargetRotX * 0.5}deg)`;
            } else {
                seg.style.transform = `translateY(-100%) rotateX(${segmentTargetRotX}deg)`;
            }
        }
    });

    const liveTranslateY = progress * 15;

    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.08)}deg) translateY(${liveTranslateY}px) translateX(${deltaX * 0.1}px)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `rotate(${baseRot + (deltaX * 0.08)}deg) translateY(${liveTranslateY}px) translateX(${deltaX * 0.1}px)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `rotate(${baseRot}deg) translateY(${deltaY * 0.25}px)`;
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
        
        setTreeTransitions(activePeel, "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)");
        
        const baseRot = activePeel.dataset.baseRotation;
        activePeel.style.transform = `rotate(${baseRot}deg)`;
        
        const segments = activePeel.querySelectorAll('.peel-segment');
        segments.forEach(seg => {
            if (seg.classList.contains('seg-1')) {
                seg.style.transform = "rotateX(0deg)";
            } else {
                seg.style.transform = "translateY(-100%) rotateX(0deg)";
            }
        });

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

    const segments = peel.querySelectorAll('.peel-segment');
    segments.forEach(seg => {
        seg.style.transition = "transform 0.5s ease-in !important";
        const rotVal = (direction === 'down') ? "rotateX(55deg)" : "rotateX(-55deg)";
        if (seg.classList.contains('seg-1')) {
            seg.style.transform = rotVal;
        } else {
            seg.style.transform = `translateY(-100%) ${rotVal}`;
        }
    });

    if (direction === 'left') {
        peel.style.transform = `rotate(${baseRot - 25}deg) translate(-70px, 100px) scale(0.05)`;
    } else if (direction === 'right') {
        peel.style.transform = `rotate(${baseRot + 25}deg) translate(70px, 100px) scale(0.05)`;
    } else {
        peel.style.transform = `rotate(${baseRot}deg) translateY(160px) scale(0.05)`;
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
