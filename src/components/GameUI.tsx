import type { PieceColor, ChessPiece } from '@/utils/chessLogic';
import { pieceSymbols } from '@/utils/chessLogic';

interface GameUIProps {
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  onReset: () => void;
}

export default function GameUI({ currentTurn, capturedPieces, onReset }: GameUIProps) {
  const fireCaptured = capturedPieces.filter(p => p.color === 'fire');
  const iceCaptured = capturedPieces.filter(p => p.color === 'ice');

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="pointer-events-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wider">
            <span className="text-primary">FIRE</span>
            <span className="text-muted-foreground mx-2">vs</span>
            <span className="text-secondary">ICE</span>
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">3D Chess Battle</p>
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg border text-sm font-semibold tracking-wide transition-all duration-300 ${
            currentTurn === 'fire' 
              ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_hsl(15_90%_55%/0.3)]' 
              : 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_20px_hsl(210_80%_55%/0.3)]'
          }`}>
            {currentTurn === 'fire' ? '🔥 Fire' : '❄️ Ice'} Turn
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-border bg-card/80 text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Captured pieces */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-card/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary/20">
          <p className="text-xs text-primary mb-1 font-semibold">🔥 Fire Captured</p>
          <div className="flex gap-1 text-lg text-secondary">
            {iceCaptured.map((p, i) => (
              <span key={i}>{pieceSymbols[p.type]}</span>
            ))}
            {iceCaptured.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
        <div className="bg-card/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-secondary/20">
          <p className="text-xs text-secondary mb-1 font-semibold">❄️ Ice Captured</p>
          <div className="flex gap-1 text-lg text-primary">
            {fireCaptured.map((p, i) => (
              <span key={i}>{pieceSymbols[p.type]}</span>
            ))}
            {fireCaptured.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
