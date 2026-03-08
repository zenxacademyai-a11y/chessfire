import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import ChessBoard3D from '@/components/ChessBoard3D';
import GameUI from '@/components/GameUI';
import { useChessGame } from '@/hooks/useChessGame';
import { useSound } from '@/components/SoundManager';

const Index = () => {
  const { board, selectedPos, validMoves, currentTurn, capturedPieces, lastMove, moveType, handleSquareClick, resetGame } = useChessGame();
  const { playMove, playCapture, playSelect } = useSound();
  const prevMoveRef = useRef(lastMove);

  useEffect(() => {
    if (lastMove && lastMove !== prevMoveRef.current) {
      if (moveType === 'capture') playCapture();
      else playMove();
    }
    prevMoveRef.current = lastMove;
  }, [lastMove, moveType]);

  useEffect(() => {
    if (selectedPos) playSelect();
  }, [selectedPos]);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <GameUI currentTurn={currentTurn} capturedPieces={capturedPieces} onReset={resetGame} />
      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ background: 'linear-gradient(180deg, #0a0a20 0%, #050510 50%, #0a0515 100%)' }}
      >
        <ChessBoard3D
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
        />
      </Canvas>
    </div>
  );
};

export default Index;
