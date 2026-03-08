import { useState, useCallback, useEffect } from 'react';
import { Board, Position, PieceColor, ChessPiece, createInitialBoard, getValidMoves, movePiece, isInCheck, isCheckmate } from '@/utils/chessLogic';

export interface AnimatingPiece {
  from: [number, number, number];
  to: [number, number, number];
  type: ChessPiece['type'];
  color: PieceColor;
  startTime: number;
  isKnight: boolean;
}

export function useChessGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('fire');
  const [capturedPieces, setCapturedPieces] = useState<ChessPiece[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [moveType, setMoveType] = useState<'move' | 'capture' | 'check' | 'checkmate' | null>(null);
  const [inCheck, setInCheck] = useState<PieceColor | null>(null);
  const [checkmatedColor, setCheckmatedColor] = useState<PieceColor | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [kingInCheckPos, setKingInCheckPos] = useState<Position | null>(null);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (animatingPiece || checkmatedColor) return; // Block input during animation or after checkmate
    
    const piece = board[row][col];

    if (selectedPos) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        const movingPiece = board[selectedPos.row][selectedPos.col]!;
        
        // Start animation
        const fromPos: [number, number, number] = [selectedPos.col - 3.5, 0.08, selectedPos.row - 3.5];
        const toPos: [number, number, number] = [col - 3.5, 0.08, row - 3.5];
        
        setAnimatingPiece({
          from: fromPos,
          to: toPos,
          type: movingPiece.type,
          color: movingPiece.color,
          startTime: Date.now(),
          isKnight: movingPiece.type === 'knight',
        });

        // Delay board update for animation
        const { newBoard, captured } = movePiece(board, selectedPos, { row, col });
        
        setTimeout(() => {
          setBoard(newBoard);
          setAnimatingPiece(null);
          setLastMove({ from: selectedPos, to: { row, col } });
          
          const nextTurn: PieceColor = currentTurn === 'fire' ? 'ice' : 'fire';
          
          if (captured) setCapturedPieces(prev => [...prev, captured]);
          
          // Check detection
          if (isCheckmate(newBoard, nextTurn)) {
            setMoveType('checkmate');
            setCheckmatedColor(nextTurn);
            setInCheck(nextTurn);
            // Find king position for visual
            for (let r = 0; r < 8; r++)
              for (let c = 0; c < 8; c++)
                if (newBoard[r][c]?.type === 'king' && newBoard[r][c]?.color === nextTurn)
                  setKingInCheckPos({ row: r, col: c });
          } else if (isInCheck(newBoard, nextTurn)) {
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
        }, movingPiece.type === 'knight' ? 600 : 400);
        
        // Clear selection immediately so piece disappears from source
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
  }, [board, selectedPos, validMoves, currentTurn, animatingPiece, checkmatedColor]);

  const resetGame = useCallback(() => {
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
  }, []);

  return {
    board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    handleSquareClick, resetGame
  };
}
