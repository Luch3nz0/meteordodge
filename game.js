// Game elements
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('game-over');
const finalTimeDisplay = document.getElementById('final-time');
const bestTimeDisplay = document.getElementById('best-time');
const retryButton = document.getElementById('retry-button');
const menuButton = document.getElementById('menu-button');
const mainMenu = document.getElementById('main-menu');
const normalModeButton = document.getElementById('normal-mode');
const mode2Button = document.getElementById('mode-2');
const mode3Button = document.getElementById('mode-3');

// Add button classes
[normalModeButton, mode2Button, mode3Button].forEach(button => {
    button.classList.add('game-button');
});

// Game variables
let gameActive = false;
let playerPosition = gameContainer.offsetWidth / 2;
let playerWidth = 40;
let playerSpeed = 10;
let timer = 0;
let meteors = [];
let meteorSpeed = 2;
let meteorGenerationSpeed = 1200; // milliseconds
let lastSpeedIncrease = 0;
let meteorGenerationInterval;
let animationFrameId;
let bestScores = {
    normal: parseFloat(localStorage.getItem('bestTime_normal') || 0),
    icy: parseFloat(localStorage.getItem('bestTime_icy') || 0),
    insane: parseFloat(localStorage.getItem('bestTime_insane') || 0)
};
let touchStartX = 0;
let skyElement = document.getElementById('sky');
let groundElement = document.getElementById('ground');
let currentGameMode = 'normal';
let playerMomentum = 0;
const MOMENTUM_DECAY = 0.95;
const MAX_MOMENTUM = 15;

// Initialize game
function initGame(mode = 'normal') {
    currentGameMode = mode;
    playerPosition = gameContainer.offsetWidth / 2;
    player.style.left = `${playerPosition - playerWidth / 2}px`;
    timer = 0;
    meteors = [];
    meteorSpeed = mode === 'insane' ? 3 : 2; // Faster base speed for insane mode
    meteorGenerationSpeed = mode === 'insane' ? 1000 : 1200; // Faster generation for insane mode
    lastSpeedIncrease = 0;
    playerMomentum = 0;
    removeAllMeteors();
    updateTimer();
    updateBestTimeDisplay();
    gameActive = true;
    
    // Hide menu and game over screen
    mainMenu.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Set theme based on mode
    if (mode === 'icy') {
        skyElement.style.background = 'linear-gradient(to bottom, #1a4c6e, #2c5c7e, #3d6d8e)';
        groundElement.style.backgroundColor = '#a5f2f3';
        groundElement.style.backgroundImage = `
            linear-gradient(90deg, rgba(255,255,255,0.3) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.3) 50%, transparent 50%)
        `;
    } else if (mode === 'insane') {
        skyElement.style.background = 'linear-gradient(to bottom, #4a0000, #800000, #b30000)';
        groundElement.style.backgroundColor = '#2d0000';
        groundElement.style.backgroundImage = `
            linear-gradient(90deg, rgba(255,0,0,0.2) 50%, transparent 50%),
            linear-gradient(rgba(255,0,0,0.2) 50%, transparent 50%)
        `;
        // Make meteors look more menacing in insane mode
        const style = document.createElement('style');
        style.textContent = `
            .meteor {
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.6) !important;
                border: 1px solid #ff3333 !important;
                background-color: #800000 !important;
            }
        `;
        document.head.appendChild(style);
    } else {
        skyElement.style.background = 'linear-gradient(to bottom, #87CEEB, #a0d8ef, #c4e7f7)';
        groundElement.style.backgroundColor = '#173c00';
        groundElement.style.backgroundImage = `
            linear-gradient(90deg, rgba(0,150,0,0.3) 50%, transparent 50%),
            linear-gradient(rgba(0,200,0,0.3) 50%, transparent 50%)
        `;
    }
    
    // Start meteor generation
    meteorGenerationInterval = setInterval(generateMeteor, meteorGenerationSpeed);
    
    // Start game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update best time display
function updateBestTimeDisplay() {
    const currentBest = bestScores[currentGameMode];
    const modeText = currentGameMode.charAt(0).toUpperCase() + currentGameMode.slice(1);
    bestTimeDisplay.textContent = `${modeText} Mode Best: ${currentBest.toFixed(1)}s`;
}

// Show main menu
function showMainMenu() {
    mainMenu.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    gameActive = false;
    removeAllMeteors();
    cancelAnimationFrame(animationFrameId);
    clearInterval(meteorGenerationInterval);
    
    // Update button texts with best scores
    normalModeButton.textContent = `Normal Mode (Best: ${bestScores.normal.toFixed(1)}s)`;
    mode2Button.textContent = `Icy Mode (Best: ${bestScores.icy.toFixed(1)}s)`;
    mode3Button.textContent = `Insane Mode (Best: ${bestScores.insane.toFixed(1)}s)`;
}

// Remove all meteors
function removeAllMeteors() {
    const existingMeteors = document.querySelectorAll('.meteor');
    existingMeteors.forEach(meteor => meteor.remove());
}

// Generate a new meteor
function generateMeteor() {
    if (!gameActive) return;
    
    const meteorSize = 30;
    // Random position from left to right
    const positionX = Math.random() * (gameContainer.offsetWidth - meteorSize);
    
    // Start from top but outside the visible area
    const positionY = -meteorSize;
    
    // Random angle (diagonal)
    // Value between -1 (moving left) and 1 (moving right)
    const angleX = Math.random() * 2 - 1;
    
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.left = `${positionX}px`;
    meteor.style.top = `${positionY}px`;
    
    // Random meteor size variation
    const scale = 0.8 + Math.random() * 0.6; // 0.8 to 1.4
    meteor.style.transform = `scale(${scale})`;
    
    gameContainer.appendChild(meteor);
    
    // Additional properties for insane mode
    const insaneProps = currentGameMode === 'insane' ? {
        amplitude: Math.random() * 100 + 50, // Random amplitude between 50 and 150
        frequency: Math.random() * 0.02 + 0.01, // Random frequency
        phase: Math.random() * Math.PI * 2, // Random phase
        baseX: positionX // Store initial X position
    } : {};
    
    meteors.push({
        element: meteor,
        positionX: positionX,
        positionY: positionY,
        angleX: angleX * meteorSpeed * 0.8,
        scale: scale,
        ...insaneProps
    });
}

// Update timer display and sky color
function updateTimer() {
    timerDisplay.textContent = `Time: ${timer.toFixed(1)}s`;
    
    // Update sky color based on time
    // From light blue (0s) to red (60s)
    if (timer <= 60) {
        let progress = timer / 60; // 0 to 1
        
        // Colors for the gradient at different stages
        const startColors = {
            r: 135, g: 206, b: 235  // Light blue (87CEEB)
        };
        
        const midColors1 = {
            r: 255, g: 255, b: 102  // Light yellow
        };
        
        const midColors2 = {
            r: 255, g: 165, b: 0    // Orange (FFA500)
        };
        
        const endColors = {
            r: 139, g: 0, b: 0      // Dark red (8B0000)
        };
        
        let r1, g1, b1, r2, g2, b2, r3, g3, b3;
        
        if (progress < 0.33) {
            // From light blue to yellow
            const localProgress = progress * 3; // Scale 0-0.33 to 0-1
            r1 = interpolateColor(startColors.r, midColors1.r, localProgress);
            g1 = interpolateColor(startColors.g, midColors1.g, localProgress);
            b1 = interpolateColor(startColors.b, midColors1.b, localProgress);
            
            r2 = interpolateColor(startColors.r + 15, midColors1.r - 15, localProgress);
            g2 = interpolateColor(startColors.g + 10, midColors1.g - 10, localProgress);
            b2 = interpolateColor(startColors.b - 20, midColors1.b - 20, localProgress);
            
            r3 = interpolateColor(startColors.r + 30, midColors1.r - 30, localProgress);
            g3 = interpolateColor(startColors.g - 10, midColors1.g - 30, localProgress);
            b3 = interpolateColor(startColors.b - 40, midColors1.b - 40, localProgress);
        } 
        else if (progress < 0.66) {
            // From yellow to orange
            const localProgress = (progress - 0.33) * 3; // Scale 0.33-0.66 to 0-1
            r1 = interpolateColor(midColors1.r, midColors2.r, localProgress);
            g1 = interpolateColor(midColors1.g, midColors2.g, localProgress);
            b1 = interpolateColor(midColors1.b, midColors2.b, localProgress);
            
            r2 = interpolateColor(midColors1.r - 15, midColors2.r - 15, localProgress);
            g2 = interpolateColor(midColors1.g - 10, midColors2.g - 30, localProgress);
            b2 = interpolateColor(midColors1.b - 20, midColors2.b - 10, localProgress);
            
            r3 = interpolateColor(midColors1.r - 30, midColors2.r - 30, localProgress);
            g3 = interpolateColor(midColors1.g - 30, midColors2.g - 50, localProgress);
            b3 = interpolateColor(midColors1.b - 40, midColors2.b - 20, localProgress);
        } 
        else {
            // From orange to red
            const localProgress = (progress - 0.66) * 3; // Scale 0.66-1 to 0-1
            r1 = interpolateColor(midColors2.r, endColors.r, localProgress);
            g1 = interpolateColor(midColors2.g, endColors.g, localProgress);
            b1 = interpolateColor(midColors2.b, endColors.b, localProgress);
            
            r2 = interpolateColor(midColors2.r - 15, endColors.r + 30, localProgress);
            g2 = interpolateColor(midColors2.g - 30, endColors.g + 20, localProgress);
            b2 = interpolateColor(midColors2.b - 10, endColors.b + 10, localProgress);
            
            r3 = interpolateColor(midColors2.r - 30, endColors.r + 60, localProgress);
            g3 = interpolateColor(midColors2.g - 50, endColors.g + 40, localProgress);
            b3 = interpolateColor(midColors2.b - 20, endColors.b + 20, localProgress);
        }
        
        // Update the gradient
        skyElement.style.background = `linear-gradient(to bottom, 
            rgb(${r1}, ${g1}, ${b1}), 
            rgb(${r2}, ${g2}, ${b2}), 
            rgb(${r3}, ${g3}, ${b3}))`;
    }
}

// Helper function to interpolate between two colors
function interpolateColor(start, end, progress) {
    return Math.round(start + (end - start) * progress);
}

// Check collision between meteor and player
function checkCollision(meteor) {
    const meteorSize = 30 * meteor.scale;
    
    // Get the actual rendered positions
    const playerRect = player.getBoundingClientRect();
    const meteorElement = meteor.element.getBoundingClientRect();
    
    // Calculate centers
    const meteorCenter = {
        x: meteorElement.left + meteorElement.width / 2,
        y: meteorElement.top + meteorElement.height / 2
    };
    
    const playerCenter = {
        x: playerRect.left + playerRect.width / 2,
        y: playerRect.top + playerRect.height / 2
    };
    
    // Calculate distance between centers
    const dx = meteorCenter.x - playerCenter.x;
    const dy = meteorCenter.y - playerCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Use 80% of the actual size for more precise collision
    const collisionThreshold = (meteorSize + playerWidth) * 0.4;
    
    return distance < collisionThreshold;
}

// Move player function
function movePlayer(direction, multiplier = 1) {
    if (currentGameMode === 'icy') {
        // Add to momentum instead of direct movement
        playerMomentum += direction * playerSpeed * multiplier * 0.5;
        playerMomentum = Math.max(-MAX_MOMENTUM, Math.min(MAX_MOMENTUM, playerMomentum));
    } else {
        playerPosition += direction * playerSpeed * multiplier;
    }
    
    // Apply momentum if in icy mode
    if (currentGameMode === 'icy') {
        playerPosition += playerMomentum;
        playerMomentum *= MOMENTUM_DECAY;
    }
    
    // Keep player within bounds
    const minPosition = playerWidth / 2;
    const maxPosition = gameContainer.offsetWidth - playerWidth / 2;
    playerPosition = Math.max(minPosition, Math.min(playerPosition, maxPosition));
    
    player.style.left = `${playerPosition - playerWidth / 2}px`;
}

// Game loop
function gameLoop(timestamp) {
    if (!gameActive) return;
    
    // Update timer
    timer += 1/60;
    updateTimer();
    
    // Check if it's time to increase speed
    if (timer - lastSpeedIncrease >= 10) {
        meteorSpeed += currentGameMode === 'insane' ? 0.7 : 0.5;
        if (meteorGenerationSpeed > 400) {
            meteorGenerationSpeed -= 150;
            clearInterval(meteorGenerationInterval);
            meteorGenerationInterval = setInterval(generateMeteor, meteorGenerationSpeed);
        }
        lastSpeedIncrease = timer;
    }
    
    // Update meteor positions
    meteors.forEach((meteor, index) => {
        meteor.positionY += meteorSpeed;
        
        if (currentGameMode === 'insane') {
            // Calculate curved path using sine wave
            const time = meteor.positionY * meteor.frequency;
            meteor.positionX = meteor.baseX + Math.sin(time + meteor.phase) * meteor.amplitude;
        } else {
            meteor.positionX += meteor.angleX;
        }
        
        meteor.element.style.top = `${meteor.positionY}px`;
        meteor.element.style.left = `${meteor.positionX}px`;
        
        // Check if meteor is out of bounds
        if (meteor.positionY > gameContainer.offsetHeight || 
            meteor.positionX < -50 || 
            meteor.positionX > gameContainer.offsetWidth + 50) {
            meteor.element.remove();
            meteors.splice(index, 1);
        }
        
        // Check for collision with player
        if (checkCollision(meteor)) {
            endGame();
        }
    });
    
    // Apply momentum decay in icy mode
    if (currentGameMode === 'icy' && Math.abs(playerMomentum) > 0.01) {
        movePlayer(0);
    }
    
    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// End the game
function endGame() {
    gameActive = false;
    clearInterval(meteorGenerationInterval);
    cancelAnimationFrame(animationFrameId);
    
    // Update best time for current mode
    if (timer > bestScores[currentGameMode]) {
        bestScores[currentGameMode] = timer;
        localStorage.setItem(`bestTime_${currentGameMode}`, timer);
    }
    
    // Show game over screen with mode-specific best time
    finalTimeDisplay.textContent = `You survived: ${timer.toFixed(1)}s`;
    updateBestTimeDisplay();
    gameOverScreen.style.display = 'flex';
}

// Event listeners for keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePlayer(-1);
            break;
        case 'ArrowRight':
            movePlayer(1);
            break;
    }
});

// Touch controls for mobile
gameContainer.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    touchStartX = e.touches[0].clientX;
});

gameContainer.addEventListener('touchmove', (e) => {
    if (!gameActive) return;
    e.preventDefault();
    
    const touchX = e.touches[0].clientX;
    const diffX = touchX - touchStartX;
    
    if (Math.abs(diffX) > 5) {
        movePlayer(diffX > 0 ? 1 : -1, Math.abs(diffX) / 10);
        touchStartX = touchX;
    }
});

// Event listeners
normalModeButton.addEventListener('click', () => initGame('normal'));
mode2Button.addEventListener('click', () => initGame('icy'));
mode3Button.addEventListener('click', () => initGame('insane'));
retryButton.addEventListener('click', () => initGame(currentGameMode));
menuButton.addEventListener('click', showMainMenu);

// Update mode buttons text
mode2Button.textContent = 'Icy Mode';
mode2Button.disabled = false;
mode3Button.textContent = 'Insane Mode';
mode3Button.disabled = false;

// Resize handler
window.addEventListener('resize', () => {
    if (gameActive) {
        // Adjust player position proportionally
        const containerWidthRatio = gameContainer.offsetWidth / (playerPosition * 2);
        playerPosition = gameContainer.offsetWidth / 2;
        player.style.left = `${playerPosition - playerWidth / 2}px`;
    }
});

// Start with showing the menu instead of starting the game
window.addEventListener('load', showMainMenu);