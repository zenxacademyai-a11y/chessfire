import { useState, useCallback } from 'react';
import {
  Board4, Position4, PlayerColor, ChessPiece4,
  createInitialBoard4, getValidMoves4, movePiece4,
  isInCheck4, isCheckmate4, eliminatePlayer, getNextTurn,
  countActivePlayers, TURN_ORDER,
} from '@/utils/chess4Logic';

export interface Chess4State {
  board: Board4;
  currentTurn: PlayerColor;
  selectedPos: Position4 | null;
  validMoves: Position4[];
  capturedPieces: ChessPiece4[];
  lastMove: { from: Position4; to: Position4 } | null;
  inCheck: PlayerColor | null;
  eliminatedPlayers: PlayerColor[];
  winner: PlayerColor | null;
  gameOver: boolean;
  kingInCheckPos: Position4 | null;
}

export function useChess4Game() {
  const [board, setBoard] = useState<Board4>(createInitialBoard4);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('fire');
  const [selectedPos, setSelectedPos] = useState<Position4 | null>(null);
  const [validMoves, setValidMoves] = useState<Position4[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<ChessPiece4[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position4; to: Position4 } | null>(null);
  const [inCheck, setInCheck] = useState<PlayerColor | null>(null);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<PlayerColor[]>([]);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [kingInCheckPos, setKingInCheckPos] = useState<Position4 | null>(null);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameOver) return;

    const cell = board[row][col];
    const piece = (cell && cell !== 'dead') ? cell : null;

    if (selectedPos) {
      // Check if clicking a valid move target
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      if (isValid) {
        // Execute move
        const { newBoard, captured } = movePiece4(board, selectedPos, { row, col });
        
        if (captured) {
          setCapturedPieces(prev => [...prev, captured]);
        }

        setBoard(newBoard);
        setLastMove({ from: selectedPos, to: { row, col } });
        setSelectedPos(null);
        setValidMoves([]);

        // Determine next turn
        const nextTurn = getNextTurn(currentTurn, eliminatedPlayers);
        
        // Check for check/checkmate on all other active players
        let newEliminated = [...eliminatedPlayers];
        let updatedBoard = newBoard;

        for (const color of TURN_ORDER) {
          if (color === currentTurn || newEliminated.includes(color)) continue;
          
          if (isCheckmate4(updatedBoard, color, newEliminated)) {
            newEliminated = [...newEliminated, color];
            updatedBoard = eliminatePlayer(updatedBoard, color);
            setBoard(updatedBoard);
          }
        }

        setEliminatedPlayers(newEliminated);

        // Check for winner (last player standing)
        const activePlayers = TURN_ORDER.filter(c => !newEliminated.includes(c));
        if (activePlayers.length === 1) {
          setWinner(activePlayers[0]);
          setGameOver(true);
          setInCheck(null);
          setKingInCheckPos(null);
          return;
        }

        // Update check status for next player
        const actualNextTurn = getNextTurn(currentTurn, newEliminated);
        if (isInCheck4(updatedBoard, actualNextTurn, newEliminated)) {
          setInCheck(actualNextTurn);
          // Find king position for visual indicator
          for (let r = 0; r < 14; r++) {
            for (let c = 0; c < 14; c++) {
              const sq = updatedBoard[r][c];
              if (sq && sq !== 'dead' && sq.type === 'king' && sq.color === actualNextTurn) {
                setKingInCheckPos({ row: r, col: c });
              }
            }
          }
        } else {
          setInCheck(null);
          setKingInCheckPos(null);
        }

        setCurrentTurn(actualNextTurn);
        return;
      }

      // Clicking own piece — reselect
      if (piece && piece.color === currentTurn) {
        setSelectedPos({ row, col });
        setValidMoves(getValidMoves4(board, { row, col }, eliminatedPlayers));
        return;
      }

      // Clicking empty/enemy — deselect
      setSelectedPos(null);
      setValidMoves([]);
      return;
    }

    // No piece selected — select own piece
    if (piece && piece.color === currentTurn) {
      setSelectedPos({ row, col });
      setValidMoves(getValidMoves4(board, { row, col }, eliminatedPlayers));
    }
  }, [board, selectedPos, validMoves, currentTurn, gameOver, eliminatedPlayers]);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard4());
    setCurrentTurn('fire');
    setSelectedPos(null);
    setValidMoves([]);
    setCapturedPieces([]);
    setLastMove(null);
    setInCheck(null);
    setEliminatedPlayers([]);
    setWinner(null);
    setGameOver(false);
    setKingInCheckPos(null);
  }, []);

  return {
    board,
    currentTurn,
    selectedPos,
    validMoves,
    capturedPieces,
    lastMove,
    inCheck,
    eliminatedPlayers,
    winner,
    gameOver,
    kingInCheckPos,
    handleSquareClick,
    resetGame,
  };
}
