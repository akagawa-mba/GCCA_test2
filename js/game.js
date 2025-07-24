/**
 * Tetris Game Main Entry Point
 * ブラウザ Tetris - AI エージェント実装デモ
 */

import { TetrisGame } from './tetris.js';

class GameManager {
    constructor() {
        this.game = null;
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGame());
        } else {
            this.setupGame();
        }
    }

    /**
     * Setup the game after DOM is ready
     */
    setupGame() {
        try {
            // Get canvas elements
            const gameCanvas = document.getElementById('gameCanvas');
            const nextCanvas = document.getElementById('nextCanvas');
            
            if (!gameCanvas || !nextCanvas) {
                throw new Error('Canvas elements not found');
            }
            
            // Create game instance
            this.game = new TetrisGame(gameCanvas, nextCanvas);
            
            // Initial render
            this.game.render();
            
            console.log('Tetris game initialized successfully');
            
            // Show instructions
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize Tetris game:', error);
            this.showError('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const message = `
ブラウザ Tetris へようこそ！

操作方法:
← → : 左右移動
↓ : ソフトドロップ
↑ : 回転
Space : ハードドロップ / ゲーム開始
P : 一時停止/再開
R : リセット

Start ボタンまたは Space キーでゲームを開始してください。
        `.trim();
        
        console.log(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            z-index: 9999;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * Get game instance
     */
    getGame() {
        return this.game;
    }

    /**
     * Destroy game and clean up
     */
    destroy() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
    }
}

// Performance monitoring for 60fps target
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.isMonitoring = false;
    }

    start() {
        if (!this.isMonitoring) {
            this.isMonitoring = true;
            this.monitor();
        }
    }

    monitor() {
        if (!this.isMonitoring) return;
        
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Log performance warning if FPS drops below 50
            if (this.fps < 50) {
                console.warn(`Performance warning: FPS dropped to ${this.fps}`);
            }
        }
        
        requestAnimationFrame(() => this.monitor());
    }

    stop() {
        this.isMonitoring = false;
    }

    getFPS() {
        return this.fps;
    }
}

// Browser compatibility check
function checkBrowserCompatibility() {
    const features = {
        canvas: !!document.createElement('canvas').getContext,
        requestAnimationFrame: !!window.requestAnimationFrame,
        es6Classes: (() => {
            try {
                eval('class Test {}');
                return true;
            } catch (e) {
                return false;
            }
        })(),
        es6Modules: 'noModule' in HTMLScriptElement.prototype
    };
    
    const unsupported = Object.entries(features)
        .filter(([, supported]) => !supported)
        .map(([feature]) => feature);
    
    if (unsupported.length > 0) {
        console.warn('Unsupported browser features:', unsupported);
        return false;
    }
    
    return true;
}

// Initialize the game
let gameManager;
let performanceMonitor;

try {
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
        console.error('Browser is not compatible with this Tetris implementation');
    } else {
        // Initialize game manager
        gameManager = new GameManager();
        
        // Start performance monitoring in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            performanceMonitor = new PerformanceMonitor();
            performanceMonitor.start();
            
            // Make performance monitor accessible globally for debugging
            window.tetrisPerf = performanceMonitor;
        }
        
        // Make game accessible globally for debugging
        window.tetrisGame = gameManager;
    }
} catch (error) {
    console.error('Critical error during game initialization:', error);
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (gameManager) {
        gameManager.destroy();
    }
    if (performanceMonitor) {
        performanceMonitor.stop();
    }
});

// Handle page visibility change (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (gameManager && gameManager.getGame()) {
        const game = gameManager.getGame();
        if (document.hidden && game.isRunning && !game.isPaused) {
            game.togglePause();
        }
    }
});

export { GameManager, PerformanceMonitor };