// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SCROLL_SPEED = 0.5;
const FORCE_FORWARD_INTERVAL = 180;
const POWERUP_CHANCE = 0.1;
const POWERUP_BONUS = 50;

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

// Load sprites
const sprites = {
    cat: new Image(),
    carRed: new Image(),
    carBlue: new Image(),
    carYellow: new Image(),
    powerup: new Image(),
    tree: new Image()
};

let loadedSprites = 0;
const totalSprites = 6;

function onSpriteLoad() {
    loadedSprites++;
    if (loadedSprites === totalSprites) {
        document.getElementById('startScreen').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }
}

sprites.cat.onload = onSpriteLoad;
sprites.carRed.onload = onSpriteLoad;
sprites.carBlue.onload = onSpriteLoad;
sprites.carYellow.onload = onSpriteLoad;
sprites.powerup.onload = onSpriteLoad;
sprites.tree.onload = onSpriteLoad;

sprites.cat.src = 'assets/cat.png';
sprites.carRed.src = 'assets/car_red.png';
sprites.carBlue.src = 'assets/car_blue.png';
sprites.carYellow.src = 'assets/car_yellow.png';
sprites.powerup.src = 'assets/powerup.png';
sprites.tree.src = 'assets/tree.png';

// Game variables
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let highScore = 0;
let frameCount = 0;
let scrollOffset = 0;
let lastTimestamp = 0;

// Game objects
const cat = {
    width: 40,
    height: 40,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    speed: 4,
    color: '#666' // Temporary color until we add sprites
};

const roads = [];
const cars = [];
const powerups = [];

// Initialize game
function init() {
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
}

// Handle keyboard input
function handleKeyPress(event) {
    if (gameState === 'playing') {
        switch (event.key) {
            case 'ArrowLeft':
                if (cat.x > 0) {
                    cat.x -= cat.speed;
                    sounds.move().play();
                }
                break;
            case 'ArrowRight':
                if (cat.x < CANVAS_WIDTH - cat.width) {
                    cat.x += cat.speed;
                    sounds.move().play();
                }
                break;
        }
    }
}

// Spawn a new car
function spawnCar(roadY) {
    const speed = Math.random() * 1.5 + 1;
    const goingLeft = Math.random() < 0.5;
    return {
        x: goingLeft ? CANVAS_WIDTH : -60,
        y: roadY,
        speed: goingLeft ? -speed : speed,
        width: 60,
        height: 30,
        type: Math.floor(Math.random() * 3)
    };
}

// Update game state
function update() {
    if (gameState !== 'playing') return;

    // Scroll roads and spawn cars
    scrollOffset += SCROLL_SPEED;
    if (scrollOffset >= 60) {
        scrollOffset = 0;
        roads.pop();
        roads.unshift({
            y: roads[0].y - 60,
            hasPowerup: Math.random() < POWERUP_CHANCE,
            powerupX: Math.random() * (CANVAS_WIDTH - 30),
            powerupCollected: false
        });
        score++;
    }

    // Update roads
    roads.forEach(road => {
        road.y += SCROLL_SPEED;
        if (Math.random() < 0.005) {
            cars.push(spawnCar(road.y));
        }
    });

    // Update cars
    for (let i = cars.length - 1; i >= 0; i--) {
        cars[i].x += cars[i].speed;
        cars[i].y += SCROLL_SPEED;
        
        // Remove off-screen cars
        if (cars[i].x < -60 || cars[i].x > CANVAS_WIDTH || cars[i].y > CANVAS_HEIGHT) {
            cars.splice(i, 1);
            continue;
        }

        // Check for collision with cat
        if (checkCollision(cat, cars[i])) {
            gameOver();
            return;
        }
    }

    // Check for powerup collection
    roads.forEach(road => {
        if (road.hasPowerup && !road.powerupCollected) {
            const powerupRect = {
                x: road.powerupX,
                y: road.y,
                width: 30,
                height: 30
            };
            if (checkCollision(cat, powerupRect)) {
                road.powerupCollected = true;
                score += POWERUP_BONUS;
                sounds.collect().play();
            }
        }
    });

    // Force forward movement
    frameCount++;
    if (frameCount >= FORCE_FORWARD_INTERVAL) {
        frameCount = 0;
        cat.y -= cat.speed;
    }

    // Keep cat on screen
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
    // Clear canvas
    ctx.fillStyle = '#64C864';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw trees on both sides (decorative)
    for (let y = -scrollOffset % 100; y < CANVAS_HEIGHT; y += 100) {
        // Left side trees
        ctx.drawImage(sprites.tree, 20, y, 40, 40);
        ctx.drawImage(sprites.tree, 70, y + 50, 40, 40);
        
        // Right side trees
        ctx.drawImage(sprites.tree, CANVAS_WIDTH - 60, y, 40, 40);
        ctx.drawImage(sprites.tree, CANVAS_WIDTH - 110, y + 50, 40, 40);
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

        // Draw powerup
        if (road.hasPowerup && !road.powerupCollected) {
            ctx.drawImage(sprites.powerup, road.powerupX, road.y, 30, 30);
        }
    });

    // Draw cars
    cars.forEach(car => {
        const carSprite = [sprites.carRed, sprites.carBlue, sprites.carYellow][car.type];
        // Flip the car sprite if moving left
        if (car.speed < 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(carSprite, -car.x - car.width, car.y, car.width, car.height);
            ctx.restore();
        } else {
            ctx.drawImage(carSprite, car.x, car.y, car.width, car.height);
        }
    });

    // Draw cat
    ctx.drawImage(sprites.cat, cat.x, cat.y, cat.width, cat.height);

    // Draw Wonder Tools label
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('A Wonder Tools Game', 10, CANVAS_HEIGHT - 10);
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
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    highScore = Math.max(score, highScore);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOver').style.display = 'block';
    sounds.crash().play();
}

// Reset game
function resetGame() {
    score = 0;
    frameCount = 0;
    scrollOffset = 0;
    cat.x = CANVAS_WIDTH / 2;
    cat.y = CANVAS_HEIGHT - 120;
    roads.length = 0;
    cars.length = 0;
    for (let y = 0; y < CANVAS_HEIGHT + 60; y += 60) {
        roads.push({
            y: y,
            hasPowerup: Math.random() < POWERUP_CHANCE,
            powerupX: Math.random() * (CANVAS_WIDTH - 30),
            powerupCollected: false
        });
    }
    startGame();
}

// Initialize the game when the page loads
window.onload = init;
