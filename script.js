let peelsLeft = 3;
let startTime;
let timerInterval;
let gameActive = false;

// Dragging tracking variables
let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 80; // Pixels required to rip the peel off

// Initialize leaderboard on load
document.addEventListener("DOMContentLoaded", updateLeaderboardDOM);

const peels = document.querySelectorAll('.peel');

peels.forEach(peel => {
    peel.addEventListener('pointerdown', startDrag);
});

function startDrag(e) {
    if (peelsLeft === 0) return;
    
    // Start game timer on the very first interaction
    if (!gameActive && peelsLeft === 3) {
        startTimer();
    }

    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
    activePeel.setPointerCapture(e.pointerId); // Keeps tracking even if mouse leaves the element

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

    // Visual feedback: subtly tilt/move the peel as the user drags it
    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${Math.abs(deltaX)*0.5}px) rotate(${-15 + deltaX*0.3}deg)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${deltaX*0.5}px) rotate(${15 + deltaX*0.3}deg)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `translateY(${deltaY}px) scaleY(${1 - deltaY*0.002})`;
    }

    // Check if dragged far enough to complete the peel
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

    // If they let go without crossing the threshold, snap back to default
    if (activePeel && !activePeel.classList.contains('peeled-away')) {
        activePeel.style.cursor = 'grab';
        // Revert back to original CSS styles
        if (activePeel.classList.contains('left-peel')) activePeel.style.transform = 'rotate(-15deg)';
        else if (activePeel.classList.contains('right-peel')) activePeel.style.transform = 'rotate(15deg)';
        else activePeel.style.transform = 'none';
    }

    activePeel = null;
}

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    // Animate it flying completely away based on direction
    const direction = peel.dataset.direction;
    if (direction === 'left') peel.style.transform = 'translate(-200px, 150px) rotate(-90deg)';
    if (direction === 'right') peel.style.transform = 'translate(200px, 150px) rotate(90deg)';
    if (direction === 'down') peel.style.transform = 'translateY(200px) scaleY(0.1)';

    peelsLeft--;

    if (peelsLeft === 0) {
        endGame();
    }
    
    // Clean up drag events immediately for this peel
    activePeel = null;
}

function startTimer() {
    startTime = Date.now();
    gameActive = true;
    timerInterval = setInterval(() => {
        let elapsedTime = (Date.now() - startTime) / 1000;
        document.getElementById('timer').innerText = `Time: ${elapsedTime.toFixed(2)}s`;
    }, 10);
}

function endGame() {
    clearInterval(timerInterval);
    gameActive = false;
    let finalTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    
    document.getElementById('win-message').innerText = `Victory! Clean peel in ${finalTime}s!`;
    document.getElementById('reset-btn').style.display = 'inline-block';

    saveScore(finalTime);
}

// Leaderboard Logic using localStorage
function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('bananaScores')) || [];
    scores.push(score);
    // Sort ascending (lowest time is best)
    scores.sort((a, b) => a - b);
    // Keep top 5
    scores = scores.slice(0, 5);
    localStorage.setItem('bananaScores', JSON.stringify(scores));
    updateLeaderboardDOM();
}

function updateLeaderboardDOM() {
    const scoreList = document.getElementById('score-list');
    let scores = JSON.parse(localStorage.getItem('bananaScores')) || [];
    
    if (scores.length === 0) {
        scoreList.innerHTML = '<li>No scores yet!</li>';
        return;
    }

    scoreList.innerHTML = scores
        .map((score, index) => `<li><strong>${score.toFixed(2)}s</strong> ${index === 0 ? '👑' : ''}</li>`)
        .join('');
}

function resetGame() {
    peelsLeft = 3;
    gameActive = false;
    document.getElementById('timer').innerText = "Time: 0.00s";
    document.getElementById('win-message').innerText = "";
    document.getElementById('reset-btn').style.display = 'none';

    peels.forEach(peel => {
        peel.classList.remove('peeled-away');
        peel.style.cursor = 'grab';
        // Reset inline transforms
        if (peel.classList.contains('left-peel')) peel.style.transform = 'rotate(-15deg)';
        else if (peel.classList.contains('right-peel')) peel.style.transform = 'rotate(15deg)';
        else peel.style.transform = 'none';
    });
}
