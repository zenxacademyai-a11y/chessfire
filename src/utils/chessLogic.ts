export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'fire' | 'ice';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type Board = (ChessPiece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'ice' };
    board[1][col] = { type: 'pawn', color: 'ice' };
    board[6][col] = { type: 'pawn', color: 'fire' };
    board[7][col] = { type: backRow[col], color: 'fire' };
  }
  
  return board;
}

export function getValidMoves(board: Board, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  
  const moves: Position[] = [];
  const { type, color } = piece;
  
  const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isEmpty = (r: number, c: number) => inBounds(r, c) && !board[r][c];
  const isEnemy = (r: number, c: number) => inBounds(r, c) && board[r][c] !== null && board[r][c]!.color !== color;
  const canMoveTo = (r: number, c: number) => isEmpty(r, c) || isEnemy(r, c);
  
  const addLineMoves = (dr: number, dc: number) => {
    let r = from.row + dr, c = from.col + dc;
    while (inBounds(r, c)) {
      if (board[r][c]) {
        if (board[r][c]!.color !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr; c += dc;
    }
  };
  
  switch (type) {
    case 'pawn': {
      const dir = color === 'fire' ? -1 : 1;
      const startRow = color === 'fire' ? 6 : 1;
      if (isEmpty(from.row + dir, from.col)) {
        moves.push({ row: from.row + dir, col: from.col });
        if (from.row === startRow && isEmpty(from.row + 2 * dir, from.col)) {
          moves.push({ row: from.row + 2 * dir, col: from.col });
        }
      }
      [-1, 1].forEach(dc => {
        if (isEnemy(from.row + dir, from.col + dc)) {
          moves.push({ row: from.row + dir, col: from.col + dc });
        }
      });
      break;
    }
    case 'knight':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
        const r = from.row + dr, c = from.col + dc;
        if (canMoveTo(r, c)) moves.push({ row: r, col: c });
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
        if (canMoveTo(r, c)) moves.push({ row: r, col: c });
      });
      break;
  }
  
  return moves;
}

export function movePiece(board: Board, from: Position, to: Position): { newBoard: Board; captured: ChessPiece | null } {
  const newBoard = board.map(row => [...row]);
  const captured = newBoard[to.row][to.col];
  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  
  // Pawn promotion
  const piece = newBoard[to.row][to.col];
  if (piece?.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    newBoard[to.row][to.col] = { type: 'queen', color: piece.color };
  }
  
  return { newBoard, captured };
}

export const pieceSymbols: Record<PieceType, string> = {
  king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟'
};
