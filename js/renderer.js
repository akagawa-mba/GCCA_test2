/**
 * Tetris game renderer
 */

export class Renderer {
    constructor(gameCanvas, nextCanvas) {
        this.gameCanvas = gameCanvas;
        this.nextCanvas = nextCanvas;
        this.gameCtx = gameCanvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');
        
        // Grid settings
        this.CELL_SIZE = 30;
        this.BORDER_SIZE = 1;
        
        // Next piece canvas settings
        this.NEXT_CELL_SIZE = 20;
        
        // Colors
        this.GRID_COLOR = '#333';
        this.GHOST_ALPHA = 0.3;
        this.FLASH_COLOR = '#ffffff';
        
        this.setupCanvas();
    }

    setupCanvas() {
        // Set up game canvas
        this.gameCtx.imageSmoothingEnabled = false;
        this.gameCtx.lineWidth = this.BORDER_SIZE;
        
        // Set up next piece canvas
        this.nextCtx.imageSmoothingEnabled = false;
        this.nextCtx.lineWidth = 1;
    }

    /**
     * Render the entire game state
     */
    render(gameState) {
        this.clearGameCanvas();
        this.drawGrid();
        this.drawBoard(gameState.board);
        this.drawGhostPiece(gameState.currentPiece, gameState.board);
        this.drawPiece(gameState.currentPiece);
        this.drawFlashingLines(gameState.board);
        
        this.renderNextPiece(gameState.nextPiece);
    }

    /**
     * Clear the game canvas
     */
    clearGameCanvas() {
        this.gameCtx.fillStyle = '#000000';
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    }

    /**
     * Draw the grid lines
     */
    drawGrid() {
        this.gameCtx.strokeStyle = this.GRID_COLOR;
        this.gameCtx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= 10; x++) {
            const xPos = x * this.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(xPos, 0);
            this.gameCtx.lineTo(xPos, this.gameCanvas.height);
            this.gameCtx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= 20; y++) {
            const yPos = y * this.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, yPos);
            this.gameCtx.lineTo(this.gameCanvas.width, yPos);
            this.gameCtx.stroke();
        }
    }

    /**
     * Draw the game board
     */
    drawBoard(board) {
        const grid = board.getGrid();
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x]) {
                    this.drawCell(x, y, grid[y][x]);
                }
            }
        }
    }

    /**
     * Draw a single cell
     */
    drawCell(x, y, color, alpha = 1) {
        const xPos = x * this.CELL_SIZE;
        const yPos = y * this.CELL_SIZE;
        
        this.gameCtx.globalAlpha = alpha;
        
        // Fill cell
        this.gameCtx.fillStyle = color;
        this.gameCtx.fillRect(xPos + 1, yPos + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
        
        // Draw border for solid blocks
        if (alpha === 1) {
            this.gameCtx.strokeStyle = this.lightenColor(color, 20);
            this.gameCtx.lineWidth = 2;
            this.gameCtx.strokeRect(xPos + 1, yPos + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
        }
        
        this.gameCtx.globalAlpha = 1;
    }

    /**
     * Draw the current piece
     */
    drawPiece(piece) {
        if (!piece) return;
        
        const positions = piece.getOccupiedPositions();
        positions.forEach(pos => {
            if (pos.y >= 0) {
                this.drawCell(pos.x, pos.y, piece.color);
            }
        });
    }

    /**
     * Draw the ghost piece (preview of where piece will land)
     */
    drawGhostPiece(piece, board) {
        if (!piece) return;
        
        const dropY = board.getDropPosition(piece);
        const ghostPiece = piece.copy();
        ghostPiece.y = dropY;
        
        const positions = ghostPiece.getOccupiedPositions();
        positions.forEach(pos => {
            if (pos.y >= 0 && pos.y !== piece.y + (pos.y - ghostPiece.y)) {
                this.drawCell(pos.x, pos.y, piece.color, this.GHOST_ALPHA);
            }
        });
    }

    /**
     * Draw flashing lines
     */
    drawFlashingLines(board) {
        const flashingLines = board.getFlashingLines();
        
        flashingLines.forEach(lineY => {
            for (let x = 0; x < 10; x++) {
                this.drawCell(x, lineY, this.FLASH_COLOR, 0.8);
            }
        });
    }

    /**
     * Render the next piece
     */
    renderNextPiece(piece) {
        this.clearNextCanvas();
        
        if (!piece) return;
        
        // Get piece bounds for centering
        const bounds = piece.getBounds();
        const pieceWidth = bounds.maxX - bounds.minX + 1;
        const pieceHeight = bounds.maxY - bounds.minY + 1;
        
        const offsetX = Math.floor((6 - pieceWidth) / 2) - bounds.minX;
        const offsetY = Math.floor((6 - pieceHeight) / 2) - bounds.minY;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const drawX = (x + offsetX) * this.NEXT_CELL_SIZE;
                    const drawY = (y + offsetY) * this.NEXT_CELL_SIZE;
                    
                    this.nextCtx.fillStyle = piece.color;
                    this.nextCtx.fillRect(drawX, drawY, this.NEXT_CELL_SIZE - 1, this.NEXT_CELL_SIZE - 1);
                    
                    // Border
                    this.nextCtx.strokeStyle = this.lightenColor(piece.color, 20);
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(drawX, drawY, this.NEXT_CELL_SIZE - 1, this.NEXT_CELL_SIZE - 1);
                }
            }
        }
    }

    /**
     * Clear the next piece canvas
     */
    clearNextCanvas() {
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    }

    /**
     * Lighten a color by a percentage
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Create a pulsing effect for game over
     */
    renderGameOver() {
        this.gameCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    }
}