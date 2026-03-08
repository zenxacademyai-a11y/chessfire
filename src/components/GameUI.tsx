import { useMemo } from 'react';
import { Crown, Swords, Shield, RotateCcw, Users, Bot, Brain, Clock, Flame, Snowflake, Trophy, AlertTriangle } from 'lucide-react';
import type { PieceColor, PieceType, ChessPiece } from '@/utils/chessLogic';
import { formatTime } from '@/hooks/useChessClock';
import type { GameMode } from '@/hooks/useChessGame';

// Chess piece SVG icons with detailed outlines
function ChessIcon({ type, color, size = 24, className = '' }: { type: PieceType; color: PieceColor; size?: number; className?: string }) {
  const fill = color === 'fire' ? 'hsl(15, 90%, 50%)' : 'hsl(210, 80%, 50%)';
  const stroke = color === 'fire' ? 'hsl(25, 100%, 65%)' : 'hsl(195, 90%, 65%)';
  const glowClass = color === 'fire' ? 'piece-icon-fire' : 'piece-icon-ice';

  const paths: Record<PieceType, JSX.Element> = {
    king: (
      <g>
        <path d="M12 3v3M9 6h6M10 9l-3 12h10l-3-12" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 21h10" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="3" r="1.5" fill={stroke} />
        <path d="M10.5 6h3v2h-3z" fill={fill} stroke={stroke} strokeWidth="0.5" />
      </g>
    ),
    queen: (
      <g>
        <path d="M12 3l2 5 4-2-1.5 7h-9L6 6l4 2 2-5z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 21h10M7.5 15h9l.5 3H7l.5-3z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="3" r="1.5" fill={stroke} />
        <circle cx="6" cy="6" r="1" fill={stroke} />
        <circle cx="18" cy="6" r="1" fill={stroke} />
      </g>
    ),
    rook: (
      <g>
        <path d="M7 21h10M8 21V11h8v10M7 8h2V5h2v3h2V5h2v3h2l-1 3H8L7 8z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    ),
    bishop: (
      <g>
        <path d="M12 3c-1.5 2-4 4-4 7 0 3.5 2 5 4 5s4-1.5 4-5c0-3-2.5-5-4-7z" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d="M8 17l-1 4h10l-1-4" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="3.5" r="1.2" fill={stroke} />
        <line x1="12" y1="7" x2="12" y2="12" stroke={stroke} strokeWidth="1" />
      </g>
    ),
    knight: (
      <g>
        <path d="M9 21h6l1-4-2-1 3-5c0 0-2-3-5-3-2 0-4 2-4 5l1 4v4z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="10.5" cy="10" r="0.8" fill={stroke} />
        <path d="M8 14l2-1" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      </g>
    ),
    pawn: (
      <g>
        <circle cx="12" cy="7" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d="M9.5 10l-1.5 7h8l-1.5-7" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 21h10M8 19h8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${glowClass} ${className}`}
      style={{ filter: `drop-shadow(0 0 3px ${fill})` }}
    >
      {paths[type]}
    </svg>
  );
}

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

  // Score calculation
  const pieceValues: Record<PieceType, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  const fireScore = iceCaptured.reduce((s, p) => s + pieceValues[p.type], 0);
  const iceScore = fireCaptured.reduce((s, p) => s + pieceValues[p.type], 0);

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none">

      {/* ============ TOP BAR ============ */}
      <div className="flex items-center justify-between p-3 md:p-5">
        {/* Title */}
        <div className="pointer-events-auto glass-panel rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Swords className="w-7 h-7 text-foreground" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wider leading-none">
                <span className="text-primary" style={{ textShadow: '0 0 20px hsl(15 90% 50% / 0.4)' }}>FIRE</span>
                <span className="text-muted-foreground mx-2 text-base">⚔</span>
                <span className="text-secondary" style={{ textShadow: '0 0 20px hsl(210 80% 50% / 0.4)' }}>ICE</span>
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase">3D Chess Battle</p>
            </div>
          </div>
        </div>

        {/* Controls cluster */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mode selector */}
          <div className="glass-panel rounded-xl overflow-hidden flex">
            <button
              onClick={() => onModeChange('pvp')}
              className={`px-3 py-2 text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                gameMode === 'pvp'
                  ? 'bg-primary/15 text-primary shadow-inner'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Users size={14} />
              PvP
            </button>
            <div className="w-px bg-border/50" />
            <button
              onClick={() => onModeChange('pvai')}
              className={`px-3 py-2 text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                gameMode === 'pvai'
                  ? 'bg-secondary/15 text-secondary shadow-inner'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Bot size={14} />
              vs AI
            </button>
          </div>

          {/* AI thinking */}
          {aiThinking && (
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse"
              style={{ borderColor: 'hsl(210 80% 55% / 0.4)', boxShadow: '0 0 20px hsl(210 80% 55% / 0.2)' }}>
              <Brain size={14} className="text-secondary animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-bold text-secondary tracking-wide">Thinking...</span>
            </div>
          )}

          {/* Check warning */}
          {inCheck && !gameOver && (
            <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2"
              style={{ animation: 'danger-pulse 1s ease-in-out infinite' }}>
              <AlertTriangle size={16} className="text-destructive" />
              <span className="text-sm font-bold text-destructive tracking-wide">
                {inCheck === 'fire' ? 'Fire' : 'Ice'} CHECK!
              </span>
            </div>
          )}

          {/* Turn indicator */}
          {!gameOver && !aiThinking && (
            <div className={`glass-panel rounded-xl px-4 py-2 flex items-center gap-2 transition-all duration-500 ${
              currentTurn === 'fire'
                ? 'shadow-[0_0_25px_hsl(15_90%_55%/0.3)]'
                : 'shadow-[0_0_25px_hsl(210_80%_55%/0.3)]'
            }`}
              style={{
                borderColor: currentTurn === 'fire' ? 'hsl(15, 90%, 55%, 0.5)' : 'hsl(210, 80%, 55%, 0.5)',
                animation: currentTurn === 'fire' ? 'pulse-fire 2s ease-in-out infinite' : 'pulse-ice 2s ease-in-out infinite'
              }}>
              {currentTurn === 'fire' ? <Flame size={16} className="text-primary" /> : <Snowflake size={16} className="text-secondary" />}
              <span className={`text-sm font-bold tracking-wide ${currentTurn === 'fire' ? 'text-primary' : 'text-secondary'}`}>
                {currentTurn === 'fire' ? 'Fire' : 'Ice'} Turn
              </span>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={onReset}
            className="glass-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all group"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
            <span className="hidden md:inline">New Game</span>
          </button>
        </div>
      </div>

      {/* ============ CHESS CLOCKS - LEFT SIDE ============ */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none">
        {/* Ice clock */}
        <ClockPanel
          color="ice"
          time={iceTime}
          isActive={currentTurn === 'ice' && !gameOver}
          isLow={iceTime <= 60}
          gameOver={gameOver}
          label={gameMode === 'pvai' ? 'AI' : 'ICE'}
          score={iceScore}
        />
        {/* Fire clock */}
        <ClockPanel
          color="fire"
          time={fireTime}
          isActive={currentTurn === 'fire' && !gameOver}
          isLow={fireTime <= 60}
          gameOver={gameOver}
          label="FIRE"
          score={fireScore}
        />
      </div>

      {/* ============ GAME OVER OVERLAY ============ */}
      {gameOver && winner && (
        <div className="flex justify-center mt-6 pointer-events-auto">
          <div
            className="glass-panel rounded-2xl px-10 py-6 text-center relative overflow-hidden"
            style={{
              borderColor: winner === 'fire' ? 'hsl(15, 90%, 55%, 0.6)' : 'hsl(210, 80%, 55%, 0.6)',
              boxShadow: winner === 'fire'
                ? '0 0 60px hsl(15 90% 55% / 0.4), 0 0 120px hsl(15 90% 55% / 0.15)'
                : '0 0 60px hsl(210 80% 55% / 0.4), 0 0 120px hsl(210 80% 55% / 0.15)',
              animation: 'victory-glow 2s ease-in-out infinite',
            }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${winner === 'fire' ? 'hsl(15, 90%, 55%)' : 'hsl(210, 80%, 55%)'}, transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }} />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Trophy size={32} className={winner === 'fire' ? 'text-primary' : 'text-secondary'} />
                <p className="text-3xl md:text-4xl font-bold tracking-wider">
                  {checkmatedColor ? 'CHECKMATE!' : 'TIME OUT!'}
                </p>
                <Trophy size={32} className={winner === 'fire' ? 'text-primary' : 'text-secondary'} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                {winner === 'fire' ? <Flame size={20} className="text-primary" /> : <Snowflake size={20} className="text-secondary" />}
                <p className={`text-lg font-bold ${winner === 'fire' ? 'text-primary' : 'text-secondary'}`}>
                  {winner === 'fire' ? 'Fire' : 'Ice'} Wins!
                </p>
              </div>
              <button
                onClick={onReset}
                className="px-6 py-2.5 rounded-xl border border-border bg-card/80 text-foreground font-semibold hover:bg-muted transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <RotateCcw size={16} />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CAPTURED PIECES - BOTTOM ============ */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between pointer-events-none">
        <CapturedPanel
          color="fire"
          label="Fire Captured"
          pieces={iceCaptured}
          score={fireScore}
        />
        <CapturedPanel
          color="ice"
          label="Ice Captured"
          pieces={fireCaptured}
          score={iceScore}
        />
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function ClockPanel({ color, time, isActive, isLow, gameOver, label, score }: {
  color: PieceColor; time: number; isActive: boolean; isLow: boolean; gameOver: boolean; label: string; score: number;
}) {
  const isFire = color === 'fire';
  const Icon = isFire ? Flame : Snowflake;
  const textColor = isFire ? 'text-primary' : 'text-secondary';
  const hsl = isFire ? '15 90% 55%' : '210 80% 55%';

  return (
    <div
      className={`glass-panel rounded-xl px-4 py-3 min-w-[120px] transition-all duration-500 ${
        isActive ? `shadow-[0_0_30px_hsl(${hsl}/0.35)]` : ''
      }`}
      style={{
        borderColor: isActive ? `hsl(${hsl} / 0.5)` : undefined,
        animation: isActive ? (isFire ? 'pulse-fire 2s ease-in-out infinite' : 'pulse-ice 2s ease-in-out infinite') : isLow && !gameOver ? 'danger-pulse 1s ease-in-out infinite' : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={`${textColor} ${isActive ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold tracking-widest ${textColor}`}>{label}</span>
        {score > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
            +{score}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={12} className="text-muted-foreground" />
        <p className={`text-2xl font-bold tracking-widest font-mono leading-none ${
          isLow && !gameOver ? 'text-destructive' : textColor
        }`}>
          {formatTime(time)}
        </p>
      </div>
    </div>
  );
}

function CapturedPanel({ color, label, pieces, score }: {
  color: PieceColor; label: string; pieces: ChessPiece[]; score: number;
}) {
  const isFire = color === 'fire';
  const Icon = isFire ? Flame : Snowflake;
  const textColor = isFire ? 'text-primary' : 'text-secondary';
  const borderColor = isFire ? 'hsl(15, 90%, 55%, 0.25)' : 'hsl(210, 80%, 55%, 0.25)';
  // Captured pieces belong to the opposite color
  const capturedColor: PieceColor = isFire ? 'ice' : 'fire';

  // Sort by value descending
  const pieceOrder: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
  const sorted = [...pieces].sort((a, b) => pieceOrder.indexOf(a.type) - pieceOrder.indexOf(b.type));

  return (
    <div className="glass-panel rounded-xl px-4 py-2.5" style={{ borderColor }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={12} className={textColor} />
        <span className={`text-[10px] font-bold tracking-widest uppercase ${textColor}`}>{label}</span>
        {score > 0 && (
          <span className={`text-xs font-bold ${textColor}`}>+{score}</span>
        )}
      </div>
      <div className="flex gap-1 items-center min-h-[28px]">
        {sorted.length > 0 ? sorted.map((p, i) => (
          <div key={i} className="captured-icon" style={{ animationDelay: `${i * 0.15}s` }}>
            <ChessIcon type={p.type} color={capturedColor} size={22} />
          </div>
        )) : (
          <span className="text-xs text-muted-foreground italic">None</span>
        )}
      </div>
    </div>
  );
}
