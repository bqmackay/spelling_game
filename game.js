const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const words = ['apple'];
const imageBase = 'images/'; 

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game constants
const PLAYER_SIZE = 20;
const ENEMY_SIZE = 15;
const HEALTH_BOX_SIZE = 15;
const ARENA_SIZE = PLAYER_SIZE * 100;
const PLAYER_SPEED = 5;
const ENEMY_SPEED = 2;
const MAX_HEALTH = 10;
const HEALTH_BOX_SPAWN_INTERVAL = 10000; // 10 seconds
const PROJECTILE_SIZE = PLAYER_SIZE / 2;
const PROJECTILE_SPEED = 3;
const SHOOT_INTERVAL = 1000; // 1 second

// Game objects
const player = {
    x: ARENA_SIZE / 2,
    y: ARENA_SIZE / 2,
    size: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    health: MAX_HEALTH
};

const enemies = [];
let healthBox = null;
const projectiles = [];

// Camera
const camera = {
    x: 0,
    y: 0
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Add these new variables
let gameOver = false;
let score = 0;
let currentWave = 0;
let enemiesRemaining = 0;
let waveComplete = false;
let spellingTest = false;
let currentWord = '';
let wordImage = null;
let userInput = '';

// Modify the movePlayer function
function movePlayer() {
    if (gameOver) return; // Prevent movement if game is over
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < ARENA_SIZE) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < ARENA_SIZE) player.x += player.speed;
}

function spawnEnemy() {
    if (enemiesRemaining > 0 && enemies.length < waves[currentWave].totalEnemies) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        switch (edge) {
            case 0: // Top
                x = Math.random() * ARENA_SIZE;
                y = 0;
                break;
            case 1: // Right
                x = ARENA_SIZE;
                y = Math.random() * ARENA_SIZE;
                break;
            case 2: // Bottom
                x = Math.random() * ARENA_SIZE;
                y = ARENA_SIZE;
                break;
            case 3: // Left
                x = 0;
                y = Math.random() * ARENA_SIZE;
                break;
        }

        enemies.push({ x, y, size: ENEMY_SIZE });
        enemiesRemaining--;
    }
}

function moveEnemies() {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        enemy.x += (dx / distance) * ENEMY_SPEED;
        enemy.y += (dy / distance) * ENEMY_SPEED;
    });
}

function spawnHealthBox() {
    if (!healthBox) {
        healthBox = {
            x: Math.random() * (ARENA_SIZE - HEALTH_BOX_SIZE),
            y: Math.random() * (ARENA_SIZE - HEALTH_BOX_SIZE),
            size: HEALTH_BOX_SIZE
        };
    }
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function checkCollisions() {
    // Check enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (
            player.x < enemy.x + enemy.size &&
            player.x + player.size > enemy.x &&
            player.y < enemy.y + enemy.size &&
            player.y + player.size > enemy.y
        ) {
            player.health--;
            enemies.splice(i, 1);
        }
    }

    // Check health box collision
    if (healthBox) {
        if (
            player.x < healthBox.x + healthBox.size &&
            player.x + player.size > healthBox.x &&
            player.y < healthBox.y + healthBox.size &&
            player.y + player.size > healthBox.y
        ) {
            player.health = Math.min(player.health + 1, MAX_HEALTH);
            healthBox = null;
        }
    }

    // Check projectile collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (
                projectile.x < enemy.x + enemy.size &&
                projectile.x + projectile.size > enemy.x &&
                projectile.y < enemy.y + enemy.size &&
                projectile.y + projectile.size > enemy.y
            ) {
                enemies.splice(j, 1);
                projectiles.splice(i, 1);
                score += 10; // Increase score when enemy is destroyed
                break;
            }
        }
    }

    // Check if player's health has reached 0
    if (player.health <= 0) {
        gameOver = true;
    }
}

// Add this new function
function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 50, 120, 40);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Try Again', canvas.width / 2, canvas.height / 2 + 75);
}

// Add this new function
function drawWaveCompleteScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${currentWave} Complete!`, canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 40);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Start Next Wave', canvas.width / 2, canvas.height / 2 + 75);
}

function drawSpellingTest() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw blue box with rounded corners
    ctx.fillStyle = 'lightblue';
    roundRect(ctx, canvas.width / 2 - 200, canvas.height / 2 - 180, 400, 360, 20, true);

    // Draw instruction text
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Spell the word shown in the image:', canvas.width / 2, canvas.height / 2 - 150);

    // Draw word image
    if (wordImage) {
        ctx.drawImage(wordImage, canvas.width / 2 - 100, canvas.height / 2 - 120, 200, 150);
    }

    // Draw text field
    ctx.fillStyle = 'white';
    roundRect(ctx, canvas.width / 2 - 150, canvas.height / 2 + 80, 300, 40, 10, true);

    // Draw user input
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(userInput, canvas.width / 2 - 140, canvas.height / 2 + 105);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw arena
    ctx.strokeStyle = 'black';
    ctx.strokeRect(-camera.x, -camera.y, ARENA_SIZE, ARENA_SIZE);

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x - camera.x, player.y - camera.y, player.size, player.size);

    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x - camera.x, enemy.y - camera.y, enemy.size, enemy.size);
    });

    // Draw health box
    if (healthBox) {
        ctx.fillStyle = 'green';
        ctx.fillRect(healthBox.x - camera.x, healthBox.y - camera.y, healthBox.size, healthBox.size);
    }

    // Draw player health
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${player.health}`, 10, 30);

    // Draw projectiles
    ctx.fillStyle = 'black';
    projectiles.forEach(projectile => {
        ctx.fillRect(
            projectile.x - camera.x,
            projectile.y - camera.y,
            projectile.size,
            projectile.size
        );
    });

    // Draw score
    ctx.fillText(`Score: ${score}`, 10, 60);

    // Draw wave number
    ctx.fillText(`Wave: ${currentWave + 1}`, 10, 90);

    if (spellingTest) {
        drawSpellingTest();
    } else if (waveComplete) {
        drawWaveCompleteScreen();
    } else if (gameOver) {
        drawGameOverScreen();
    }
}

// Add this new function
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        // Remove projectiles that are out of bounds
        if (
            projectile.x < 0 ||
            projectile.x > ARENA_SIZE ||
            projectile.y < 0 ||
            projectile.y > ARENA_SIZE
        ) {
            projectiles.splice(i, 1);
        }
    }
}

// Modify this function
function shootProjectile() {
    if (gameOver || waveComplete || enemies.length === 0) return;

    // Find the closest enemy
    let closestEnemy = enemies[0];
    let closestDistance = Infinity;

    for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    }

    // Calculate angle to the closest enemy
    const angle = Math.atan2(
        closestEnemy.y - player.y,
        closestEnemy.x - player.x
    );

    const vx = Math.cos(angle) * PROJECTILE_SPEED;
    const vy = Math.sin(angle) * PROJECTILE_SPEED;

    projectiles.push({
        x: player.x + player.size / 2 - PROJECTILE_SIZE / 2,
        y: player.y + player.size / 2 - PROJECTILE_SIZE / 2,
        size: PROJECTILE_SIZE,
        vx: vx,
        vy: vy
    });
}

// Modify the gameLoop function
function gameLoop() {
    if (!waveComplete && !gameOver && !spellingTest) {
        movePlayer();
        moveEnemies();
        updateProjectiles();
        updateCamera();
        checkCollisions();
        
        if (Math.random() < 0.02) spawnEnemy(); // 2% chance to spawn an enemy each frame

        score++; // Increment score each frame

        // Check if the wave is complete
        if (enemies.length === 0 && enemiesRemaining === 0) {
            waveComplete = true;
        }
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// Modify the restartGame function
function restartGame() {
    player.x = ARENA_SIZE / 2;
    player.y = ARENA_SIZE / 2;
    player.health = MAX_HEALTH;
    enemies.length = 0;
    healthBox = null;
    gameOver = false;
    waveComplete = false;
    score = 0;
    projectiles.length = 0;
    currentWave = 0;
    startNextWave();
}

// Modify the startNextWave function
function startNextWave() {
    if (currentWave < waves.length) {
        currentWave++;
        enemiesRemaining = waves[currentWave - 1].totalEnemies;
        waveComplete = false;
        startSpellingTest(); // Start spelling test before the next wave
    } else {
        console.log("All waves complete!");
        gameOver = true; // End the game if all waves are complete
    }
}

// Add event listener for keydown
document.addEventListener('keydown', (e) => {
    if (spellingTest) {
        if (e.key === 'Enter') {
            if (userInput.toLowerCase() === currentWord.toLowerCase()) {
                spellingTest = false; // End spelling test and start next wave
            } else {
                alert(`Incorrect. The correct spelling is: ${currentWord}`);
                userInput = ''; // Clear input for retry
            }
        } else if (e.key === 'Backspace') {
            userInput = userInput.slice(0, -1);
        } else if (e.key.length === 1) {
            userInput += e.key;
        }
    }
});

// Modify the click event listener
canvas.addEventListener('click', (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is within the "Try Again" button
        if (x > canvas.width / 2 - 60 && x < canvas.width / 2 + 60 &&
            y > canvas.height / 2 + 50 && y < canvas.height / 2 + 90) {
            restartGame();
        }
    } else if (waveComplete) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is within the "Start Next Wave" button
        if (x > canvas.width / 2 - 100 && x < canvas.width / 2 + 100 &&
            y > canvas.height / 2 + 50 && y < canvas.height / 2 + 90) {
            startNextWave();
        }
    }
});

// Start the first wave
startNextWave();

// Start automatic shooting
setInterval(shootProjectile, SHOOT_INTERVAL);

// Spawn health box every 10 seconds
setInterval(spawnHealthBox, HEALTH_BOX_SPAWN_INTERVAL);

gameLoop();



function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

function loadWordImage(word) {
    wordImage = new Image();
    wordImage.src = `${imageBase}${word}.jpg`;
}

function startSpellingTest() {
    spellingTest = true;
    currentWord = getRandomWord();
    loadWordImage(currentWord);
    userInput = '';
}