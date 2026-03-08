import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Position, PieceColor, PieceType, ChessPiece, createInitialBoard, getValidMoves, movePiece, isInCheck, isCheckmate } from '@/utils/chessLogic';
import { getBestMove } from '@/utils/chessAI';
import { buildMoveNotation, type MoveRecord } from '@/components/MoveHistoryPanel';

export type GameMode = 'pvp' | 'pvai';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AnimatingPiece {
  from: [number, number, number];
  to: [number, number, number];
  type: ChessPiece['type'];
  color: PieceColor;
  startTime: number;
  isKnight: boolean;
  isCapture: boolean;
  capturedType?: ChessPiece['type'];
  capturedColor?: PieceColor;
}

const AI_DEPTH: Record<AIDifficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 4,
};

function applyMoveResult(
  newBoard: Board,
  captured: ChessPiece | null,
  from: Position,
  to: Position,
  currentTurn: PieceColor,
  setters: {
    setBoard: (b: Board) => void;
    setLastMove: (m: { from: Position; to: Position }) => void;
    setMoveType: (t: 'move' | 'capture' | 'check' | 'checkmate') => void;
    setCapturedPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>;
    setCurrentTurn: (c: PieceColor) => void;
    setInCheck: (c: PieceColor | null) => void;
    setCheckmatedColor: (c: PieceColor | null) => void;
    setKingInCheckPos: (p: Position | null) => void;
    setSelectedPos: (p: Position | null) => void;
    setValidMoves: (m: Position[]) => void;
    setAnimatingPiece: (a: AnimatingPiece | null) => void;
    setMoveHistory: React.Dispatch<React.SetStateAction<MoveRecord[]>>;
  },
  movingPieceType: PieceType
) {
  const { setBoard, setLastMove, setMoveType, setCapturedPieces, setCurrentTurn, setInCheck, setCheckmatedColor, setKingInCheckPos, setSelectedPos, setValidMoves, setAnimatingPiece, setMoveHistory } = setters;
  
  setBoard(newBoard);
  setAnimatingPiece(null);
  setLastMove({ from, to });

  const nextTurn: PieceColor = currentTurn === 'fire' ? 'ice' : 'fire';

  if (captured) setCapturedPieces(prev => [...prev, captured]);

  const isCm = isCheckmate(newBoard, nextTurn);
  const isCk = !isCm && isInCheck(newBoard, nextTurn);

  // Build move record
  const notation = buildMoveNotation(movingPieceType, from, to, !!captured, isCk, isCm);
  setMoveHistory(prev => [...prev, {
    moveNumber: Math.floor(prev.length / 2) + 1,
    color: currentTurn,
    pieceType: movingPieceType,
    from, to,
    isCapture: !!captured,
    isCheck: isCk,
    isCheckmate: isCm,
    notation,
  }]);

  if (isCm) {
    setMoveType('checkmate');
    setCheckmatedColor(nextTurn);
    setInCheck(nextTurn);
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (newBoard[r][c]?.type === 'king' && newBoard[r][c]?.color === nextTurn)
          setKingInCheckPos({ row: r, col: c });
  } else if (isCk) {
    setMoveType('check');
    setInCheck(nextTurn);
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (newBoard[r][c]?.type === 'king' && newBoard[r][c]?.color === nextTurn)
          setKingInCheckPos({ row: r, col: c });
  } else {
    setMoveType(captured ? 'capture' : 'move');
    setInCheck(null);
    setKingInCheckPos(null);
  }

  setCurrentTurn(nextTurn);
  setSelectedPos(null);
  setValidMoves([]);
}

export interface BoardSnapshot {
  board: Board;
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  lastMove: { from: Position; to: Position } | null;
  inCheck: PieceColor | null;
  checkmatedColor: PieceColor | null;
  kingInCheckPos: Position | null;
}

export function useChessGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('fire');
  const [capturedPieces, setCapturedPieces] = useState<ChessPiece[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [moveType, setMoveType] = useState<'move' | 'capture' | 'check' | 'checkmate' | null>(null);
  const [lastMovedPieceType, setLastMovedPieceType] = useState<PieceType | null>(null);
  const [inCheck, setInCheck] = useState<PieceColor | null>(null);
  const [checkmatedColor, setCheckmatedColor] = useState<PieceColor | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [kingInCheckPos, setKingInCheckPos] = useState<Position | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [aiThinking, setAiThinking] = useState(false);
  const [hintMove, setHintMove] = useState<{ from: Position; to: Position } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [boardHistory, setBoardHistory] = useState<BoardSnapshot[]>([]);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setters = {
    setBoard, setLastMove, setMoveType, setCapturedPieces, setCurrentTurn,
    setInCheck, setCheckmatedColor, setKingInCheckPos, setSelectedPos,
    setValidMoves, setAnimatingPiece, setMoveHistory,
  };

  const executeMove = useCallback((from: Position, to: Position, boardState: Board, turn: PieceColor) => {
    const movingPiece = boardState[from.row][from.col]!;
    const targetPiece = boardState[to.row][to.col];
    const fromPos: [number, number, number] = [from.col - 3.5, 0.08, from.row - 3.5];
    const toPos: [number, number, number] = [to.col - 3.5, 0.08, to.row - 3.5];
    const isCapture = !!targetPiece && targetPiece.color !== movingPiece.color;

    setLastMovedPieceType(movingPiece.type);
    setAnimatingPiece({
      from: fromPos, to: toPos,
      type: movingPiece.type, color: movingPiece.color,
      startTime: Date.now(), isKnight: movingPiece.type === 'knight',
      isCapture,
      capturedType: isCapture ? targetPiece!.type : undefined,
      capturedColor: isCapture ? targetPiece!.color : undefined,
    });

    const { newBoard, captured } = movePiece(boardState, from, to);
    const durations: Record<string, number> = { knight: 900, rook: 500, bishop: 700, queen: 800, king: 800, pawn: 400 };
    const animDuration = isCapture
      ? (movingPiece.type === 'knight' ? 1000 : movingPiece.type === 'queen' ? 900 : 800)
      : (durations[movingPiece.type] || 500);

    setTimeout(() => {
      applyMoveResult(newBoard, captured, from, to, turn, setters, movingPiece.type);
    }, animDuration);
  }, []);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (animatingPiece || checkmatedColor || aiThinking) return;
    if (gameMode === 'pvai' && currentTurn === 'ice') return;
    
    const piece = board[row][col];

    if (selectedPos) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        executeMove(selectedPos, { row, col }, board, currentTurn);
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }
      
      if (piece && piece.color === currentTurn) {
        setSelectedPos({ row, col });
        setValidMoves(getValidMoves(board, { row, col }));
        return;
      }
      
      setSelectedPos(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === currentTurn) {
      setSelectedPos({ row, col });
      setValidMoves(getValidMoves(board, { row, col }));
    }
  }, [board, selectedPos, validMoves, currentTurn, animatingPiece, checkmatedColor, gameMode, aiThinking, executeMove]);

  // AI move trigger
  useEffect(() => {
    if (gameMode !== 'pvai' || currentTurn !== 'ice' || checkmatedColor || animatingPiece) return;
    
    setAiThinking(true);
    const depth = AI_DEPTH[aiDifficulty];
    
    aiTimeoutRef.current = setTimeout(() => {
      const bestMove = getBestMove(board, 'ice', depth);
      
      if (bestMove) {
        executeMove(bestMove.from, bestMove.to, board, 'ice');
      }
      setAiThinking(false);
    }, 500);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [currentTurn, gameMode, checkmatedColor, board, animatingPiece, executeMove, aiDifficulty]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setBoard(createInitialBoard());
    setSelectedPos(null);
    setValidMoves([]);
    setCurrentTurn('fire');
    setCapturedPieces([]);
    setLastMove(null);
    setMoveType(null);
    setInCheck(null);
    setCheckmatedColor(null);
    setAnimatingPiece(null);
    setKingInCheckPos(null);
    setAiThinking(false);
    setHintMove(null);
    setHintLoading(false);
    setMoveHistory([]);
  }, []);

  const toggleGameMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  }, [resetGame]);

  // Get hint - run AI for the player's color
  const getHint = useCallback(() => {
    if (checkmatedColor || animatingPiece || aiThinking || hintLoading) return;
    if (gameMode === 'pvai' && currentTurn === 'ice') return; // no hint during AI turn
    
    setHintLoading(true);
    setHintMove(null);
    
    setTimeout(() => {
      const best = getBestMove(board, currentTurn, 3);
      setHintMove(best);
      setHintLoading(false);
      // Auto-clear hint after 5 seconds
      setTimeout(() => setHintMove(null), 5000);
    }, 100);
  }, [board, currentTurn, checkmatedColor, animatingPiece, aiThinking, hintLoading, gameMode]);

  // Clear hint when a move is made
  useEffect(() => {
    if (lastMove) setHintMove(null);
  }, [lastMove]);

  return {
    board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    gameMode, aiThinking, lastMovedPieceType, aiDifficulty,
    hintMove, hintLoading, moveHistory,
    handleSquareClick, resetGame, toggleGameMode, setAiDifficulty, getHint
  };
}
