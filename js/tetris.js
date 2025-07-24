/**
 * Main Tetris game engine
 */

import { GameBoard } from './board.js';
import { Piece } from './pieces.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';

export class TetrisGame {
    constructor(gameCanvas, nextCanvas) {
        this.board = new GameBoard();
        this.renderer = new Renderer(gameCanvas, nextCanvas);
        this.input = new InputHandler(this);
        
        // Game state
        this.currentPiece = null;
        this.nextPiece = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Scoring and levels
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        
        // Timing
        this.dropTimer = 0;
        this.lastTime = 0;
        this.dropInterval = this.getLevelDropInterval();
        this.lockTimer = 0;
        this.lockDelay = 500; // ms before piece locks
        this.isLocking = false;
        
        // Animation
        this.animationId = null;
        this.lineFlashTimer = 0;
        this.lineFlashDuration = 300; // ms
        
        // UI elements
        this.setupUI();
        
        // Initialize first pieces
        this.generateNextPiece();
        this.spawnNewPiece();
    }

    setupUI() {
        // Get UI elements
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // Setup buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.restart());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    /**
     * Start the game
     */
    start() {
        if (this.isGameOver) {
            this.restart();
            return;
        }
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.gameLoop();
            this.updateUI();
        }
    }

    /**
     * Pause/resume the game
     */
    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.gameLoop();
        }
        
        this.updateUI();
    }

    /**
     * Restart the game
     */
    restart() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Reset game state
        this.board.reset();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.isLocking = false;
        this.lineFlashTimer = 0;
        
        // Reset drop interval
        this.dropInterval = this.getLevelDropInterval();
        
        // Generate new pieces
        this.generateNextPiece();
        this.spawnNewPiece();
        
        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
        
        // Reset input
        this.input.reset();
        
        this.updateUI();
        this.render();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update game logic
     */
    update(deltaTime) {
        if (this.isGameOver) return;
        
        // Handle line flashing
        if (this.lineFlashTimer > 0) {
            this.lineFlashTimer -= deltaTime;
            if (this.lineFlashTimer <= 0) {
                this.board.clearFlashingLines();
            }
            return; // Don't update other logic while flashing
        }
        
        // Handle piece locking
        if (this.isLocking) {
            this.lockTimer -= deltaTime;
            if (this.lockTimer <= 0) {
                this.lockPiece();
                return;
            }
        }
        
        // Handle automatic piece dropping
        this.dropTimer += deltaTime;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            this.moveCurrentPiece(0, 1);
        }
    }

    /**
     * Render the game
     */
    render() {
        const gameState = {
            board: this.board,
            currentPiece: this.currentPiece,
            nextPiece: this.nextPiece
        };
        
        this.renderer.render(gameState);
        
        if (this.isGameOver) {
            this.renderer.renderGameOver();
        }
    }

    /**
     * Move the current piece
     */
    movePiece(dx, dy) {
        this.moveCurrentPiece(dx, dy);
    }

    /**
     * Move current piece with collision detection
     */
    moveCurrentPiece(dx, dy) {
        if (!this.currentPiece || this.isGameOver) return false;
        
        if (this.board.canPlacePiece(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            
            // Reset lock timer if piece moved horizontally or rotated
            if (dx !== 0) {
                this.resetLockTimer();
            }
            
            // Start locking if piece moved down and can't move further
            if (dy > 0 && !this.board.canPlacePiece(this.currentPiece, 0, 1)) {
                this.startLocking();
            }
            
            return true;
        } else if (dy > 0) {
            // Piece hit bottom or another piece
            this.startLocking();
        }
        
        return false;
    }

    /**
     * Rotate the current piece
     */
    rotatePiece() {
        if (!this.currentPiece || this.isGameOver) return;
        
        const originalRotation = this.currentPiece.rotation;
        const piece = this.currentPiece.copy();
        piece.rotate();
        
        // Try basic rotation first
        if (this.board.canPlacePiece(piece)) {
            this.currentPiece.rotate();
            this.resetLockTimer();
            return;
        }
        
        // Try wall kicks (SRS)
        const fromRotation = originalRotation;
        const toRotation = piece.rotation;
        const wallKicks = piece.getWallKickOffsets(fromRotation, toRotation);
        
        for (const [dx, dy] of wallKicks) {
            if (this.board.canPlacePiece(piece, dx, dy)) {
                this.currentPiece.rotate();
                this.currentPiece.x += dx;
                this.currentPiece.y += dy;
                this.resetLockTimer();
                return;
            }
        }
    }

    /**
     * Soft drop (increase fall speed)
     */
    softDrop() {
        if (this.moveCurrentPiece(0, 1)) {
            this.score += 1; // 1 point for soft drop
            this.updateUI();
        }
    }

    /**
     * Hard drop (instant drop)
     */
    hardDrop() {
        if (!this.currentPiece || this.isGameOver) return;
        
        const dropDistance = this.board.getDropPosition(this.currentPiece) - this.currentPiece.y;
        this.currentPiece.y = this.board.getDropPosition(this.currentPiece);
        
        // Add score for hard drop (2 points per cell)
        this.score += dropDistance * 2;
        
        this.lockPiece();
        this.updateUI();
    }

    /**
     * Start the locking process
     */
    startLocking() {
        if (!this.isLocking) {
            this.isLocking = true;
            this.lockTimer = this.lockDelay;
        }
    }

    /**
     * Reset the lock timer
     */
    resetLockTimer() {
        this.isLocking = false;
        this.lockTimer = 0;
    }

    /**
     * Lock the current piece and spawn a new one
     */
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Place piece on board
        this.board.placePiece(this.currentPiece);
        
        // Check for completed lines
        const linesCleared = this.board.clearLines();
        
        if (linesCleared > 0) {
            this.handleLinesCleared(linesCleared);
            this.lineFlashTimer = this.lineFlashDuration;
        } else {
            this.combo = 0; // Reset combo if no lines cleared
        }
        
        // Reset locking state
        this.resetLockTimer();
        
        // Spawn new piece
        this.spawnNewPiece();
        
        // Check for game over
        if (this.board.isGameOver() || !this.board.canPlacePiece(this.currentPiece)) {
            this.gameOver();
        }
        
        this.updateUI();
    }

    /**
     * Handle lines cleared
     */
    handleLinesCleared(linesCleared) {
        this.lines += linesCleared;
        this.combo += 1;
        
        // Calculate score based on lines cleared and level
        const baseScores = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4 lines
        let lineScore = baseScores[linesCleared] * this.level;
        
        // Combo bonus
        if (this.combo > 1) {
            lineScore += 50 * this.combo * this.level;
        }
        
        this.score += lineScore;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = this.getLevelDropInterval();
        }
    }

    /**
     * Generate next piece
     */
    generateNextPiece() {
        const type = Piece.getRandomType();
        this.nextPiece = new Piece(type);
    }

    /**
     * Spawn a new piece
     */
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
    }

    /**
     * Get drop interval based on level
     */
    getLevelDropInterval() {
        // Standard Tetris timing (frames at 60fps converted to ms)
        const frames = Math.max(1, 48 - (this.level - 1) * 5);
        return (frames / 60) * 1000;
    }

    /**
     * Game over
     */
    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.finalScoreElement.textContent = this.score.toString().padStart(6, '0');
        this.gameOverScreen.classList.remove('hidden');
    }

    /**
     * Update UI elements
     */
    updateUI() {
        this.scoreElement.textContent = this.score.toString().padStart(6, '0');
        this.levelElement.textContent = this.level.toString();
        this.linesElement.textContent = this.lines.toString();
        
        // Update button states
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isGameOver) {
            startBtn.textContent = 'Start';
            pauseBtn.disabled = true;
        } else if (!this.isRunning) {
            startBtn.textContent = 'Start';
            pauseBtn.disabled = true;
        } else if (this.isPaused) {
            startBtn.textContent = 'Resume';
            pauseBtn.textContent = 'Resume';
            pauseBtn.disabled = false;
        } else {
            startBtn.textContent = 'Start';
            pauseBtn.textContent = 'Pause';
            pauseBtn.disabled = false;
        }
    }

    /**
     * Destroy the game and clean up resources
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.input.destroy();
    }
}