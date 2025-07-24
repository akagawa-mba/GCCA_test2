/**
 * Tetromino piece definitions and utilities
 * SRS (Super Rotation System) compliant
 */

export const PIECES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00ffff', // シアン
        spawn: { x: 3, y: 0 }
    },
    O: {
        shape: [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#ffff00', // 黄色
        spawn: { x: 4, y: 0 }
    },
    T: {
        shape: [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#aa00ff', // 紫
        spawn: { x: 3, y: 0 }
    },
    S: {
        shape: [
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00ff00', // 緑
        spawn: { x: 3, y: 0 }
    },
    Z: {
        shape: [
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#ff0000', // 赤
        spawn: { x: 3, y: 0 }
    },
    J: {
        shape: [
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#0000ff', // 青
        spawn: { x: 3, y: 0 }
    },
    L: {
        shape: [
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#ff7f00', // オレンジ
        spawn: { x: 3, y: 0 }
    }
};

export const PIECE_TYPES = Object.keys(PIECES);

/**
 * Create a new piece instance
 */
export class Piece {
    constructor(type, x, y) {
        const pieceData = PIECES[type];
        this.type = type;
        this.shape = pieceData.shape.map(row => [...row]); // Deep copy
        this.color = pieceData.color;
        this.x = x !== undefined ? x : pieceData.spawn.x;
        this.y = y !== undefined ? y : pieceData.spawn.y;
        this.rotation = 0;
    }

    /**
     * Get a random piece type
     */
    static getRandomType() {
        return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    }

    /**
     * Rotate the piece 90 degrees clockwise
     */
    rotate() {
        const size = this.shape.length;
        const rotated = Array(size).fill().map(() => Array(size).fill(0));
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                rotated[x][size - 1 - y] = this.shape[y][x];
            }
        }
        
        this.shape = rotated;
        this.rotation = (this.rotation + 1) % 4;
    }

    /**
     * Get wall kick offsets for SRS
     */
    getWallKickOffsets(from, to) {
        // Standard SRS wall kick data
        const wallKickData = {
            'I': {
                '0->1': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
                '1->0': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
                '1->2': [[-1, 0], [2, 0], [-1, 2], [2, -1]],
                '2->1': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
                '2->3': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
                '3->2': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
                '3->0': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
                '0->3': [[-1, 0], [2, 0], [-1, 2], [2, -1]]
            },
            'JLSTZ': {
                '0->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
                '1->0': [[1, 0], [1, -1], [0, 2], [1, 2]],
                '1->2': [[1, 0], [1, -1], [0, 2], [1, 2]],
                '2->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
                '2->3': [[1, 0], [1, 1], [0, -2], [1, -2]],
                '3->2': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
                '3->0': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
                '0->3': [[1, 0], [1, 1], [0, -2], [1, -2]]
            }
        };

        const key = `${from}->${to}`;
        if (this.type === 'I') {
            return wallKickData.I[key] || [[0, 0]];
        } else if (this.type !== 'O') {
            return wallKickData.JLSTZ[key] || [[0, 0]];
        }
        return [[0, 0]]; // O piece doesn't need wall kicks
    }

    /**
     * Create a copy of this piece
     */
    copy() {
        const copy = new Piece(this.type, this.x, this.y);
        copy.shape = this.shape.map(row => [...row]);
        copy.rotation = this.rotation;
        return copy;
    }

    /**
     * Get the occupied positions of this piece
     */
    getOccupiedPositions() {
        const positions = [];
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    positions.push({
                        x: this.x + x,
                        y: this.y + y
                    });
                }
            }
        }
        return positions;
    }

    /**
     * Get the bounding box of the piece
     */
    getBounds() {
        let minX = 4, maxX = -1, minY = 4, maxY = -1;
        
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        return { minX, maxX, minY, maxY };
    }
}