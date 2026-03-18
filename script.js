const coin = document.getElementById('coin');
const flipBtn = document.getElementById('flip-btn');
const resultText = document.getElementById('result-text');
const headsCountEl = document.getElementById('heads-count');
const tailsCountEl = document.getElementById('tails-count');
const streakCountEl = document.getElementById('streak-count');

// Game State
let headsCount = 0;
let tailsCount = 0;
let currentStreak = 0;
let lastResult = null; // 'heads' or 'tails'
let isFlipping = false;
let rotationX = 0; 
let rotationY = 0;

// Audio synthesis for High-Tech sounds (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTechSound(type) {
    if(audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if(type === 'flip') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'result') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

// Stats from LocalStorage
function loadStats() {
    const saved = localStorage.getItem('whatYouTechStats');
    if (saved) {
        const stats = JSON.parse(saved);
        headsCount = stats.heads || 0;
        tailsCount = stats.tails || 0;
        currentStreak = stats.streak || 0;
        lastResult = stats.lastResult || null;
        updateStatsUI();
    }
}

function saveStats() {
    localStorage.setItem('whatYouTechStats', JSON.stringify({
        heads: headsCount,
        tails: tailsCount,
        streak: currentStreak,
        lastResult: lastResult
    }));
}

function updateStatsUI() {
    headsCountEl.textContent = headsCount;
    tailsCountEl.textContent = tailsCount;
    streakCountEl.textContent = currentStreak;
}

function initGame() {
    loadStats();
    
    // Add subtle ambient 3d movement on mousemove
    document.addEventListener('mousemove', (e) => {
        if(isFlipping) return;
        const panel = document.getElementById('game-panel');
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Gentle rotation for the coin
        const tiltX = (y / rect.height) * -20;
        const tiltY = (x / rect.width) * 20;
        
        // Combine base rotation with tilt
        coin.style.transform = `rotateY(${rotationY + tiltY}deg) rotateX(${tiltX}deg)`;
    });
    
    // Main flip action
    flipBtn.addEventListener('click', () => {
        if (isFlipping) return;
        
        isFlipping = true;
        flipBtn.disabled = true;
        flipBtn.textContent = 'EXECUTING PROTOCOL...';
        resultText.style.color = '#e2e8f0';
        resultText.style.textShadow = 'none';
        resultText.textContent = 'Computing Probabilities...';
        
        // Audio
        playTechSound('flip');
        
        let randomValue;
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            randomValue = array[0] / (0xffffffff + 1);
        } else {
            randomValue = Math.random();
        }
        
        const isHeads = randomValue > 0.5;
        const resultLabel = isHeads ? 'heads' : 'tails';
        
        // 5 to 10 full spins
        const fullSpins = Math.floor(Math.random() * 5) + 5;
        
        // Snap to base Y rotation so the animation is clean
        let currentRotationBase = Math.floor(rotationY / 360) * 360;
        let newRotationY = currentRotationBase + (fullSpins * 360);
        
        if (!isHeads) {
            newRotationY += 180;
        }
        
        rotationY = newRotationY;
        
        coin.style.transition = 'transform 3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        coin.style.transform = `rotateY(${rotationY}deg) rotateX(0deg)`;
        
        setTimeout(() => {
            handleFlipResult(isHeads, resultLabel);
        }, 3000);
    });
}

function handleFlipResult(isHeads, resultLabel) {
    playTechSound('result');
    
    if (isHeads) {
        headsCount++;
        resultText.textContent = 'HEADS ACQUIRED';
        resultText.style.color = 'var(--neon-cyan)';
        resultText.style.textShadow = '0 0 15px rgba(0, 243, 255, 0.5)';
    } else {
        tailsCount++;
        resultText.textContent = 'TAILS ACQUIRED';
        resultText.style.color = 'var(--neon-purple)';
        resultText.style.textShadow = '0 0 15px rgba(181, 33, 255, 0.5)';
    }
    
    if (lastResult === resultLabel) {
        currentStreak++;
    } else {
        currentStreak = 1;
        lastResult = resultLabel;
    }
    
    saveStats();
    updateStatsUI();
    
    isFlipping = false;
    flipBtn.disabled = false;
    flipBtn.textContent = 'INITIALIZE PROTOCOL';
    
    const targetStat = isHeads ? headsCountEl : tailsCountEl;
    targetStat.style.transform = 'scale(1.3)';
    setTimeout(() => {
        targetStat.style.transform = 'scale(1)';
    }, 200);
}

document.addEventListener('DOMContentLoaded', initGame);
