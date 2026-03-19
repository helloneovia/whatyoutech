// ===== GLOBAL STATE & UTILITIES =====

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTechSound(type, frequency = 400) {
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
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioCtx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
}

function createParticles() {
    const field = document.getElementById('particle-field');
    if (!field) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        field.appendChild(particle);
    }
}

// ===== NAVIGATION =====

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const gameContainers = document.querySelectorAll('.game-container');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const gameId = link.getAttribute('data-game');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show/hide game containers
            gameContainers.forEach(container => {
                if (container.getAttribute('data-game') === gameId) {
                    container.classList.remove('hidden');
                    playTechSound('click', 500);
                } else {
                    container.classList.add('hidden');
                }
            });
        });
    });
}

// ===== COIN TOSS GAME =====

class CoinTossGame {
    constructor() {
        this.coin = document.getElementById('coin');
        this.flipBtn = document.getElementById('flip-btn');
        this.resultText = document.getElementById('coin-result-text');
        this.headsCountEl = document.getElementById('heads-count');
        this.tailsCountEl = document.getElementById('tails-count');
        this.streakCountEl = document.getElementById('streak-count');
        
        this.headsCount = 0;
        this.tailsCount = 0;
        this.currentStreak = 0;
        this.lastResult = null;
        this.isFlipping = false;
        this.rotationY = 0;
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.flipBtn.addEventListener('click', () => this.flip());
        
        document.addEventListener('mousemove', (e) => {
            if(this.isFlipping) return;
            const panel = document.getElementById('coin-toss-game');
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const tiltX = (y / rect.height) * -20;
            const tiltY = (x / rect.width) * 20;
            
            this.coin.style.transform = `rotateY(${this.rotationY + tiltY}deg) rotateX(${tiltX}deg)`;
        });
    }
    
    loadStats() {
        const saved = localStorage.getItem('whatYouTechStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.headsCount = stats.heads || 0;
            this.tailsCount = stats.tails || 0;
            this.currentStreak = stats.streak || 0;
            this.lastResult = stats.lastResult || null;
            this.updateStatsUI();
        }
    }
    
    saveStats() {
        localStorage.setItem('whatYouTechStats', JSON.stringify({
            heads: this.headsCount,
            tails: this.tailsCount,
            streak: this.currentStreak,
            lastResult: this.lastResult
        }));
    }
    
    updateStatsUI() {
        this.headsCountEl.textContent = this.headsCount;
        this.tailsCountEl.textContent = this.tailsCount;
        this.streakCountEl.textContent = this.currentStreak;
    }
    
    flip() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.flipBtn.disabled = true;
        this.flipBtn.textContent = 'EXECUTING PROTOCOL...';
        this.resultText.style.color = '#e2e8f0';
        this.resultText.style.textShadow = 'none';
        this.resultText.textContent = 'Computing Probabilities...';
        
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
        const fullSpins = Math.floor(Math.random() * 5) + 5;
        
        let currentRotationBase = Math.floor(this.rotationY / 360) * 360;
        let newRotationY = currentRotationBase + (fullSpins * 360);
        
        if (!isHeads) {
            newRotationY += 180;
        }
        
        this.rotationY = newRotationY;
        
        this.coin.style.transition = 'transform 3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.coin.style.transform = `rotateY(${this.rotationY}deg) rotateX(0deg)`;
        
        setTimeout(() => {
            this.handleResult(isHeads);
        }, 3000);
    }
    
    handleResult(isHeads) {
        playTechSound('result', isHeads ? 600 : 400);
        
        if (isHeads) {
            this.headsCount++;
            this.resultText.textContent = 'HEADS ACQUIRED';
            this.resultText.style.color = 'var(--neon-cyan)';
            this.resultText.style.textShadow = '0 0 15px rgba(0, 243, 255, 0.5)';
        } else {
            this.tailsCount++;
            this.resultText.textContent = 'TAILS ACQUIRED';
            this.resultText.style.color = 'var(--neon-purple)';
            this.resultText.style.textShadow = '0 0 15px rgba(181, 33, 255, 0.5)';
        }
        
        const resultLabel = isHeads ? 'heads' : 'tails';
        if (this.lastResult === resultLabel) {
            this.currentStreak++;
        } else {
            this.currentStreak = 1;
            this.lastResult = resultLabel;
        }
        
        this.saveStats();
        this.updateStatsUI();
        
        this.isFlipping = false;
        this.flipBtn.disabled = false;
        this.flipBtn.textContent = 'INITIALIZE PROTOCOL';
        
        const targetStat = isHeads ? this.headsCountEl : this.tailsCountEl;
        targetStat.style.transform = 'scale(1.3)';
        setTimeout(() => {
            targetStat.style.transform = 'scale(1)';
        }, 200);
    }
}

// ===== CYBER DICE GAME =====

class CyberDiceGame {
    constructor() {
        this.dice1 = document.getElementById('dice-1');
        this.dice2 = document.getElementById('dice-2');
        this.diceBtn = document.getElementById('dice-btn');
        this.resultText = document.getElementById('dice-result-text');
        this.totalEl = document.getElementById('dice-total');
        this.rollsEl = document.getElementById('dice-rolls');
        this.avgEl = document.getElementById('dice-avg');
        
        this.totalSum = 0;
        this.rollCount = 0;
        this.isRolling = false;
        this.results = [];
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.diceBtn.addEventListener('click', () => this.roll());
    }
    
    loadStats() {
        const saved = localStorage.getItem('whatYouTechDiceStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.totalSum = stats.totalSum || 0;
            this.rollCount = stats.rollCount || 0;
            this.results = stats.results || [];
            this.updateStatsUI();
        }
    }
    
    saveStats() {
        localStorage.setItem('whatYouTechDiceStats', JSON.stringify({
            totalSum: this.totalSum,
            rollCount: this.rollCount,
            results: this.results
        }));
    }
    
    updateStatsUI() {
        this.totalEl.textContent = this.totalSum;
        this.rollsEl.textContent = this.rollCount;
        const avg = this.rollCount > 0 ? (this.totalSum / this.rollCount).toFixed(1) : 0;
        this.avgEl.textContent = avg;
    }
    
    roll() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.diceBtn.disabled = true;
        this.diceBtn.textContent = 'ROLLING...';
        this.resultText.textContent = 'Calculating...';
        this.resultText.style.color = '#e2e8f0';
        
        playTechSound('flip');
        
        // Animate dice rolling
        const rollDuration = 0.8;
        const startTime = Date.now();
        
        const animateRoll = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed < rollDuration) {
                const randomRotX = Math.random() * 720;
                const randomRotY = Math.random() * 720;
                const randomRotZ = Math.random() * 720;
                
                this.dice1.style.transform = `rotateX(${randomRotX}deg) rotateY(${randomRotY}deg) rotateZ(${randomRotZ}deg)`;
                this.dice2.style.transform = `rotateX(${randomRotX * 1.3}deg) rotateY(${randomRotY * 0.7}deg) rotateZ(${randomRotZ * 1.1}deg)`;
                
                requestAnimationFrame(animateRoll);
            } else {
                this.finishRoll();
            }
        };
        
        animateRoll();
    }
    
    finishRoll() {
        const value1 = Math.floor(Math.random() * 6) + 1;
        const value2 = Math.floor(Math.random() * 6) + 1;
        const total = value1 + value2;
        
        // Set final rotation to show the correct face
        const rotations = [
            { x: 0, y: 0 },      // 1
            { x: 0, y: 180 },    // 2
            { x: 0, y: 90 },     // 3
            { x: 0, y: -90 },    // 4
            { x: 90, y: 0 },     // 5
            { x: -90, y: 0 }     // 6
        ];
        
        const rot1 = rotations[value1 - 1];
        const rot2 = rotations[value2 - 1];
        
        this.dice1.style.transition = 'transform 0.5s ease-out';
        this.dice2.style.transition = 'transform 0.5s ease-out';
        
        this.dice1.style.transform = `rotateX(${rot1.x}deg) rotateY(${rot1.y}deg)`;
        this.dice2.style.transform = `rotateX(${rot2.x}deg) rotateY(${rot2.y}deg)`;
        
        setTimeout(() => {
            playTechSound('result', 500 + (total * 50));
            
            this.totalSum += total;
            this.rollCount++;
            this.results.push(total);
            
            this.resultText.textContent = `TOTAL: ${total}`;
            this.resultText.style.color = 'var(--neon-green)';
            this.resultText.style.textShadow = '0 0 15px rgba(57, 255, 20, 0.5)';
            
            this.saveStats();
            this.updateStatsUI();
            
            this.isRolling = false;
            this.diceBtn.disabled = false;
            this.diceBtn.textContent = 'ROLL PROTOCOL';
            
            this.dice1.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            this.dice2.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, 500);
    }
}

// ===== NEURAL ROULETTE GAME =====

class NeuralRouletteGame {
    constructor() {
        this.wheel = document.getElementById('roulette-wheel');
        this.rouletteBtn = document.getElementById('roulette-btn');
        this.resultText = document.getElementById('roulette-result-text');
        this.resultEl = document.getElementById('roulette-result');
        this.spinsEl = document.getElementById('roulette-spins');
        this.winsEl = document.getElementById('roulette-wins');
        
        this.spinCount = 0;
        this.winCount = 0;
        this.isSpinning = false;
        this.currentRotation = 0;
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.rouletteBtn.addEventListener('click', () => this.spin());
    }
    
    loadStats() {
        const saved = localStorage.getItem('whatYouTechRouletteStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.spinCount = stats.spinCount || 0;
            this.winCount = stats.winCount || 0;
            this.updateStatsUI();
        }
    }
    
    saveStats() {
        localStorage.setItem('whatYouTechRouletteStats', JSON.stringify({
            spinCount: this.spinCount,
            winCount: this.winCount
        }));
    }
    
    updateStatsUI() {
        this.spinsEl.textContent = this.spinCount;
        this.winsEl.textContent = this.winCount;
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.rouletteBtn.disabled = true;
        this.rouletteBtn.textContent = 'SPINNING...';
        this.resultText.textContent = 'Neural Network Processing...';
        this.resultText.style.color = '#e2e8f0';
        
        playTechSound('flip');
        
        // Random spins (3-8 full rotations)
        const fullSpins = Math.floor(Math.random() * 5) + 3;
        const extraRotation = Math.random() * 360;
        const totalRotation = fullSpins * 360 + extraRotation;
        
        this.currentRotation += totalRotation;
        
        this.wheel.style.transition = 'transform 3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.wheel.style.transform = `rotate(${this.currentRotation}deg)`;
        
        setTimeout(() => {
            this.finishSpin();
        }, 3000);
    }
    
    finishSpin() {
        // Determine which segment is at the top (0-7)
        const normalizedRotation = ((this.currentRotation % 360) + 360) % 360;
        const segmentIndex = Math.floor((normalizedRotation + 22.5) / 45) % 8;
        const result = segmentIndex + 1;
        
        // Win if result is even
        const isWin = result % 2 === 0;
        
        playTechSound('result', 400 + (result * 100));
        
        this.spinCount++;
        if (isWin) {
            this.winCount++;
        }
        
        this.resultText.textContent = `RESULT: ${result}`;
        this.resultEl.textContent = result;
        
        if (isWin) {
            this.resultText.style.color = 'var(--neon-green)';
            this.resultText.style.textShadow = '0 0 15px rgba(57, 255, 20, 0.5)';
        } else {
            this.resultText.style.color = 'var(--neon-purple)';
            this.resultText.style.textShadow = '0 0 15px rgba(181, 33, 255, 0.5)';
        }
        
        this.saveStats();
        this.updateStatsUI();
        
        this.isSpinning = false;
        this.rouletteBtn.disabled = false;
        this.rouletteBtn.textContent = 'SPIN NEURAL NET';
        
        this.wheel.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupNavigation();
    
    const coinGame = new CoinTossGame();
    const diceGame = new CyberDiceGame();
    const rouletteGame = new NeuralRouletteGame();
});
