// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SCROLL_SPEED = 0.5;
const FORCE_FORWARD_INTERVAL = 180;
const POWERUP_CHANCE = 0.1;
const POWERUP_BONUS = 50;
const MAX_SHIELDS = 3;
const SPEED_MULTIPLIER = 2;
const REPOSITION_SHIELD_DURATION = 2000; // 2 seconds of protection

// Create sound effects using AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createBeep(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        }
    };
}

const sounds = {
    collect: () => createBeep(880, 0.1),
    crash: () => createBeep(150, 0.2, 'sawtooth'),
    move: () => createBeep(440, 0.05)
};

// Game variables
let canvas, ctx;
let gameState = 'start';
let score = 0;
let highScore = 0;
let frameCount = 0;
let scrollOffset = 0;
let lastTimestamp = 0;
let shields = MAX_SHIELDS;
let keyPressCount = {};
let lastKeyPressTime = {};
let playerName = '';
let previousScore = 0;

// Encouraging messages for when player doesn't beat their previous score
const encouragingMessages = [
    "You're getting better! Keep going!",
    "So close! Give it another shot!",
    "Practice makes perfect! Try again!",
    "You've got this! One more try!",
    "Almost there! Keep pushing!",
    "Don't give up! You're improving!",
    "That was a good run! Try again!",
    "Keep that momentum going!",
    "You're learning the patterns! Next time!",
    "Every attempt makes you stronger!"
];

// Game objects
const cat = {
    width: 30,
    height: 30,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    speed: 4,
    color: '#FFD700', // Gold color for the cat
    isShielded: false,
    hasRepositionShield: false
};

const roads = [];
const cars = [];
const powerups = [];

// Initialize game
function init() {
    console.log('Initializing game...');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize roads
    for (let y = 0; y < CANVAS_HEIGHT + 60; y += 60) {
        roads.push({
            y: y,
            hasPowerup: Math.random() < POWERUP_CHANCE,
            powerupX: Math.random() * (CANVAS_WIDTH - 30),
            powerupCollected: false
        });
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    // Hide loading screen and show start screen immediately
    document.getElementById('loading').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    
    console.log('Game initialized successfully');
}

// Handle keyboard input
function handleKeyPress(event) {
    if (gameState === 'playing') {
        const currentTime = Date.now();
        const key = event.key;
        
        // Initialize or update key press tracking
        if (!lastKeyPressTime[key]) {
            lastKeyPressTime[key] = currentTime;
            keyPressCount[key] = 1;
        } else if (currentTime - lastKeyPressTime[key] < 200) { // Within 200ms
            keyPressCount[key]++;
            lastKeyPressTime[key] = currentTime;
        } else {
            keyPressCount[key] = 1;
            lastKeyPressTime[key] = currentTime;
        }
        
        // Calculate speed based on rapid key presses
        const baseSpeed = cat.speed;
        const speed = keyPressCount[key] >= 3 ? baseSpeed * SPEED_MULTIPLIER : baseSpeed;
        
        switch (key) {
            case 'ArrowLeft':
                cat.x -= speed;
                sounds.move().play();
                break;
            case 'ArrowRight':
                cat.x += speed;
                sounds.move().play();
                break;
            case 'ArrowUp':
                cat.y = Math.max(cat.y - speed, 0);
                sounds.move().play();
                break;
            case 'ArrowDown':
                cat.y = Math.min(cat.y + speed, CANVAS_HEIGHT - cat.height);
                sounds.move().play();
                break;
            case ' ': // Spacebar activates shield
                if (shields > 0 && !cat.isShielded) {
                    cat.isShielded = true;
                    cat.hasRepositionShield = false; // Regular shield activation
                    shields--;
                    setTimeout(() => {
                        if (!cat.hasRepositionShield) { // Only remove if not a reposition shield
                            cat.isShielded = false;
                        }
                    }, 3000);
                }
                break;
        }
        cat.x = Math.min(Math.max(120, cat.x), CANVAS_WIDTH - 120 - cat.width);
    } else if (event.key === 'Enter' && gameState === 'start') {
        startGame();
    }
}

// Spawn a new car
function spawnCar(roadY) {
    const speed = 0.5 + Math.random() * 1;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const x = direction === 1 ? -50 : CANVAS_WIDTH + 50;
    const carColors = ['#FF0000', '#0000FF', '#FFFF00']; // Red, Blue, Yellow
    
    cars.push({
        x: x,
        y: roadY,
        width: 50,
        height: 30,
        speed: speed * direction,
        color: carColors[Math.floor(Math.random() * carColors.length)]
    });
}

// Update game state
function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    scrollOffset += SCROLL_SPEED;
    
    // Force forward movement periodically
    if (frameCount % (FORCE_FORWARD_INTERVAL * 1.5) === 0) {
        cat.y -= 30;
        score += 10;
        
        // If cat is too high, move everything down and activate temporary shield
        if (cat.y < CANVAS_HEIGHT / 4) {
            const offset = CANVAS_HEIGHT / 3 - cat.y;
            cat.y += offset;
            
            // Move all game objects down
            cars.forEach(car => car.y += offset);
            roads.forEach(road => road.y += offset);
            
            // Activate temporary shield without using player's shields
            if (!cat.isShielded) {
                cat.isShielded = true;
                cat.hasRepositionShield = true; // Flag to not count this shield usage
                setTimeout(() => {
                    if (cat.hasRepositionShield) { // Only remove shield if it was from repositioning
                        cat.isShielded = false;
                        cat.hasRepositionShield = false;
                    }
                }, REPOSITION_SHIELD_DURATION);
            }
        }
    }
    
    // Update roads and spawn cars
    roads.forEach((road, index) => {
        road.y = ((index * 60 + scrollOffset) % (CANVAS_HEIGHT + 60)) - 60;
        
        if (road.y >= -60 && road.y <= CANVAS_HEIGHT && Math.random() < 0.002) {
            spawnCar(road.y);
        }
    });
    
    // Update cars
    cars.forEach((car, index) => {
        car.x += car.speed;
        
        // Remove cars that are off screen
        if (car.x < -100 || car.x > CANVAS_WIDTH + 100) {
            cars.splice(index, 1);
        }
        
        // Check for collision with cat
        if (checkCollision(cat, car)) {
            if (cat.isShielded) {
                // Just remove the car if shielded
                cars.splice(index, 1);
                sounds.collect().play();
            } else {
                sounds.crash().play();
                gameOver();
            }
        }
    });
    
    // Check for powerup collection
    roads.forEach(road => {
        if (road.hasPowerup && !road.powerupCollected) {
            const powerup = {
                x: road.powerupX,
                y: road.y,
                width: 30,
                height: 30
            };
            
            if (checkCollision(cat, powerup)) {
                road.powerupCollected = true;
                score += POWERUP_BONUS;
                sounds.collect().play();
            }
        }
    });
    
    // Keep cat within bounds
    cat.x = Math.min(Math.max(120, cat.x), CANVAS_WIDTH - 120 - cat.width);
    cat.y = Math.min(Math.max(0, cat.y), CANVAS_HEIGHT - cat.height);
    
    // Update score display
    document.getElementById('score').textContent = `Score: ${score}`;
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Draw game objects
function draw() {
    // Clear canvas with grass color
    ctx.fillStyle = '#64C864';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw decorative trees (simple triangles)
    for (let y = -scrollOffset % 100; y < CANVAS_HEIGHT; y += 100) {
        // Left side trees
        ctx.fillStyle = '#006400';
        drawTree(20, y);
        drawTree(70, y + 50);
        
        // Right side trees
        drawTree(CANVAS_WIDTH - 60, y);
        drawTree(CANVAS_WIDTH - 110, y + 50);
    }

    // Draw roads
    roads.forEach(road => {
        // Draw road
        ctx.fillStyle = '#505050';
        ctx.fillRect(120, road.y, CANVAS_WIDTH - 240, 40);
        
        // Draw road lines
        ctx.fillStyle = '#ffffff';
        for (let x = 120; x < CANVAS_WIDTH - 240; x += 40) {
            ctx.fillRect(x, road.y + 18, 20, 4);
        }

        // Draw powerup (star)
        if (road.hasPowerup && !road.powerupCollected) {
            drawStar(road.powerupX + 15, road.y + 15, 5, 15, 7, '#FFD700');
        }
    });

    // Draw cars
    cars.forEach(car => {
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y + 5, car.width, car.height - 10);
        
        // Add simple car details
        ctx.fillStyle = '#000000';
        if (car.speed > 0) {
            ctx.fillRect(car.x + car.width - 10, car.y + 8, 5, car.height - 16);
        } else {
            ctx.fillRect(car.x + 5, car.y + 8, 5, car.height - 16);
        }
    });

    // Draw cat
    if (cat.isShielded) {
        // Draw shield effect
        ctx.beginPath();
        ctx.arc(cat.x + cat.width/2, cat.y + cat.height/2, cat.width * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    ctx.fillStyle = cat.color;
    ctx.fillRect(cat.x, cat.y, cat.width, cat.height);
    
    // Add simple cat details (ears)
    ctx.beginPath();
    ctx.moveTo(cat.x, cat.y);
    ctx.lineTo(cat.x + 10, cat.y - 10);
    ctx.lineTo(cat.x + 20, cat.y);
    ctx.fill();

    // Draw Wonder Tools label
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('A Wonder Tools Game', 10, CANVAS_HEIGHT - 10);
    
    // Draw score and shields in top-right corner
    ctx.font = 'bold 24px Arial';
    ctx.lineWidth = 3;
    
    // Draw shield counter with icon
    const shieldText = `🛡️ ${shields}`;
    ctx.fillStyle = '#00FFFF';
    ctx.strokeStyle = '#000000';
    ctx.strokeText(shieldText, CANVAS_WIDTH - 280, 30);
    ctx.fillText(shieldText, CANVAS_WIDTH - 280, 30);
    
    // Draw score
    const scoreText = `Score: ${score}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.strokeText(scoreText, CANVAS_WIDTH - 150, 30);
    ctx.fillText(scoreText, CANVAS_WIDTH - 150, 30);
}

// Draw a simple tree
function drawTree(x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y + 40);
    ctx.lineTo(x + 20, y);
    ctx.lineTo(x + 40, y + 40);
    ctx.fill();
}

// Draw a star shape
function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for(let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Game loop
function gameLoop(timestamp) {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    update();
    draw();

    if (gameState === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

// Start game
function startGame() {
    playerName = document.getElementById('playerName').value.trim() || 'Player';
    previousScore = score;
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    const wasHighScore = score > highScore;
    const beatPreviousScore = score > previousScore && previousScore > 0; // Only count if previous score exists
    highScore = Math.max(score, highScore);
    
    let message = '';
    if (wasHighScore) {
        message = `🎉 Congratulations ${playerName}! New high score: ${score}! 🏆`;
    } else if (beatPreviousScore) {
        message = `Well done ${playerName}! You beat your previous score of ${previousScore}! 🌟`;
    } else {
        message = `${encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]} ${playerName}!`;
    }
    
    document.getElementById('gameOverMessage').textContent = message;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOver').style.display = 'block';
}

// Reset game
function resetGame() {
    // Reset game state
    score = 0;
    frameCount = 0;
    scrollOffset = 0;
    lastTimestamp = 0;
    shields = MAX_SHIELDS;
    keyPressCount = {};
    lastKeyPressTime = {};
    
    // Reset cat position and state
    cat.x = CANVAS_WIDTH / 2;
    cat.y = CANVAS_HEIGHT - 120;
    cat.isShielded = false;
    cat.hasRepositionShield = false;
    
    // Clear arrays
    roads.length = 0;
    cars.length = 0;
    powerups.length = 0;
    
    // Initialize roads
    for (let y = 0; y < CANVAS_HEIGHT + 60; y += 60) {
        roads.push({
            y: y,
            hasPowerup: Math.random() < POWERUP_CHANCE,
            powerupX: Math.random() * (CANVAS_WIDTH - 30),
            powerupCollected: false
        });
    }
    
    // Start game
    startGame();
}

// Initialize the game when the page loads
window.onload = init;
