import { useMemo, useState, useEffect } from 'react';
import { Crown, Swords, Shield, RotateCcw, Users, Bot, Brain, Clock, Flame, Snowflake, Trophy, AlertTriangle, Volume2, VolumeX, Zap, Target, Skull, Lightbulb, Menu, X, Globe } from 'lucide-react';
import type { PieceColor, PieceType, ChessPiece } from '@/utils/chessLogic';
import { formatTime } from '@/hooks/useChessClock';
import type { GameMode, AIDifficulty } from '@/hooks/useChessGame';
import { Slider } from '@/components/ui/slider';
import { useSoundStore } from '@/components/SoundManager';

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
  aiDifficulty: AIDifficulty;
  onDifficultyChange: (d: AIDifficulty) => void;
  onHint: () => void;
  hintLoading: boolean;
  onlinePlayerColor?: 'fire' | 'ice' | null;
  opponentDisconnected?: boolean;
  onClaimVictory?: () => void;
}

export default function GameUI({
  currentTurn, capturedPieces, onReset, inCheck, checkmatedColor,
  fireTime, iceTime, timedOutColor, gameMode, aiThinking, onModeChange,
  aiDifficulty, onDifficultyChange, onHint, hintLoading, onlinePlayerColor, opponentDisconnected, onClaimVictory
}: GameUIProps) {
  const fireCaptured = capturedPieces.filter(p => p.color === 'fire');
  const iceCaptured = capturedPieces.filter(p => p.color === 'ice');
  const winner = checkmatedColor === 'fire' ? 'ice' : checkmatedColor === 'ice' ? 'fire' : timedOutColor === 'fire' ? 'ice' : timedOutColor === 'ice' ? 'fire' : null;
  const gameOver = !!checkmatedColor || !!timedOutColor;

  const pieceValues: Record<PieceType, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  const fireScore = iceCaptured.reduce((s, p) => s + pieceValues[p.type], 0);
  const iceScore = fireCaptured.reduce((s, p) => s + pieceValues[p.type], 0);

  const playerWon = gameOver && winner === 'fire' && gameMode === 'pvai';
  const playerLost = gameOver && winner === 'ice' && gameMode === 'pvai';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [disconnectSeconds, setDisconnectSeconds] = useState(0);

  // Track how long opponent has been disconnected
  useEffect(() => {
    if (!opponentDisconnected) {
      setDisconnectSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setDisconnectSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [opponentDisconnected]);
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none">

      {/* ============ TOP BAR ============ */}
      <div className="flex items-center justify-between p-2 md:p-5 gap-2">
        {/* Title - compact on mobile */}
        <div className="pointer-events-auto glass-panel rounded-xl px-3 py-2 md:px-5 md:py-3 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block">
              <Swords className="w-5 h-5 md:w-7 md:h-7 text-foreground" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm md:text-2xl font-bold tracking-wider leading-none">
                <span className="text-primary" style={{ textShadow: '0 0 20px hsl(15 90% 50% / 0.4)' }}>FIRE</span>
                <span className="text-muted-foreground mx-1 md:mx-2 text-xs md:text-base">⚔</span>
                <span className="text-secondary" style={{ textShadow: '0 0 20px hsl(210 80% 50% / 0.4)' }}>ICE</span>
              </h1>
              <p className="text-[8px] md:text-[10px] text-muted-foreground tracking-[0.2em] md:tracking-[0.3em] uppercase hidden sm:block">3D Chess Battle</p>
            </div>
          </div>
        </div>

        {/* Mobile: compact status + hamburger */}
        <div className="flex items-center gap-1.5 md:hidden pointer-events-auto">
          {/* Mobile turn/check indicator */}
          {!gameOver && !aiThinking && (
            <div className={`glass-panel rounded-lg px-2 py-1.5 flex items-center gap-1 ${
              currentTurn === 'fire' ? 'shadow-[0_0_15px_hsl(15_90%_55%/0.3)]' : 'shadow-[0_0_15px_hsl(210_80%_55%/0.3)]'
            }`}>
              {currentTurn === 'fire' ? <Flame size={12} className="text-primary" /> : <Snowflake size={12} className="text-secondary" />}
            </div>
          )}

          {inCheck && !gameOver && (
            <div className="glass-panel rounded-lg px-2 py-1.5" style={{ animation: 'danger-pulse 1s ease-in-out infinite' }}>
              <AlertTriangle size={12} className="text-destructive" />
            </div>
          )}

          {aiThinking && (
            <div className="glass-panel rounded-lg px-2 py-1.5 animate-pulse">
              <Brain size={12} className="text-secondary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          )}

          {/* Hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="glass-panel rounded-lg p-2"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Desktop controls — hide mode toggles during online */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2">
          {gameMode === 'online' ? (
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Globe size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">ONLINE</span>
              <span className="text-xs text-muted-foreground ml-1">
                {currentTurn === onlinePlayerColor ? '— Your turn' : '— Waiting...'}
              </span>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden flex">
              <button
                onClick={() => onModeChange('pvp')}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  gameMode === 'pvp' ? 'bg-primary/15 text-primary shadow-inner' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Users size={14} /> PvP
              </button>
              <div className="w-px bg-border/50" />
              <button
                onClick={() => onModeChange('pvai')}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  gameMode === 'pvai' ? 'bg-secondary/15 text-secondary shadow-inner' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Bot size={14} /> vs AI
              </button>
            </div>
          )}

          {/* AI Difficulty selector */}
          {gameMode === 'pvai' && (
            <div className="glass-panel rounded-xl overflow-hidden flex">
              {([
                { key: 'easy' as AIDifficulty, label: 'Easy', icon: Zap, color: 'text-green-500' },
                { key: 'medium' as AIDifficulty, label: 'Med', icon: Target, color: 'text-yellow-500' },
                { key: 'hard' as AIDifficulty, label: 'Hard', icon: Skull, color: 'text-red-500' },
              ]).map((d, i) => (
                <div key={d.key} className="flex items-center">
                  {i > 0 && <div className="w-px bg-border/50" />}
                  <button
                    onClick={() => onDifficultyChange(d.key)}
                    className={`px-2.5 py-2 text-[11px] font-semibold tracking-wide transition-all flex items-center gap-1 ${
                      aiDifficulty === d.key ? `bg-muted/60 ${d.color} shadow-inner` : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <d.icon size={12} /> {d.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          <VolumeControl />

          {aiThinking && (
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse"
              style={{ borderColor: 'hsl(210 80% 55% / 0.4)', boxShadow: '0 0 20px hsl(210 80% 55% / 0.2)' }}>
              <Brain size={14} className="text-secondary animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-bold text-secondary tracking-wide">Thinking...</span>
            </div>
          )}

          {inCheck && !gameOver && (
            <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2"
              style={{ animation: 'danger-pulse 1s ease-in-out infinite' }}>
              <AlertTriangle size={16} className="text-destructive" />
              <span className="text-sm font-bold text-destructive tracking-wide">
                {inCheck === 'fire' ? 'Fire' : 'Ice'} CHECK!
              </span>
            </div>
          )}

          {!gameOver && !aiThinking && (
            <div className={`glass-panel rounded-xl px-4 py-2 flex items-center gap-2 transition-all duration-500 ${
              currentTurn === 'fire' ? 'shadow-[0_0_25px_hsl(15_90%_55%/0.3)]' : 'shadow-[0_0_25px_hsl(210_80%_55%/0.3)]'
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

          {!gameOver && (
            <button onClick={onHint} disabled={hintLoading || aiThinking}
              className={`glass-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-all group ${
                hintLoading ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
              }`}
              style={hintLoading ? { borderColor: 'hsl(45 90% 50% / 0.4)', boxShadow: '0 0 15px hsl(45 90% 50% / 0.2)' } : {}}>
              <Lightbulb size={14} className={hintLoading ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden md:inline">{hintLoading ? 'Analyzing...' : 'Hint'}</span>
            </button>
          )}

          <button onClick={onReset}
            className="glass-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all group">
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
            <span className="hidden md:inline">New Game</span>
          </button>
        </div>
      </div>

      {/* ============ MOBILE MENU DROPDOWN ============ */}
      {mobileMenuOpen && (
        <div className="absolute top-14 right-2 z-50 pointer-events-auto glass-panel rounded-xl p-3 flex flex-col gap-2 w-52 md:hidden"
          style={{ boxShadow: '0 8px 30px hsl(0 0% 0% / 0.2)' }}>
          {/* Mode */}
          {gameMode === 'online' ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Globe size={12} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">ONLINE</span>
              <span className="text-[10px] text-muted-foreground">
                {currentTurn === onlinePlayerColor ? '— Your turn' : '— Waiting...'}
              </span>
            </div>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => { onModeChange('pvp'); setMobileMenuOpen(false); }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                  gameMode === 'pvp' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                }`}>
                <Users size={12} /> PvP
              </button>
              <button onClick={() => { onModeChange('pvai'); setMobileMenuOpen(false); }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                  gameMode === 'pvai' ? 'bg-secondary/15 text-secondary' : 'text-muted-foreground'
                }`}>
                <Bot size={12} /> vs AI
              </button>
            </div>
          )}

          {/* Difficulty */}
          {gameMode === 'pvai' && (
            <div className="flex gap-1">
              {([
                { key: 'easy' as AIDifficulty, label: 'Easy', icon: Zap, color: 'text-green-500' },
                { key: 'medium' as AIDifficulty, label: 'Med', icon: Target, color: 'text-yellow-500' },
                { key: 'hard' as AIDifficulty, label: 'Hard', icon: Skull, color: 'text-red-500' },
              ]).map(d => (
                <button key={d.key} onClick={() => onDifficultyChange(d.key)}
                  className={`flex-1 px-1.5 py-1.5 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-0.5 ${
                    aiDifficulty === d.key ? `bg-muted/60 ${d.color}` : 'text-muted-foreground'
                  }`}>
                  <d.icon size={10} /> {d.label}
                </button>
              ))}
            </div>
          )}

          <div className="w-full h-px bg-border/50" />

          {/* Actions */}
          {!gameOver && (
            <button onClick={() => { onHint(); setMobileMenuOpen(false); }} disabled={hintLoading || aiThinking}
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-yellow-500 flex items-center gap-1.5 rounded-lg hover:bg-muted/40">
              <Lightbulb size={12} /> {hintLoading ? 'Analyzing...' : 'Get Hint'}
            </button>
          )}

          <button onClick={() => { onReset(); setMobileMenuOpen(false); }}
            className="px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg hover:bg-muted/40">
            <RotateCcw size={12} /> New Game
          </button>

          <MobileVolumeControl />
        </div>
      )}

      {/* ============ CHESS CLOCKS ============ */}
      {/* Desktop: left side vertical */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 pointer-events-none">
        <ClockPanel color="ice" time={iceTime} isActive={currentTurn === 'ice' && !gameOver} isLow={iceTime <= 60} gameOver={gameOver}
          label={gameMode === 'online' ? (onlinePlayerColor === 'ice' ? 'YOU' : 'OPP') : gameMode === 'pvai' ? 'AI' : 'ICE'} score={iceScore} />
        <ClockPanel color="fire" time={fireTime} isActive={currentTurn === 'fire' && !gameOver} isLow={fireTime <= 60} gameOver={gameOver}
          label={gameMode === 'online' ? (onlinePlayerColor === 'fire' ? 'YOU' : 'OPP') : 'FIRE'} score={fireScore} />
      </div>

      {/* Mobile: bottom horizontal compact clocks */}
      <div className="absolute bottom-16 left-2 right-2 flex md:hidden justify-between gap-2 pointer-events-none">
        <MobileClockPanel color="fire" time={fireTime} isActive={currentTurn === 'fire' && !gameOver} isLow={fireTime <= 60} gameOver={gameOver}
          label={gameMode === 'online' ? (onlinePlayerColor === 'fire' ? 'YOU' : 'OPP') : 'FIRE'} score={fireScore} />
        <MobileClockPanel color="ice" time={iceTime} isActive={currentTurn === 'ice' && !gameOver} isLow={iceTime <= 60} gameOver={gameOver}
          label={gameMode === 'online' ? (onlinePlayerColor === 'ice' ? 'YOU' : 'OPP') : gameMode === 'pvai' ? 'AI' : 'ICE'} score={iceScore} />
      </div>

      {/* ============ GAME OVER OVERLAY ============ */}
      {gameOver && winner && (
        <GameOverOverlay winner={winner} checkmatedColor={checkmatedColor} onReset={onReset} playerWon={playerWon} playerLost={playerLost} gameMode={gameMode} />
      )}

      {/* ============ OPPONENT DISCONNECTED BANNER ============ */}
      {opponentDisconnected && !gameOver && (
        <div className="flex justify-center mt-2 md:mt-4 pointer-events-auto px-4">
          <div className="glass-panel rounded-xl px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-2 md:gap-3"
            style={{
              borderColor: 'hsl(45, 90%, 50%, 0.5)',
              boxShadow: '0 0 30px hsl(45 90% 50% / 0.2)',
              animation: 'danger-pulse 2s ease-in-out infinite',
            }}>
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
            <span className="text-xs md:text-sm font-bold text-yellow-500 tracking-wide">
              Opponent disconnected
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground">
              Waiting for reconnect...
            </span>
          </div>
        </div>
      )}

      {/* ============ CAPTURED PIECES - BOTTOM ============ */}
      <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3 flex justify-between pointer-events-none">
        <CapturedPanel color="fire" label="Fire" pieces={iceCaptured} score={fireScore} />
        <CapturedPanel color="ice" label="Ice" pieces={fireCaptured} score={iceScore} />
      </div>
    </div>
  );
}

// ============ VOLUME CONTROL ============

function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = useSoundStore();
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setShowSlider(true)} onMouseLeave={() => setShowSlider(false)}>
      <button onClick={toggleMute}
        className="glass-panel rounded-xl px-2.5 py-2 flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      {showSlider && (
        <div className="absolute top-full mt-1 right-0 glass-panel rounded-xl px-3 py-3 w-36 pointer-events-auto z-50"
          style={{ boxShadow: '0 8px 30px hsl(0 0% 0% / 0.15)' }}>
          <Slider value={[muted ? 0 : volume * 100]} onValueChange={([v]) => { setVolume(v / 100); if (muted) toggleMute(); }} max={100} step={1} className="w-full" />
          <p className="text-[10px] text-muted-foreground text-center mt-1.5 tracking-wider">
            {muted ? 'MUTED' : `${Math.round(volume * 100)}%`}
          </p>
        </div>
      )}
    </div>
  );
}

function MobileVolumeControl() {
  const { volume, muted, setVolume, toggleMute } = useSoundStore();

  return (
    <div className="flex items-center gap-2 px-2">
      <button onClick={toggleMute} className="text-muted-foreground">
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <Slider value={[muted ? 0 : volume * 100]} onValueChange={([v]) => { setVolume(v / 100); if (muted) toggleMute(); }} max={100} step={1} className="flex-1" />
      <span className="text-[10px] text-muted-foreground w-8 text-right">
        {muted ? 'OFF' : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}

// ============ GAME OVER OVERLAY WITH VFX ============

function GameOverOverlay({ winner, checkmatedColor, onReset, playerWon, playerLost, gameMode }: {
  winner: PieceColor; checkmatedColor: PieceColor | null; onReset: () => void; playerWon: boolean; playerLost: boolean; gameMode: GameMode;
}) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100, size: 4 + Math.random() * 8, delay: Math.random() * 2,
      color: winner === 'fire' ? `hsl(${10 + Math.random() * 30}, 90%, ${50 + Math.random() * 20}%)` : `hsl(${200 + Math.random() * 30}, 80%, ${50 + Math.random() * 20}%)`,
    }));
    setParticles(newParticles);
  }, [winner]);

  const isFire = winner === 'fire';

  return (
    <div className="flex justify-center mt-4 md:mt-6 pointer-events-auto px-4">
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`, animation: `float-particle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`, opacity: 0.8 }} />
      ))}

      <div className={`glass-panel rounded-2xl px-6 md:px-10 py-4 md:py-6 text-center relative overflow-hidden ${playerLost ? 'game-over-lose' : 'game-over-win'}`}
        style={{
          borderColor: isFire ? 'hsl(15, 90%, 55%, 0.6)' : 'hsl(210, 80%, 55%, 0.6)',
          boxShadow: isFire ? '0 0 60px hsl(15 90% 55% / 0.4), 0 0 120px hsl(15 90% 55% / 0.15)' : '0 0 60px hsl(210 80% 55% / 0.4), 0 0 120px hsl(210 80% 55% / 0.15)',
          animation: playerLost ? 'defeat-shake 0.5s ease-in-out, victory-glow 2s ease-in-out infinite 0.5s' : 'victory-glow 2s ease-in-out infinite',
        }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${isFire ? 'hsl(15, 90%, 55%)' : 'hsl(210, 80%, 55%)'}, transparent)`,
            backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

        <div className="fixed inset-0 pointer-events-none z-50"
          style={{ background: isFire ? 'radial-gradient(circle, hsl(15 90% 55% / 0.3), transparent 70%)' : 'radial-gradient(circle, hsl(210 80% 55% / 0.3), transparent 70%)',
            animation: 'screen-flash 1s ease-out forwards' }} />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
            <Trophy size={24} className={`md:hidden ${isFire ? 'text-primary' : 'text-secondary'}`} style={{ animation: 'trophy-bounce 0.6s ease-out' }} />
            <Trophy size={32} className={`hidden md:block ${isFire ? 'text-primary' : 'text-secondary'}`} style={{ animation: 'trophy-bounce 0.6s ease-out' }} />
            <p className="text-xl md:text-4xl font-bold tracking-wider" style={{ animation: 'text-reveal 0.8s ease-out' }}>
              {checkmatedColor ? 'CHECKMATE!' : 'TIME OUT!'}
            </p>
            <Trophy size={24} className={`md:hidden ${isFire ? 'text-primary' : 'text-secondary'}`} style={{ animation: 'trophy-bounce 0.6s ease-out 0.2s both' }} />
            <Trophy size={32} className={`hidden md:block ${isFire ? 'text-primary' : 'text-secondary'}`} style={{ animation: 'trophy-bounce 0.6s ease-out 0.2s both' }} />
          </div>

          {gameMode === 'pvai' && (
            <div className="flex items-center justify-center gap-2 mb-2" style={{ animation: 'text-reveal 0.8s ease-out 0.3s both' }}>
              <span className={`text-lg md:text-xl font-bold tracking-widest ${playerWon ? 'text-green-500' : 'text-destructive'}`}
                style={{ textShadow: playerWon ? '0 0 20px hsl(120 70% 50% / 0.5)' : '0 0 20px hsl(0 84% 50% / 0.5)' }}>
                {playerWon ? '🎉 VICTORY!' : '💀 DEFEAT'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            {isFire ? <Flame size={16} className="text-primary" /> : <Snowflake size={16} className="text-secondary" />}
            <p className={`text-base md:text-lg font-bold ${isFire ? 'text-primary' : 'text-secondary'}`}>
              {isFire ? 'Fire' : 'Ice'} Wins!
            </p>
          </div>
          <button onClick={onReset}
            className="px-5 md:px-6 py-2 md:py-2.5 rounded-xl border border-border bg-card/80 text-foreground font-semibold hover:bg-muted transition-all hover:scale-105 flex items-center gap-2 mx-auto text-sm md:text-base">
            <RotateCcw size={14} /> Play Again
          </button>
        </div>
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
    <div className={`glass-panel rounded-xl px-4 py-3 min-w-[120px] transition-all duration-500 ${isActive ? `shadow-[0_0_30px_hsl(${hsl}/0.35)]` : ''}`}
      style={{
        borderColor: isActive ? `hsl(${hsl} / 0.5)` : undefined,
        animation: isActive ? (isFire ? 'pulse-fire 2s ease-in-out infinite' : 'pulse-ice 2s ease-in-out infinite') : isLow && !gameOver ? 'danger-pulse 1s ease-in-out infinite' : undefined,
      }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={`${textColor} ${isActive ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold tracking-widest ${textColor}`}>{label}</span>
        {score > 0 && <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">+{score}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={12} className="text-muted-foreground" />
        <p className={`text-2xl font-bold tracking-widest font-mono leading-none ${isLow && !gameOver ? 'text-destructive' : textColor}`}>
          {formatTime(time)}
        </p>
      </div>
    </div>
  );
}

function MobileClockPanel({ color, time, isActive, isLow, gameOver, label, score }: {
  color: PieceColor; time: number; isActive: boolean; isLow: boolean; gameOver: boolean; label: string; score: number;
}) {
  const isFire = color === 'fire';
  const Icon = isFire ? Flame : Snowflake;
  const textColor = isFire ? 'text-primary' : 'text-secondary';
  const hsl = isFire ? '15 90% 55%' : '210 80% 55%';

  return (
    <div className={`glass-panel rounded-lg px-2.5 py-1.5 flex-1 transition-all duration-500 ${isActive ? `shadow-[0_0_20px_hsl(${hsl}/0.3)]` : ''}`}
      style={{
        borderColor: isActive ? `hsl(${hsl} / 0.5)` : undefined,
        animation: isLow && !gameOver ? 'danger-pulse 1s ease-in-out infinite' : undefined,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Icon size={10} className={`${textColor} ${isActive ? 'animate-pulse' : ''}`} />
          <span className={`text-[10px] font-bold tracking-wider ${textColor}`}>{label}</span>
          {score > 0 && <span className="text-[8px] font-bold text-muted-foreground bg-muted rounded-full px-1 leading-none">+{score}</span>}
        </div>
        <p className={`text-sm font-bold tracking-wider font-mono leading-none ${isLow && !gameOver ? 'text-destructive' : textColor}`}>
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
  const capturedColor: PieceColor = isFire ? 'ice' : 'fire';

  const pieceOrder: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
  const sorted = [...pieces].sort((a, b) => pieceOrder.indexOf(a.type) - pieceOrder.indexOf(b.type));

  return (
    <div className="glass-panel rounded-xl px-2 md:px-4 py-1.5 md:py-2.5" style={{ borderColor }}>
      <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1.5">
        <Icon size={10} className={textColor} />
        <span className={`text-[8px] md:text-[10px] font-bold tracking-widest uppercase ${textColor}`}>{label}</span>
        {score > 0 && <span className={`text-[10px] md:text-xs font-bold ${textColor}`}>+{score}</span>}
      </div>
      <div className="flex gap-0.5 md:gap-1 items-center min-h-[20px] md:min-h-[28px]">
        {sorted.length > 0 ? sorted.map((p, i) => (
          <div key={i} className="captured-icon" style={{ animationDelay: `${i * 0.15}s` }}>
            <ChessIcon type={p.type} color={capturedColor} size={16} className="md:!w-[22px] md:!h-[22px]" />
          </div>
        )) : (
          <span className="text-[10px] text-muted-foreground italic">None</span>
        )}
      </div>
    </div>
  );
}
