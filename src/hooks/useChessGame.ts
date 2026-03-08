import { useState, useCallback } from 'react';
import { Board, Position, PieceColor, ChessPiece, createInitialBoard, getValidMoves, movePiece } from '@/utils/chessLogic';

export function useChessGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('fire');
  const [capturedPieces, setCapturedPieces] = useState<ChessPiece[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [moveType, setMoveType] = useState<'move' | 'capture' | null>(null);

  const handleSquareClick = useCallback((row: number, col: number) => {
    const piece = board[row][col];

    if (selectedPos) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        const { newBoard, captured } = movePiece(board, selectedPos, { row, col });
        setBoard(newBoard);
        setLastMove({ from: selectedPos, to: { row, col } });
        setMoveType(captured ? 'capture' : 'move');
        if (captured) setCapturedPieces(prev => [...prev, captured]);
        setCurrentTurn(currentTurn === 'fire' ? 'ice' : 'fire');
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
  }, [board, selectedPos, validMoves, currentTurn]);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setSelectedPos(null);
    setValidMoves([]);
    setCurrentTurn('fire');
    setCapturedPieces([]);
    setLastMove(null);
    setMoveType(null);
  }, []);

  return { board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType, handleSquareClick, resetGame };
}
