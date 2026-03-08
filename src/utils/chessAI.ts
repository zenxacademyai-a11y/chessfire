import { Board, Position, PieceColor, PieceType, getValidMoves, movePiece, isInCheck, isCheckmate } from './chessLogic';

// Piece values for evaluation
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

// Positional bonus tables (from white/fire perspective, row 7=home)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const KING_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];

function getPositionBonus(type: PieceType, row: number, col: number, color: PieceColor): number {
  // For ice (top), use table as-is. For fire (bottom), flip rows.
  const r = color === 'ice' ? row : 7 - row;
  switch (type) {
    case 'pawn': return PAWN_TABLE[r][col];
    case 'knight': return KNIGHT_TABLE[r][col];
    case 'bishop': return BISHOP_TABLE[r][col];
    case 'king': return KING_TABLE[r][col];
    default: return 0;
  }
}

// Evaluate board from the perspective of the given color
function evaluateBoard(board: Board, color: PieceColor): number {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const value = PIECE_VALUES[piece.type] + getPositionBonus(piece.type, row, col, piece.color);
      
      if (piece.color === color) {
        score += value;
      } else {
        score -= value;
      }
    }
  }
  
  // Bonus for checking the opponent
  const enemy: PieceColor = color === 'fire' ? 'ice' : 'fire';
  if (isInCheck(board, enemy)) score += 50;
  if (isInCheck(board, color)) score -= 50;
  
  return score;
}

// Get all possible moves for a color
function getAllMoves(board: Board, color: PieceColor): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col });
        for (const to of validMoves) {
          moves.push({ from: { row, col }, to });
        }
      }
    }
  }
  
  return moves;
}

// Order moves for better alpha-beta pruning (captures first)
function orderMoves(board: Board, moves: { from: Position; to: Position }[]): { from: Position; to: Position }[] {
  return moves.sort((a, b) => {
    const captA = board[a.to.row][a.to.col] ? PIECE_VALUES[board[a.to.row][a.to.col]!.type] : 0;
    const captB = board[b.to.row][b.to.col] ? PIECE_VALUES[board[b.to.row][b.to.col]!.type] : 0;
    return captB - captA;
  });
}

// Minimax with alpha-beta pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: PieceColor
): number {
  const currentColor: PieceColor = isMaximizing ? aiColor : (aiColor === 'fire' ? 'ice' : 'fire');
  
  if (depth === 0) return evaluateBoard(board, aiColor);
  
  if (isCheckmate(board, currentColor)) {
    return isMaximizing ? -99999 + (3 - depth) : 99999 - (3 - depth);
  }
  
  let moves = getAllMoves(board, currentColor);
  if (moves.length === 0) return evaluateBoard(board, aiColor); // Stalemate
  
  moves = orderMoves(board, moves);
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard } = movePiece(board, move.from, move.to);
      // Skip moves that leave own king in check
      if (isInCheck(newBoard, currentColor)) continue;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval === -Infinity ? -99999 : maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard } = movePiece(board, move.from, move.to);
      if (isInCheck(newBoard, currentColor)) continue;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval === Infinity ? 99999 : minEval;
  }
}

export function getBestMove(board: Board, aiColor: PieceColor, depth: number = 3): { from: Position; to: Position } | null {
  let moves = getAllMoves(board, aiColor);
  if (moves.length === 0) return null;
  
  moves = orderMoves(board, moves);
  
  // Filter out illegal moves (that leave king in check)
  const legalMoves = moves.filter(move => {
    const { newBoard } = movePiece(board, move.from, move.to);
    return !isInCheck(newBoard, aiColor);
  });
  
  if (legalMoves.length === 0) return null;
  
  let bestMove = legalMoves[0];
  let bestEval = -Infinity;
  
  for (const move of legalMoves) {
    const { newBoard } = movePiece(board, move.from, move.to);
    const evalScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false, aiColor);
    
    // Add small random factor to prevent repetitive play
    const randomFactor = Math.random() * 5;
    
    if (evalScore + randomFactor > bestEval) {
      bestEval = evalScore + randomFactor;
      bestMove = move;
    }
  }
  
  return bestMove;
}
