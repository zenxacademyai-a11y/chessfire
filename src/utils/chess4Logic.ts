/**
 * 4-Player Chess Logic
 * 
 * Board: 14×14 grid with 3×3 corners removed (cross/plus shape)
 * Players: fire (south), ice (north), emerald (west), purple (east)
 * Turn order: fire → emerald → ice → purple (clockwise)
 * Elimination: when checkmated, pieces become neutral (removed) and player is eliminated
 */

export type PieceType4 = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PlayerColor = 'fire' | 'ice' | 'emerald' | 'purple';

export const TURN_ORDER: PlayerColor[] = ['fire', 'emerald', 'ice', 'purple'];
export const BOARD_SIZE = 14;

export interface ChessPiece4 {
  type: PieceType4;
  color: PlayerColor;
}

export type Board4 = (ChessPiece4 | null | 'dead')[][];

export interface Position4 {
  row: number;
  col: number;
}

// Dead zones: 3×3 corners
export function isDead(row: number, col: number): boolean {
  const inCornerTL = row < 3 && col < 3;
  const inCornerTR = row < 3 && col > 10;
  const inCornerBL = row > 10 && col < 3;
  const inCornerBR = row > 10 && col > 10;
  return inCornerTL || inCornerTR || inCornerBL || inCornerBR;
}

export function inBounds4(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && !isDead(row, col);
}

/**
 * Pawn direction per color:
 * - fire (south, rows 12-13): moves UP (row decreasing)
 * - ice (north, rows 0-1): moves DOWN (row increasing)
 * - emerald (west, cols 0-1): moves RIGHT (col increasing)
 * - purple (east, cols 12-13): moves LEFT (col decreasing)
 */
export function getPawnDirection(color: PlayerColor): { dr: number; dc: number } {
  switch (color) {
    case 'fire': return { dr: -1, dc: 0 };
    case 'ice': return { dr: 1, dc: 0 };
    case 'emerald': return { dr: 0, dc: 1 };
    case 'purple': return { dr: 0, dc: -1 };
  }
}

export function getPawnStartRow(color: PlayerColor): (pos: Position4) => boolean {
  switch (color) {
    case 'fire': return (p) => p.row === 12;
    case 'ice': return (p) => p.row === 1;
    case 'emerald': return (p) => p.col === 1;
    case 'purple': return (p) => p.col === 12;
  }
}

export function isPawnPromotionSquare(color: PlayerColor, row: number, col: number): boolean {
  switch (color) {
    case 'fire': return row <= 2; // Reached ice's back ranks or beyond
    case 'ice': return row >= 11;
    case 'emerald': return col >= 11;
    case 'purple': return col <= 2;
  }
}

export function createInitialBoard4(): Board4 {
  const board: Board4 = Array(BOARD_SIZE).fill(null).map((_, r) =>
    Array(BOARD_SIZE).fill(null).map((_, c) => isDead(r, c) ? 'dead' as const : null)
  );

  const backRow: PieceType4[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  // Ice (north) — row 0: back rank, row 1: pawns, cols 3–10
  for (let i = 0; i < 8; i++) {
    board[0][3 + i] = { type: backRow[i], color: 'ice' };
    board[1][3 + i] = { type: 'pawn', color: 'ice' };
  }

  // Fire (south) — row 13: back rank, row 12: pawns, cols 3–10
  for (let i = 0; i < 8; i++) {
    board[13][3 + i] = { type: backRow[i], color: 'fire' };
    board[12][3 + i] = { type: 'pawn', color: 'fire' };
  }

  // Emerald (west) — col 0: back rank, col 1: pawns, rows 3–10
  const sideBackRow: PieceType4[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let i = 0; i < 8; i++) {
    board[3 + i][0] = { type: sideBackRow[i], color: 'emerald' };
    board[3 + i][1] = { type: 'pawn', color: 'emerald' };
  }

  // Purple (east) — col 13: back rank, col 12: pawns, rows 3–10
  for (let i = 0; i < 8; i++) {
    board[3 + i][13] = { type: sideBackRow[7 - i], color: 'purple' };
    board[3 + i][12] = { type: 'pawn', color: 'purple' };
  }

  return board;
}

function isEmptySquare(board: Board4, r: number, c: number): boolean {
  return inBounds4(r, c) && board[r][c] === null;
}

function isEnemyPiece(board: Board4, r: number, c: number, myColor: PlayerColor): boolean {
  if (!inBounds4(r, c)) return false;
  const cell = board[r][c];
  return cell !== null && cell !== 'dead' && cell.color !== myColor;
}

function canMoveToSquare(board: Board4, r: number, c: number, myColor: PlayerColor): boolean {
  return isEmptySquare(board, r, c) || isEnemyPiece(board, r, c, myColor);
}

export function getValidMoves4(board: Board4, from: Position4, eliminatedPlayers: PlayerColor[] = []): Position4[] {
  const cell = board[from.row][from.col];
  if (!cell || cell === 'dead') return [];
  const piece = cell as ChessPiece4;
  const { type, color } = piece;
  const moves: Position4[] = [];

  if (eliminatedPlayers.includes(color)) return [];

  const addLineMoves = (dr: number, dc: number) => {
    let r = from.row + dr, c = from.col + dc;
    while (inBounds4(r, c)) {
      const target = board[r][c];
      if (target === 'dead') break;
      if (target !== null) {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr; c += dc;
    }
  };

  switch (type) {
    case 'pawn': {
      const { dr, dc } = getPawnDirection(color);
      const isStart = getPawnStartRow(color)(from);
      // Forward 1
      const r1 = from.row + dr, c1 = from.col + dc;
      if (isEmptySquare(board, r1, c1)) {
        moves.push({ row: r1, col: c1 });
        // Forward 2 from start
        if (isStart) {
          const r2 = from.row + dr * 2, c2 = from.col + dc * 2;
          if (isEmptySquare(board, r2, c2)) {
            moves.push({ row: r2, col: c2 });
          }
        }
      }
      // Captures (perpendicular to movement direction)
      const captureOffsets = dr !== 0 
        ? [{ dr, dc: -1 }, { dr, dc: 1 }]  // vertical movers capture diagonally
        : [{ dr: -1, dc }, { dr: 1, dc }];  // horizontal movers capture diagonally
      
      for (const off of captureOffsets) {
        const cr = from.row + off.dr, cc = from.col + off.dc;
        if (isEnemyPiece(board, cr, cc, color)) {
          moves.push({ row: cr, col: cc });
        }
      }
      break;
    }
    case 'knight':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
        const r = from.row + dr, c = from.col + dc;
        if (canMoveToSquare(board, r, c, color)) moves.push({ row: r, col: c });
      });
      break;
    case 'bishop':
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'rook':
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'queen':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'king':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => {
        const r = from.row + dr, c = from.col + dc;
        if (canMoveToSquare(board, r, c, color)) moves.push({ row: r, col: c });
      });
      break;
  }

  // Filter out moves that would leave own king in check
  return moves.filter(to => {
    const { newBoard } = movePiece4(board, from, to);
    return !isInCheck4(newBoard, color, eliminatedPlayers);
  });
}

export function movePiece4(board: Board4, from: Position4, to: Position4): { newBoard: Board4; captured: ChessPiece4 | null } {
  const newBoard: Board4 = board.map(row => [...row]);
  const target = newBoard[to.row][to.col];
  const captured = (target && target !== 'dead') ? target : null;
  const piece = newBoard[from.row][from.col] as ChessPiece4;
  
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // Pawn promotion
  if (piece.type === 'pawn' && isPawnPromotionSquare(piece.color, to.row, to.col)) {
    newBoard[to.row][to.col] = { type: 'queen', color: piece.color };
  }

  return { newBoard, captured };
}

export function findKing4(board: Board4, color: PlayerColor): Position4 | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell !== 'dead' && cell.type === 'king' && cell.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isInCheck4(board: Board4, color: PlayerColor, eliminatedPlayers: PlayerColor[] = []): boolean {
  const kingPos = findKing4(board, color);
  if (!kingPos) return false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell !== 'dead' && cell.color !== color && !eliminatedPlayers.includes(cell.color)) {
        // Get raw moves without check filtering to avoid recursion
        const rawMoves = getRawMoves(board, { row: r, col: c });
        if (rawMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Raw moves without check filtering (to avoid infinite recursion in isInCheck4)
function getRawMoves(board: Board4, from: Position4): Position4[] {
  const cell = board[from.row][from.col];
  if (!cell || cell === 'dead') return [];
  const piece = cell as ChessPiece4;
  const { type, color } = piece;
  const moves: Position4[] = [];

  const addLineMoves = (dr: number, dc: number) => {
    let r = from.row + dr, c = from.col + dc;
    while (inBounds4(r, c)) {
      const target = board[r][c];
      if (target === 'dead') break;
      if (target !== null) {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr; c += dc;
    }
  };

  switch (type) {
    case 'pawn': {
      const { dr, dc } = getPawnDirection(color);
      const captureOffsets = dr !== 0
        ? [{ dr, dc: -1 }, { dr, dc: 1 }]
        : [{ dr: -1, dc }, { dr: 1, dc }];
      for (const off of captureOffsets) {
        const cr = from.row + off.dr, cc = from.col + off.dc;
        if (isEnemyPiece(board, cr, cc, color)) moves.push({ row: cr, col: cc });
      }
      break;
    }
    case 'knight':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
        const r = from.row + dr, c = from.col + dc;
        if (canMoveToSquare(board, r, c, color)) moves.push({ row: r, col: c });
      });
      break;
    case 'bishop':
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'rook':
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'queen':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => addLineMoves(dr, dc));
      break;
    case 'king':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => {
        const r = from.row + dr, c = from.col + dc;
        if (canMoveToSquare(board, r, c, color)) moves.push({ row: r, col: c });
      });
      break;
  }
  return moves;
}

export function isCheckmate4(board: Board4, color: PlayerColor, eliminatedPlayers: PlayerColor[] = []): boolean {
  if (!isInCheck4(board, color, eliminatedPlayers)) return false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell !== 'dead' && cell.color === color) {
        const moves = getValidMoves4(board, { row: r, col: c }, eliminatedPlayers);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

/** Remove all pieces of an eliminated player from the board */
export function eliminatePlayer(board: Board4, color: PlayerColor): Board4 {
  return board.map(row => row.map(cell => {
    if (cell && cell !== 'dead' && cell.color === color) return null;
    return cell;
  }));
}

/** Get next active player in turn order */
export function getNextTurn(current: PlayerColor, eliminatedPlayers: PlayerColor[]): PlayerColor {
  const idx = TURN_ORDER.indexOf(current);
  for (let i = 1; i <= 4; i++) {
    const next = TURN_ORDER[(idx + i) % 4];
    if (!eliminatedPlayers.includes(next)) return next;
  }
  return current; // shouldn't happen
}

/** Count remaining active players */
export function countActivePlayers(eliminatedPlayers: PlayerColor[]): number {
  return 4 - eliminatedPlayers.length;
}
