import { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import ChessBoard3D from '@/components/ChessBoard3D';
import GameUI from '@/components/GameUI';
import { useChessGame } from '@/hooks/useChessGame';
import { useChessClock } from '@/hooks/useChessClock';
import { useSound } from '@/components/SoundManager';

const Index = () => {
  const {
    board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    gameMode, aiThinking, lastMovedPieceType, aiDifficulty,
    hintMove, hintLoading,
    handleSquareClick, resetGame, toggleGameMode, setAiDifficulty, getHint
  } = useChessGame();
  const { fireTime, iceTime, timedOutColor, resetClock } = useChessClock(currentTurn, checkmatedColor);
  const { playMove, playCapture, playSelect, playCheck, playCheckmate, playPieceMove, playPieceCapture, playVictory, playDefeat } = useSound();
  const prevMoveRef = useRef(lastMove);
  const prevGameOverRef = useRef(false);

  const handleReset = useCallback(() => {
    resetGame();
    resetClock();
  }, [resetGame, resetClock]);

  const handleModeChange = useCallback((mode: 'pvp' | 'pvai') => {
    toggleGameMode(mode);
    resetClock();
  }, [toggleGameMode, resetClock]);

  // Move sounds
  useEffect(() => {
    if (lastMove && lastMove !== prevMoveRef.current) {
      if (moveType === 'checkmate') playCheckmate();
      else if (moveType === 'check') playCheck();
      else if (moveType === 'capture' && lastMovedPieceType) playPieceCapture(lastMovedPieceType);
      else if (lastMovedPieceType) playPieceMove(lastMovedPieceType);
      else playMove();
    }
    prevMoveRef.current = lastMove;
  }, [lastMove, moveType, lastMovedPieceType]);

  // Win/lose sounds
  const gameOver = !!checkmatedColor || !!timedOutColor;
  const winner = checkmatedColor === 'fire' ? 'ice' : checkmatedColor === 'ice' ? 'fire' : timedOutColor === 'fire' ? 'ice' : timedOutColor === 'ice' ? 'fire' : null;

  useEffect(() => {
    if (gameOver && !prevGameOverRef.current && winner) {
      if (gameMode === 'pvai') {
        if (winner === 'fire') playVictory();
        else playDefeat();
      } else {
        playVictory();
      }
    }
    prevGameOverRef.current = gameOver;
  }, [gameOver, winner, gameMode]);

  useEffect(() => {
    if (selectedPos) playSelect();
  }, [selectedPos]);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <GameUI
        currentTurn={currentTurn}
        capturedPieces={capturedPieces}
        onReset={handleReset}
        inCheck={inCheck}
        checkmatedColor={checkmatedColor}
        fireTime={fireTime}
        iceTime={iceTime}
        timedOutColor={timedOutColor}
        gameMode={gameMode}
        aiThinking={aiThinking}
        onModeChange={handleModeChange}
        aiDifficulty={aiDifficulty}
        onDifficultyChange={setAiDifficulty}
      />
      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ background: 'linear-gradient(180deg, #f0f0f5 0%, #e8e8f0 40%, #dde0ea 100%)' }}
      >
        <ChessBoard3D
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
          animatingPiece={animatingPiece}
          kingInCheckPos={kingInCheckPos}
        />
      </Canvas>
    </div>
  );
};

export default Index;
