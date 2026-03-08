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

export interface BoardSnapshot {
  board: Board;
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  lastMove: { from: Position; to: Position } | null;
  inCheck: PieceColor | null;
  checkmatedColor: PieceColor | null;
  kingInCheckPos: Position | null;
}

const AI_DEPTH: Record<AIDifficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 4,
};

function deepCopyBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
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

  // Refs for snapshot capture (to avoid stale closures)
  const boardRef = useRef(board);
  const capturedRef = useRef(capturedPieces);
  const lastMoveRef = useRef(lastMove);
  const inCheckRef = useRef(inCheck);
  const checkmatedRef = useRef(checkmatedColor);
  const kingCheckRef = useRef(kingInCheckPos);
  const currentTurnRef = useRef(currentTurn);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { capturedRef.current = capturedPieces; }, [capturedPieces]);
  useEffect(() => { lastMoveRef.current = lastMove; }, [lastMove]);
  useEffect(() => { inCheckRef.current = inCheck; }, [inCheck]);
  useEffect(() => { checkmatedRef.current = checkmatedColor; }, [checkmatedColor]);
  useEffect(() => { kingCheckRef.current = kingInCheckPos; }, [kingInCheckPos]);
  useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);

  const applyMoveResult = useCallback((
    newBoard: Board,
    captured: ChessPiece | null,
    from: Position,
    to: Position,
    turn: PieceColor,
    movingPieceType: PieceType
  ) => {
    // Save snapshot before applying
    setBoardHistory(prev => [...prev, {
      board: deepCopyBoard(boardRef.current),
      currentTurn: currentTurnRef.current,
      capturedPieces: [...capturedRef.current],
      lastMove: lastMoveRef.current,
      inCheck: inCheckRef.current,
      checkmatedColor: checkmatedRef.current,
      kingInCheckPos: kingCheckRef.current,
    }]);
    setViewingMoveIndex(null);

    setBoard(newBoard);
    setAnimatingPiece(null);
    setLastMove({ from, to });

    const nextTurn: PieceColor = turn === 'fire' ? 'ice' : 'fire';
    if (captured) setCapturedPieces(prev => [...prev, captured]);

    const isCm = isCheckmate(newBoard, nextTurn);
    const isCk = !isCm && isInCheck(newBoard, nextTurn);

    const notation = buildMoveNotation(movingPieceType, from, to, !!captured, isCk, isCm);
    setMoveHistory(prev => [...prev, {
      moveNumber: Math.floor(prev.length / 2) + 1,
      color: turn,
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
  }, []);

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
      applyMoveResult(newBoard, captured, from, to, turn, movingPiece.type);
    }, animDuration);
  }, [applyMoveResult]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (animatingPiece || checkmatedColor || aiThinking) return;
    if (gameMode === 'pvai' && currentTurn === 'ice') return;
    if (viewingMoveIndex !== null) return; // Can't move while viewing history
    
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
  }, [board, selectedPos, validMoves, currentTurn, animatingPiece, checkmatedColor, gameMode, aiThinking, executeMove, viewingMoveIndex]);

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
    setBoardHistory([]);
    setViewingMoveIndex(null);
  }, []);

  const toggleGameMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  }, [resetGame]);

  // Undo last move (PvP only)
  const undoMove = useCallback(() => {
    if (gameMode !== 'pvp' || animatingPiece || boardHistory.length === 0) return;

    const lastSnapshot = boardHistory[boardHistory.length - 1];
    setBoard(lastSnapshot.board);
    setCurrentTurn(lastSnapshot.currentTurn);
    setCapturedPieces(lastSnapshot.capturedPieces);
    setLastMove(lastSnapshot.lastMove);
    setInCheck(lastSnapshot.inCheck);
    setCheckmatedColor(lastSnapshot.checkmatedColor);
    setKingInCheckPos(lastSnapshot.kingInCheckPos);
    setSelectedPos(null);
    setValidMoves([]);
    setMoveType(null);
    setAnimatingPiece(null);
    setHintMove(null);
    setViewingMoveIndex(null);
    setBoardHistory(prev => prev.slice(0, -1));
    setMoveHistory(prev => prev.slice(0, -1));
  }, [gameMode, animatingPiece, boardHistory]);

  // View a specific move in history (click-to-replay)
  const viewMove = useCallback((moveIndex: number) => {
    if (animatingPiece) return;
    
    // moveIndex is 0-based into moveHistory
    // boardHistory[i] = snapshot BEFORE move i was made
    // So after move i, the state is: apply move i to boardHistory[i]
    // But we stored the board state AFTER the move in the next snapshot's "before" state
    // Actually: boardHistory[i] = state before move[i], so state after move[i] = boardHistory[i+1] or current state
    
    if (moveIndex === moveHistory.length - 1) {
      // Viewing the latest move = back to live
      setViewingMoveIndex(null);
      return;
    }
    
    if (moveIndex >= 0 && moveIndex < moveHistory.length - 1) {
      setViewingMoveIndex(moveIndex);
    }
  }, [animatingPiece, moveHistory.length]);

  const exitReplay = useCallback(() => {
    setViewingMoveIndex(null);
  }, []);

  // Get the board to display (either live or historical)
  const displayBoard = viewingMoveIndex !== null && viewingMoveIndex < boardHistory.length - 1
    ? boardHistory[viewingMoveIndex + 1].board
    : board;

  // Get hint
  const getHint = useCallback(() => {
    if (checkmatedColor || animatingPiece || aiThinking || hintLoading) return;
    if (gameMode === 'pvai' && currentTurn === 'ice') return;
    
    setHintLoading(true);
    setHintMove(null);
    
    setTimeout(() => {
      const best = getBestMove(board, currentTurn, 3);
      setHintMove(best);
      setHintLoading(false);
      setTimeout(() => setHintMove(null), 5000);
    }, 100);
  }, [board, currentTurn, checkmatedColor, animatingPiece, aiThinking, hintLoading, gameMode]);

  // Clear hint when a move is made
  useEffect(() => {
    if (lastMove) setHintMove(null);
  }, [lastMove]);

  return {
    board: displayBoard, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    gameMode, aiThinking, lastMovedPieceType, aiDifficulty,
    hintMove, hintLoading, moveHistory, viewingMoveIndex,
    handleSquareClick, resetGame, toggleGameMode, setAiDifficulty, getHint,
    undoMove, viewMove, exitReplay,
  };
}
