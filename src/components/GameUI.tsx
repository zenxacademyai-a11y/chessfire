import type { PieceColor, ChessPiece } from '@/utils/chessLogic';
import { pieceSymbols } from '@/utils/chessLogic';
import { formatTime } from '@/hooks/useChessClock';
import type { GameMode } from '@/hooks/useChessGame';

interface GameUIProps {
  currentTurn: PieceColor;
  capturedPieces: ChessPiece[];
  onReset: () => void;
  inCheck: PieceColor | null;
  checkmatedColor: PieceColor | null;
  fireTime: number;
  iceTime: number;
  timedOutColor: PieceColor | null;
  gameMode: GameMode;
  aiThinking: boolean;
  onModeChange: (mode: GameMode) => void;
}

export default function GameUI({
  currentTurn, capturedPieces, onReset, inCheck, checkmatedColor,
  fireTime, iceTime, timedOutColor, gameMode, aiThinking, onModeChange
}: GameUIProps) {
  const fireCaptured = capturedPieces.filter(p => p.color === 'fire');
  const iceCaptured = capturedPieces.filter(p => p.color === 'ice');
  const winner = checkmatedColor === 'fire' ? 'ice' : checkmatedColor === 'ice' ? 'fire' : timedOutColor === 'fire' ? 'ice' : timedOutColor === 'ice' ? 'fire' : null;
  const gameOver = !!checkmatedColor || !!timedOutColor;

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none">
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

        <div className="pointer-events-auto flex items-center gap-3">
          {/* Mode selector */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => onModeChange('pvp')}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                gameMode === 'pvp'
                  ? 'bg-muted text-foreground'
                  : 'bg-card/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              👥 PvP
            </button>
            <button
              onClick={() => onModeChange('pvai')}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                gameMode === 'pvai'
                  ? 'bg-muted text-foreground'
                  : 'bg-card/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              🤖 vs AI
            </button>
          </div>

          {/* AI thinking indicator */}
          {aiThinking && (
            <div className="px-3 py-1.5 rounded-lg border border-secondary/50 bg-secondary/10 text-secondary text-xs font-bold tracking-wide animate-pulse">
              🤖 AI thinking...
            </div>
          )}

          {inCheck && !gameOver && (
            <div className="px-4 py-2 rounded-lg border border-destructive bg-destructive/20 text-destructive text-sm font-bold tracking-wide animate-pulse">
              ⚠️ {inCheck === 'fire' ? 'Fire' : 'Ice'} CHECK!
            </div>
          )}

          {!gameOver && !aiThinking && (
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

      {/* Chess Clocks - left side */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none">
        <div className={`px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          currentTurn === 'ice' && !gameOver
            ? 'border-secondary bg-secondary/15 shadow-[0_0_25px_hsl(210_80%_55%/0.3)]'
            : 'border-border/40 bg-card/40'
        } ${iceTime <= 60 && !gameOver ? 'animate-pulse' : ''}`}>
          <p className="text-xs text-secondary font-semibold mb-1">
            ❄️ ICE {gameMode === 'pvai' ? '(AI)' : ''}
          </p>
          <p className={`text-2xl font-bold tracking-widest font-mono ${
            iceTime <= 60 ? 'text-destructive' : 'text-secondary'
          }`}>
            {formatTime(iceTime)}
          </p>
        </div>

        <div className={`px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          currentTurn === 'fire' && !gameOver
            ? 'border-primary bg-primary/15 shadow-[0_0_25px_hsl(15_90%_55%/0.3)]'
            : 'border-border/40 bg-card/40'
        } ${fireTime <= 60 && !gameOver ? 'animate-pulse' : ''}`}>
          <p className="text-xs text-primary font-semibold mb-1">🔥 FIRE</p>
          <p className={`text-2xl font-bold tracking-widest font-mono ${
            fireTime <= 60 ? 'text-destructive' : 'text-primary'
          }`}>
            {formatTime(fireTime)}
          </p>
        </div>
      </div>

      {/* Game over overlay */}
      {gameOver && winner && (
        <div className="flex justify-center mt-8 pointer-events-auto">
          <div className={`px-8 py-4 rounded-2xl border-2 backdrop-blur-md text-center ${
            winner === 'fire'
              ? 'border-primary bg-primary/20 shadow-[0_0_60px_hsl(15_90%_55%/0.4)]'
              : 'border-secondary bg-secondary/20 shadow-[0_0_60px_hsl(210_80%_55%/0.4)]'
          }`}>
            <p className="text-3xl md:text-4xl font-bold tracking-wider mb-2">
              {winner === 'fire' ? '🔥' : '❄️'} {checkmatedColor ? 'CHECKMATE!' : 'TIME OUT!'}
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
