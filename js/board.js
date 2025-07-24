/**
 * Tetris game board logic
 */

export class GameBoard {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
        this.linesToFlash = [];
    }

    /**
     * Check if a position is valid (within bounds and not occupied)
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height && !this.grid[y][x];
    }

    /**
     * Check if a piece can be placed at the given position
     */
    canPlacePiece(piece, offsetX = 0, offsetY = 0) {
        const positions = piece.getOccupiedPositions();
        
        for (const pos of positions) {
            const newX = pos.x + offsetX;
            const newY = pos.y + offsetY;
            
            // Check bounds
            if (newX < 0 || newX >= this.width || newY >= this.height) {
                return false;
            }
            
            // Check collision with existing blocks (allow placement above visible area)
            if (newY >= 0 && this.grid[newY][newX]) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Place a piece on the board
     */
    placePiece(piece) {
        const positions = piece.getOccupiedPositions();
        
        for (const pos of positions) {
            if (pos.y >= 0 && pos.y < this.height && pos.x >= 0 && pos.x < this.width) {
                this.grid[pos.y][pos.x] = piece.color;
            }
        }
    }

    /**
     * Check for and clear completed lines
     * Returns the number of lines cleared
     */
    clearLines() {
        const completedLines = [];
        
        // Find completed lines
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y].every(cell => cell !== null)) {
                completedLines.push(y);
            }
        }
        
        if (completedLines.length === 0) {
            return 0;
        }

        // Store lines to flash
        this.linesToFlash = [...completedLines];
        
        // Remove completed lines and add new empty lines at the top
        completedLines.forEach(lineY => {
            this.grid.splice(lineY, 1);
            this.grid.unshift(Array(this.width).fill(null));
        });
        
        return completedLines.length;
    }

    /**
     * Clear the flashing lines
     */
    clearFlashingLines() {
        this.linesToFlash = [];
    }

    /**
     * Check if the game is over (top row has blocks)
     */
    isGameOver() {
        return this.grid[0].some(cell => cell !== null);
    }

    /**
     * Get the drop position for a piece (ghost piece position)
     */
    getDropPosition(piece) {
        let dropY = piece.y;
        
        while (this.canPlacePiece(piece, 0, dropY - piece.y + 1)) {
            dropY++;
        }
        
        return dropY;
    }

    /**
     * Reset the board
     */
    reset() {
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.linesToFlash = [];
    }

    /**
     * Get a copy of the grid
     */
    getGrid() {
        return this.grid.map(row => [...row]);
    }

    /**
     * Get the lines that should flash
     */
    getFlashingLines() {
        return [...this.linesToFlash];
    }

    /**
     * Get the height of the stack at a given column
     */
    getColumnHeight(x) {
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y][x] !== null) {
                return this.height - y;
            }
        }
        return 0;
    }

    /**
     * Get the total number of holes in the board
     */
    getHoleCount() {
        let holes = 0;
        
        for (let x = 0; x < this.width; x++) {
            let foundBlock = false;
            for (let y = 0; y < this.height; y++) {
                if (this.grid[y][x] !== null) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        
        return holes;
    }

    /**
     * Get aggregate height of all columns
     */
    getAggregateHeight() {
        let totalHeight = 0;
        for (let x = 0; x < this.width; x++) {
            totalHeight += this.getColumnHeight(x);
        }
        return totalHeight;
    }

    /**
     * Get bumpiness (sum of height differences between adjacent columns)
     */
    getBumpiness() {
        let bumpiness = 0;
        
        for (let x = 0; x < this.width - 1; x++) {
            const heightDiff = Math.abs(this.getColumnHeight(x) - this.getColumnHeight(x + 1));
            bumpiness += heightDiff;
        }
        
        return bumpiness;
    }
}