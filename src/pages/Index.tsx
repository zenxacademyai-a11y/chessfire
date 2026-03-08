import { useEffect, useRef, useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import ChessBoard3D from '@/components/ChessBoard3D';
import GameUI from '@/components/GameUI';
import MoveHistoryPanel from '@/components/MoveHistoryPanel';
import ConfettiExplosion from '@/components/ConfettiExplosion';
import { useChessGame } from '@/hooks/useChessGame';
import { useChessClock } from '@/hooks/useChessClock';
import { useSound } from '@/components/SoundManager';

const Index = () => {
  const {
    board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType,
    inCheck, checkmatedColor, animatingPiece, kingInCheckPos,
    gameMode, aiThinking, lastMovedPieceType, aiDifficulty,
    hintMove, hintLoading, moveHistory, viewingMoveIndex,
    handleSquareClick, resetGame, toggleGameMode, setAiDifficulty, getHint,
    undoMove, viewMove, exitReplay
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
  const playerWon = gameOver && winner === 'fire' && gameMode === 'pvai';

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
      {/* Confetti on player victory */}
      <ConfettiExplosion active={playerWon} />

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
        onHint={getHint}
        hintLoading={hintLoading}
      />

      {/* Undo button for PvP */}
      {gameMode === 'pvp' && !checkmatedColor && !timedOutColor && moveHistory.length > 0 && (
        <div className="absolute left-2 md:left-3 bottom-20 md:bottom-24 pointer-events-auto z-20">
          <button
            onClick={undoMove}
            className="glass-panel rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all group"
            title="Undo last move"
          >
            <RotateCcw size={12} className="md:w-[14px] md:h-[14px] group-hover:rotate-[-180deg] transition-transform duration-500" />
            <span className="hidden md:inline">Undo</span>
          </button>
        </div>
      )}

      {/* Replay mode indicator */}
      {viewingMoveIndex !== null && (
        <div className="absolute top-14 md:top-20 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
          <div className="glass-panel rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-2 bg-primary/5 border-primary/20">
            <span className="text-[10px] md:text-xs font-bold text-primary tracking-wide">📋 Move {viewingMoveIndex + 1}</span>
            <button onClick={exitReplay} className="text-[10px] md:text-xs font-bold text-primary hover:text-primary/80 underline ml-1 md:ml-2">
              Return
            </button>
          </div>
        </div>
      )}

      {/* Move history panel */}
      <MoveHistoryPanel
        moves={moveHistory}
        viewingMoveIndex={viewingMoveIndex}
        onMoveClick={viewMove}
        onExitReplay={exitReplay}
        canUndo={gameMode === 'pvp' && !checkmatedColor && !timedOutColor && moveHistory.length > 0}
        onUndo={undoMove}
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
          hintMove={hintMove}
        />
      </Canvas>
    </div>
  );
};

export default Index;
