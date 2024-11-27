class NokiaBounceGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.startButton = document.getElementById('startButton');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        
        // Set canvas size based on window size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize game state
        this.level = 1;
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;
        this.isRunning = false;
        this.gameOver = false;
        this.score = 0;

        // Ball properties
        this.initBall();

        // Paddle properties
        this.initPaddle();

        // Level configurations
        this.initLevelConfigs();

        // Setup controls
        this.setupControls();
        this.createBricks();
    }

    resizeCanvas() {
        const maxWidth = Math.min(800, window.innerWidth * 0.9);
        const maxHeight = Math.min(600, window.innerHeight * 0.7);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Adjust game elements based on new canvas size
        this.paddleYPosition = this.canvas.height - 20;
        if (this.paddle) {
            this.paddle.width = this.canvas.width * 0.15;
            this.paddle.height = this.canvas.height * 0.02;
            this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        }
        
        if (this.ball) {
            this.ball.radius = Math.min(this.canvas.width, this.canvas.height) * 0.02;
        }
        
        // Recreate bricks if game is in progress
        if (this.isRunning) {
            this.createBricks();
        }
    }

    initBall() {
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.02;
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            radius: radius,
            dx: 5,
            dy: -5,
            speed: 5,
            speedIncrease: 0.2,  // Speed increase per hit
            maxSpeed: 15         // Maximum speed limit
        };
    }

    initPaddle() {
        const width = this.canvas.width * 0.15;
        const height = this.canvas.height * 0.02;
        this.paddle = {
            width: width,
            height: height,
            x: (this.canvas.width - width) / 2,
            color: '#00ff00'
        };
        this.paddleYPosition = this.canvas.height - 20;
    }

    initLevelConfigs() {
        this.levelConfigs = [
            { rows: 3, cols: 5, speed: 5, brickHealth: 1 },  // Level 1
            { rows: 4, cols: 6, speed: 6, brickHealth: 1 },  // Level 2
            { rows: 4, cols: 7, speed: 7, brickHealth: 2 },  // Level 3
            { rows: 5, cols: 7, speed: 7, brickHealth: 2 },  // Level 4
            { rows: 5, cols: 8, speed: 8, brickHealth: 2 },  // Level 5
            { rows: 6, cols: 8, speed: 8, brickHealth: 3 },  // Level 6
            { rows: 6, cols: 9, speed: 9, brickHealth: 3 },  // Level 7
            { rows: 7, cols: 9, speed: 9, brickHealth: 3 }   // Level 8
        ];
    }

    setupControls() {
        this.startButton.addEventListener('click', () => this.startGame());
        
        // Mouse/Touch controls
        let lastMove = 0;
        const moveHandler = (e) => {
            const now = performance.now();
            if (now - lastMove > 16) {
                const rect = this.canvas.getBoundingClientRect();
                const relativeX = (e.clientX || e.touches[0].clientX) - rect.left;
                if (relativeX > 0 && relativeX < this.canvas.width) {
                    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, relativeX - this.paddle.width / 2));
                }
                lastMove = now;
            }
        };

        this.canvas.addEventListener('mousemove', moveHandler);
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            moveHandler(e);
        });

        // Mobile button controls
        const leftButton = document.getElementById('leftButton');
        const rightButton = document.getElementById('rightButton');
        
        const moveLeft = () => {
            this.paddle.x = Math.max(0, this.paddle.x - 20);
        };
        
        const moveRight = () => {
            this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + 20);
        };

        // Touch events for mobile buttons
        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.leftInterval = setInterval(moveLeft, 16);
        });
        
        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rightInterval = setInterval(moveRight, 16);
        });

        leftButton.addEventListener('touchend', () => {
            clearInterval(this.leftInterval);
        });
        
        rightButton.addEventListener('touchend', () => {
            clearInterval(this.rightInterval);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                moveLeft();
            } else if (e.key === 'ArrowRight') {
                moveRight();
            }
        });
    }

    createBricks() {
        const config = this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
        const brickWidth = (this.canvas.width - 60) / config.cols;
        const brickHeight = 20;
        const brickPadding = 5;
        const brickOffsetTop = 30;
        const brickOffsetLeft = 30;

        this.bricks = [];
        for (let c = 0; c < config.cols; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < config.rows; r++) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                this.bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    health: config.brickHealth,
                    maxHealth: config.brickHealth
                };
            }
        }
    }

    drawBricks() {
        const config = this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
        const brickWidth = (this.canvas.width - 60) / config.cols;
        const brickHeight = 20;

        this.ctx.fillStyle = '#00ff00';
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                if (brick.health > 0) {
                    // Calculate brick color based on health
                    const healthPercent = brick.health / brick.maxHealth;
                    const green = Math.floor(255 * healthPercent);
                    this.ctx.fillStyle = `rgb(0, ${green}, 0)`;
                    this.ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
                }
            }
        }
    }

    collisionDetection() {
        const config = this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
        const brickWidth = (this.canvas.width - 60) / config.cols;
        const brickHeight = 20;

        let bricksRemaining = false;
        const ballRight = this.ball.x + this.ball.radius;
        const ballLeft = this.ball.x - this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;
        const ballBottom = this.ball.y + this.ball.radius;

        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                if (brick.health > 0) {
                    bricksRemaining = true;
                    const brickRight = brick.x + brickWidth;
                    const brickBottom = brick.y + brickHeight;
                    
                    if (ballRight > brick.x && ballLeft < brickRight && 
                        ballBottom > brick.y && ballTop < brickBottom) {
                        this.ball.dy = -this.ball.dy;
                        brick.health--;
                        this.score += 10;
                        this.scoreDisplay.textContent = `Score: ${this.score}`;
                        
                        // Increase ball speed after hitting a brick
                        this.increaseBallSpeed();
                        break;
                    }
                }
            }
        }

        // Check if level is completed
        if (!bricksRemaining) {
            this.nextLevel();
        }
    }

    increaseBallSpeed() {
        // Calculate current velocity
        const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        
        // Only increase if below max speed
        if (currentSpeed < this.ball.maxSpeed) {
            const newSpeed = Math.min(currentSpeed + this.ball.speedIncrease, this.ball.maxSpeed);
            const speedRatio = newSpeed / currentSpeed;
            
            // Maintain direction while increasing speed
            this.ball.dx *= speedRatio;
            this.ball.dy *= speedRatio;
        }
    }

    nextLevel() {
        this.level++;
        if (this.level <= this.levelConfigs.length) {
            this.levelDisplay.textContent = `Level: ${this.level}`;
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 50;
            const config = this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
            this.ball.speed = config.speed;
            this.createBricks();
        } else {
            this.gameOver = true;
            this.isRunning = false;
            alert('Congratulations! You completed all levels!\nFinal Score: ' + this.score);
            document.location.reload();
        }
    }

    update(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;

        if (deltaTime >= this.frameInterval) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawBricks();
            
            // Draw ball
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fill();
            this.ctx.closePath();
            
            // Draw paddle
            this.ctx.fillStyle = this.paddle.color;
            this.ctx.fillRect(this.paddle.x, this.paddleYPosition, this.paddle.width, this.paddle.height);
            
            this.collisionDetection();

            // Wall collisions
            if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
                this.ball.dx = -this.ball.dx;
                // Increase speed on wall hits too
                this.increaseBallSpeed();
            }

            if (this.ball.y - this.ball.radius < 0) {
                this.ball.dy = -this.ball.dy;
                // Increase speed on ceiling hits
                this.increaseBallSpeed();
            }

            // Paddle collision
            if (this.ball.y + this.ball.radius > this.paddleYPosition) {
                if (this.ball.x > this.paddle.x && this.ball.x < this.paddle.x + this.paddle.width) {
                    // Calculate angle based on where ball hits paddle
                    const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width/2)) / (this.paddle.width/2);
                    const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
                    
                    // Adjust angle while maintaining current speed
                    this.ball.dx = hitPos * currentSpeed;
                    this.ball.dy = -Math.sqrt(currentSpeed * currentSpeed - this.ball.dx * this.ball.dx);
                    
                    // Increase speed on paddle hits
                    this.increaseBallSpeed();
                } else if (this.ball.y > this.canvas.height) {
                    this.gameOver = true;
                    this.isRunning = false;
                    alert('Game Over!\nFinal Score: ' + this.score + '\nLevel Reached: ' + this.level);
                    document.location.reload();
                    return;
                }
            }

            this.ball.x += this.ball.dx;
            this.ball.y += this.ball.dy;

            this.lastTime = timestamp - (deltaTime % this.frameInterval);
        }

        if (this.isRunning && !this.gameOver) {
            requestAnimationFrame((timestamp) => this.update(timestamp));
        }
    }

    startGame() {
        if (!this.isRunning) {
            this.gameOver = false;
            this.isRunning = true;
            this.score = 0;
            this.level = 1;
            this.scoreDisplay.textContent = 'Score: 0';
            this.levelDisplay.textContent = 'Level: 1';
            this.initBall();
            this.createBricks();
            requestAnimationFrame((timestamp) => this.update(timestamp));
        }
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const game = new NokiaBounceGame();
});
