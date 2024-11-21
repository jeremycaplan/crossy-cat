// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SCROLL_SPEED = 1;
const FORCE_FORWARD_INTERVAL = 120;
const POWERUP_CHANCE = 0.1;
const POWERUP_BONUS = 50;

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
                if (cat.x > 0) cat.x -= cat.speed;
                break;
            case 'ArrowRight':
                if (cat.x < CANVAS_WIDTH - cat.width) cat.x += cat.speed;
                break;
        }
    }
}

// Spawn a new car
function spawnCar(roadY) {
    const speed = Math.random() * 2 + 2; // Speed between 2 and 4
    const goingLeft = Math.random() < 0.5;
    return {
        x: goingLeft ? CANVAS_WIDTH : -60,
        y: roadY,
        speed: goingLeft ? -speed : speed,
        width: 60,
        height: 30,
        color: ['#ff0000', '#0000ff', '#ffff00'][Math.floor(Math.random() * 3)]
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
        if (Math.random() < 0.01) { // 1% chance to spawn a car
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

    // Draw roads
    roads.forEach(road => {
        // Draw road
        ctx.fillStyle = '#505050';
        ctx.fillRect(0, road.y, CANVAS_WIDTH, 40);
        
        // Draw road lines
        ctx.fillStyle = '#ffffff';
        for (let x = 0; x < CANVAS_WIDTH; x += 40) {
            ctx.fillRect(x, road.y + 18, 20, 4);
        }

        // Draw powerup
        if (road.hasPowerup && !road.powerupCollected) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(road.powerupX + 15, road.y + 15, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw cars
    cars.forEach(car => {
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);
    });

    // Draw cat
    ctx.fillStyle = cat.color;
    ctx.fillRect(cat.x, cat.y, cat.width, cat.height);
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
