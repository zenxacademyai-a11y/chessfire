import type { PieceColor, ChessPiece } from '@/utils/chessLogic';
import { pieceSymbols } from '@/utils/chessLogic';

interface GameUIProps {
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  onReset: () => void;
  inCheck: PieceColor | null;
  checkmatedColor: PieceColor | null;
}

export default function GameUI({ currentTurn, capturedPieces, onReset, inCheck, checkmatedColor }: GameUIProps) {
  const fireCaptured = capturedPieces.filter(p => p.color === 'fire');
  const iceCaptured = capturedPieces.filter(p => p.color === 'ice');
  const winner = checkmatedColor === 'fire' ? 'ice' : checkmatedColor === 'ice' ? 'fire' : null;

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
          {/* Check/Checkmate alert */}
          {inCheck && !checkmatedColor && (
            <div className="px-4 py-2 rounded-lg border border-destructive bg-destructive/20 text-destructive text-sm font-bold tracking-wide animate-pulse">
              ⚠️ {inCheck === 'fire' ? 'Fire' : 'Ice'} King in CHECK!
            </div>
          )}

          {!checkmatedColor && (
            <div className={`px-4 py-2 rounded-lg border text-sm font-semibold tracking-wide transition-all duration-300 ${
              currentTurn === 'fire' 
                ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_hsl(15_90%_55%/0.3)]' 
                : 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_20px_hsl(210_80%_55%/0.3)]'
            }`}>
              {currentTurn === 'fire' ? '🔥 Fire' : '❄️ Ice'} Turn
            </div>
          )}
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-border bg-card/80 text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Checkmate overlay */}
      {checkmatedColor && winner && (
        <div className="flex justify-center mt-8 pointer-events-auto">
          <div className={`px-8 py-4 rounded-2xl border-2 backdrop-blur-md text-center ${
            winner === 'fire'
              ? 'border-primary bg-primary/20 shadow-[0_0_60px_hsl(15_90%_55%/0.4)]'
              : 'border-secondary bg-secondary/20 shadow-[0_0_60px_hsl(210_80%_55%/0.4)]'
          }`}>
            <p className="text-3xl md:text-4xl font-bold tracking-wider mb-2">
              {winner === 'fire' ? '🔥' : '❄️'} CHECKMATE!
            </p>
            <p className={`text-lg font-semibold ${winner === 'fire' ? 'text-primary' : 'text-secondary'}`}>
              {winner === 'fire' ? 'Fire' : 'Ice'} Wins!
            </p>
            <button
              onClick={onReset}
              className="mt-4 px-6 py-2 rounded-lg border border-foreground/30 bg-card/60 text-foreground font-medium hover:bg-muted transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

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
