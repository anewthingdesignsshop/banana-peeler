let peelsLeft = 3;
let startTime;
let timerInterval;
let gameActive = false;

let activePeel = null;
let startX = 0;
let startY = 0;
const PEEL_THRESHOLD = 80;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    updateLeaderboardDOM();
    
    // Bind events after DOM is fully ready
    const peels = document.querySelectorAll('.peel');
    peels.forEach(peel => {
        peel.addEventListener('pointerdown', startDrag);
    });
});

function startDrag(e) {
    if (peelsLeft === 0) return;
    
    if (!gameActive && peelsLeft === 3) {
        startTimer();
    }

    activePeel = e.currentTarget;
    activePeel.style.cursor = 'grabbing';
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

    if (direction === 'left' && deltaX < 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${Math.abs(deltaX)*0.5}px) rotate(${-5 + deltaX*0.3}deg)`;
    } else if (direction === 'right' && deltaX > 0) {
        activePeel.style.transform = `translate(${deltaX}px, ${deltaX*0.5}px) rotate(${5 + deltaX*0.3}deg)`;
    } else if (direction === 'down' && deltaY > 0) {
        activePeel.style.transform = `translateY(${deltaY}px) scaleY(${1 - deltaY*0.002})`;
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
        if (activePeel.classList.contains('left-peel')) activePeel.style.transform = 'rotate(-5deg)';
        else if (activePeel.classList.contains('right-peel')) activePeel.style.transform = 'rotate(5deg)';
        else activePeel.style.transform = 'none';
    }

    activePeel = null;
}

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    const direction = peel.dataset.direction;
    if (direction === 'left') peel.style.transform = 'translate(-150px, 100px) rotate(-140deg)';
    if (direction === 'right') peel.style.transform = 'translate(150px, 100px) rotate(140deg)';
    if (direction === 'down') peel.style.transform = 'translateY(180px) scaleY(0.2)';

    peelsLeft--;

    if (peelsLeft === 0) {
        endGame();
    }
    
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

function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('bananaScores')) || [];
    scores.push(score);
    scores.sort((a, b) => a - b);
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

    const peels = document.querySelectorAll('.peel');
    peels.forEach(peel => {
        peel.classList.remove('peeled-away');
        peel.style.cursor = 'grab';
        if (peel.classList.contains('left-peel')) peel.style.transform = 'rotate(-5deg)';
        else if (peel.classList.contains('right-peel')) peel.style.transform = 'rotate(5deg)';
        else peel.style.transform = 'none';
    });
}
