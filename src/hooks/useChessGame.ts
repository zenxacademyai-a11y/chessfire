import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Position, PieceColor, PieceType, ChessPiece, createInitialBoard, getValidMoves, movePiece, isInCheck, isCheckmate } from '@/utils/chessLogic';
import { getBestMove } from '@/utils/chessAI';
import { buildMoveNotation, type MoveRecord } from '@/components/MoveHistoryPanel';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type GameMode = 'pvp' | 'pvai' | 'online';
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

interface OnlineConfig {
  roomId: string;
  playerColor: 'fire' | 'ice';
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
  const [onlineConfig, setOnlineConfig] = useState<OnlineConfig | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingRemoteMove = useRef(false);

  // Refs for snapshot capture
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

    return newBoard;
  }, [applyMoveResult]);

  // Push move to Supabase for online games
  const pushMoveOnline = useCallback(async (newBoard: Board, from: Position, to: Position, nextTurn: PieceColor) => {
    if (!onlineConfig) return;
    
    console.log('[Game] Pushing move online:', { from, to, nextTurn, roomId: onlineConfig.roomId });
    const { error } = await supabase
      .from('game_rooms')
      .update({
        board_state: newBoard as unknown as Json,
        current_turn: nextTurn,
        last_move: { from, to } as unknown as Json,
      })
      .eq('id', onlineConfig.roomId);
    
    if (error) console.error('[Game] Push move error:', error);
    else console.log('[Game] Move pushed successfully');
  }, [onlineConfig]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (animatingPiece || checkmatedColor || aiThinking) return;
    if (gameMode === 'pvai' && currentTurn === 'ice') return;
    // Online: only allow moves for your color
    if (gameMode === 'online' && onlineConfig && currentTurn !== onlineConfig.playerColor) return;
    if (viewingMoveIndex !== null) return;
    
    const piece = board[row][col];

    if (selectedPos) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        const newBoard = executeMove(selectedPos, { row, col }, board, currentTurn);
        setSelectedPos(null);
        setValidMoves([]);
        
        // Push to Supabase if online
        if (gameMode === 'online' && newBoard) {
          const nextTurn: PieceColor = currentTurn === 'fire' ? 'ice' : 'fire';
          pushMoveOnline(newBoard, selectedPos, { row, col }, nextTurn);
        }
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
  }, [board, selectedPos, validMoves, currentTurn, animatingPiece, checkmatedColor, gameMode, aiThinking, executeMove, viewingMoveIndex, onlineConfig, pushMoveOnline]);

  // Listen for opponent moves in online mode
  useEffect(() => {
    if (gameMode !== 'online' || !onlineConfig) return;

    const channel = supabase
      .channel(`game-${onlineConfig.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${onlineConfig.roomId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          
          // Detect rematch (opponent reset the room) - board is fresh and no last_move
          if (updated.status === 'playing' && !updated.last_move && updated.current_turn === 'fire' && !isApplyingRemoteMove.current) {
            resetGame();
            return;
          }
          
          // Only process if it's now our turn (meaning opponent just moved)
          if (updated.current_turn === onlineConfig.playerColor && updated.last_move && !isApplyingRemoteMove.current) {
            isApplyingRemoteMove.current = true;
            const move = updated.last_move as { from: Position; to: Position };
            
            // Use the board state from DB to avoid stale ref issues
            const remoteBoard = updated.board_state as unknown as Board;
            const opponentColor: PieceColor = onlineConfig.playerColor === 'fire' ? 'ice' : 'fire';
            
            // Execute the opponent's move with animation on our current local board
            executeMove(move.from, move.to, boardRef.current, opponentColor);
            
            // Reset flag after animation completes
            setTimeout(() => {
              isApplyingRemoteMove.current = false;
            }, 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameMode, onlineConfig, executeMove]);

  // Presence-based opponent disconnect detection
  useEffect(() => {
    if (gameMode !== 'online' || !onlineConfig) return;

    const sessionId = localStorage.getItem('chess_session_id') || '';
    const presenceChannel = supabase.channel(`presence-${onlineConfig.roomId}`, {
      config: { presence: { key: sessionId } },
    });

    let opponentSeen = false;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const keys = Object.keys(presenceState);
        const otherPlayers = keys.filter(k => k !== sessionId);

        if (otherPlayers.length > 0) {
          opponentSeen = true;
          setOpponentDisconnected(false);
        } else if (opponentSeen) {
          setOpponentDisconnected(true);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            color: onlineConfig.playerColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [gameMode, onlineConfig]);

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
    setOpponentDisconnected(false);
  }, []);

  const toggleGameMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  }, [resetGame]);

  const startOnlineGame = useCallback((roomId: string, playerColor: 'fire' | 'ice') => {
    setOnlineConfig({ roomId, playerColor });
    setGameMode('online');
    resetGame();
  }, [resetGame]);

  // Undo last move (PvP only, not online)
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

  const viewMove = useCallback((moveIndex: number) => {
    if (animatingPiece) return;
    
    if (moveIndex === moveHistory.length - 1) {
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

  const displayBoard = viewingMoveIndex !== null && viewingMoveIndex < boardHistory.length - 1
    ? boardHistory[viewingMoveIndex + 1].board
    : board;

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

  useEffect(() => {
    if (lastMove) setHintMove(null);
  }, [lastMove]);

  const claimVictory = useCallback(async () => {
    if (gameMode !== 'online' || !onlineConfig) return;
    const opponentColor: PieceColor = onlineConfig.playerColor === 'fire' ? 'ice' : 'fire';
    setCheckmatedColor(opponentColor);
    await supabase
      .from('game_rooms')
      .update({ status: 'finished', winner: onlineConfig.playerColor })
      .eq('id', onlineConfig.roomId);
  }, [gameMode, onlineConfig]);

  const rematchOnline = useCallback(async () => {
    if (gameMode !== 'online' || !onlineConfig) return;
    const freshBoard = createInitialBoard();
    resetGame();
    // Reset the room in DB with fresh board
    await supabase
      .from('game_rooms')
      .update({
        board_state: freshBoard as unknown as Json,
        current_turn: 'fire',
        last_move: null,
        status: 'playing',
        winner: null,
      })
      .eq('id', onlineConfig.roomId);
  }, [gameMode, onlineConfig, resetGame]);

  return {
    board: displayBoard, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    gameMode, aiThinking, lastMovedPieceType, aiDifficulty,
    hintMove, hintLoading, moveHistory, viewingMoveIndex,
    onlineConfig, opponentDisconnected,
    handleSquareClick, resetGame, toggleGameMode, setAiDifficulty, getHint,
    undoMove, viewMove, exitReplay, startOnlineGame, claimVictory, rematchOnline,
  };
}
