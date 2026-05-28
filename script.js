// ... Keep all your existing dragging variables, event listeners, and startTimer logic exactly the same ...

function successfulPeel() {
    const peel = activePeel;
    peel.classList.add('peeled-away');
    
    const direction = peel.dataset.direction;
    // Dramatic peeling away animations
    if (direction === 'left') peel.style.transform = 'translate(-150px, 100px) rotate(-140deg)';
    if (direction === 'right') peel.style.transform = 'translate(150px, 100px) rotate(140deg)';
    if (direction === 'down') peel.style.transform = 'translateY(180px) scaleY(0.2)';

    peelsLeft--;

    if (peelsLeft === 0) {
        endGame();
    }
    
    activePeel = null;
}

function stopDrag(e) {
    if (!activePeel) return;

    activePeel.releasePointerCapture(e.pointerId);
    activePeel.removeEventListener('pointermove', drag);
    activePeel.removeEventListener('pointerup', stopDrag);

    if (activePeel && !activePeel.classList.contains('peeled-away')) {
        activePeel.style.cursor = 'grab';
        // Reset smoothly back to the custom banana shape starting posture
        if (activePeel.classList.contains('left-peel')) activePeel.style.transform = 'rotate(-5deg)';
        else if (activePeel.classList.contains('right-peel')) activePeel.style.transform = 'rotate(5deg)';
        else activePeel.style.transform = 'none';
    }

    activePeel = null;
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
        if (peel.classList.contains('left-peel')) peel.style.transform = 'rotate(-5deg)';
        else if (peel.classList.contains('right-peel')) peel.style.transform = 'rotate(5deg)';
        else peel.style.transform = 'none';
    });
}

// ... Keep the saveScore and updateLeaderboard DOM logic down at the bottom ...
