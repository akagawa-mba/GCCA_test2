/**
 * Input handling for Tetris game
 */

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keysPressed = new Set();
        this.keyRepeatTimers = new Map();
        this.keyDelayTimers = new Map();
        
        // Key repeat settings
        this.INITIAL_DELAY = 170; // ms before first repeat
        this.REPEAT_DELAY = 50;   // ms between repeats
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent default browser behavior for game keys
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(event) {
        const key = event.code;
        
        // Ignore if already pressed (prevent key repeat from OS)
        if (this.keysPressed.has(key)) {
            return;
        }
        
        this.keysPressed.add(key);
        
        // Handle immediate actions
        this.handleKeyAction(key);
        
        // Set up key repeat for movement keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(key)) {
            // Initial delay before repeating
            this.keyDelayTimers.set(key, setTimeout(() => {
                // Start repeating
                this.keyRepeatTimers.set(key, setInterval(() => {
                    if (this.keysPressed.has(key)) {
                        this.handleKeyAction(key);
                    }
                }, this.REPEAT_DELAY));
            }, this.INITIAL_DELAY));
        }
    }

    handleKeyUp(event) {
        const key = event.code;
        this.keysPressed.delete(key);
        
        // Clear timers
        if (this.keyDelayTimers.has(key)) {
            clearTimeout(this.keyDelayTimers.get(key));
            this.keyDelayTimers.delete(key);
        }
        
        if (this.keyRepeatTimers.has(key)) {
            clearInterval(this.keyRepeatTimers.get(key));
            this.keyRepeatTimers.delete(key);
        }
    }

    handleKeyAction(key) {
        if (!this.game.isRunning && key !== 'Space' && key !== 'KeyR') {
            return;
        }

        switch (key) {
            case 'ArrowLeft':
                this.game.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.game.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.game.softDrop();
                break;
            case 'ArrowUp':
                this.game.rotatePiece();
                break;
            case 'Space':
                if (this.game.isRunning) {
                    this.game.hardDrop();
                } else if (this.game.isGameOver) {
                    this.game.restart();
                } else {
                    this.game.start();
                }
                break;
            case 'KeyP':
                this.game.togglePause();
                break;
            case 'KeyR':
                this.game.restart();
                break;
        }
    }

    /**
     * Clean up all timers
     */
    destroy() {
        // Clear all timers
        this.keyDelayTimers.forEach(timer => clearTimeout(timer));
        this.keyRepeatTimers.forEach(timer => clearInterval(timer));
        this.keyDelayTimers.clear();
        this.keyRepeatTimers.clear();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * Check if a key is currently pressed
     */
    isKeyPressed(key) {
        return this.keysPressed.has(key);
    }

    /**
     * Reset all key states
     */
    reset() {
        this.keysPressed.clear();
        this.keyDelayTimers.forEach(timer => clearTimeout(timer));
        this.keyRepeatTimers.forEach(timer => clearInterval(timer));
        this.keyDelayTimers.clear();
        this.keyRepeatTimers.clear();
    }
}