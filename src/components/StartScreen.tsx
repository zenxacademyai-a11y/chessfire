import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Swords, Users, Bot, Globe, Copy, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useOnlineGame } from '@/hooks/useOnlineGame';

interface StartScreenProps {
  onStart: (mode: 'pvp' | 'pvai') => void;
  onStartOnline: (roomId: string, playerColor: 'fire' | 'ice') => void;
}

function OnlinePanel({ onBack, onStartOnline, autoJoinCode }: { onBack: () => void; onStartOnline: (roomId: string, playerColor: 'fire' | 'ice') => void; autoJoinCode?: string | null }) {
  const { status, roomCode, roomId, playerColor, error, createRoom, joinRoom, leaveRoom } = useOnlineGame();
  const [joinCode, setJoinCode] = useState(autoJoinCode || '');
  const [copied, setCopied] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  // Auto-join if code provided via URL
  if (autoJoinCode && !autoJoined && status === 'idle') {
    setAutoJoined(true);
    joinRoom(autoJoinCode);
  }

  const shareUrl = useMemo(() => {
    if (!roomCode) return '';
    return `${window.location.origin}?join=${roomCode}`;
  }, [roomCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    leaveRoom();
    onBack();
  };

  // When status becomes 'playing', notify parent
  if (status === 'playing' && roomId && playerColor) {
    // Small delay to show transition
    setTimeout(() => onStartOnline(roomId, playerColor), 500);
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-6 w-full max-w-sm px-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <button onClick={handleBack} className="self-start flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <h2 className="text-2xl md:text-3xl font-bold text-zinc-200 tracking-wide">Play Online</h2>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2 w-full text-center">
          {error}
        </div>
      )}

      {status === 'idle' || status === 'error' ? (
        <>
          {/* Create Room */}
          <motion.button
            onClick={createRoom}
            className="w-full py-4 rounded-xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm text-zinc-200 font-bold text-lg hover:border-orange-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Room
          </motion.button>

          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-zinc-700/50" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-zinc-700/50" />
          </div>

          {/* Join Room */}
          <div className="w-full flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ROOM CODE"
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 placeholder-zinc-600 text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:border-sky-500/50"
              maxLength={6}
            />
            <motion.button
              onClick={() => joinRoom(joinCode)}
              disabled={joinCode.length < 4}
              className="px-6 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 font-bold hover:border-sky-500/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: joinCode.length >= 4 ? 1.02 : 1 }}
              whileTap={{ scale: joinCode.length >= 4 ? 0.98 : 1 }}
            >
              Join
            </motion.button>
          </div>
        </>
      ) : status === 'creating' || status === 'joining' ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <span className="text-zinc-500 text-sm">{status === 'creating' ? 'Creating room...' : 'Joining room...'}</span>
        </div>
      ) : status === 'waiting' ? (
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Room code display */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-zinc-500 text-xs uppercase tracking-widest">Room Code</span>
            <span className="text-4xl md:text-5xl font-mono font-black text-zinc-100 tracking-[0.4em]">
              {roomCode}
            </span>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all text-sm"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Link copied!' : 'Copy invite link'}
          </button>

          {/* Waiting indicator */}
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-orange-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
            <span className="text-zinc-500 text-sm">Waiting for opponent...</span>
          </div>

          <span className="text-zinc-600 text-xs">Share the code or link with a friend</span>
        </div>
      ) : status === 'playing' ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <span className="text-green-400 text-sm font-bold">Opponent joined! Starting game...</span>
        </div>
      ) : null}
    </motion.div>
  );
}

export default function StartScreen({ onStart, onStartOnline }: StartScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  const handleStart = (mode: 'pvp' | 'pvai') => {
    setExiting(true);
    setTimeout(() => onStart(mode), 800);
  };

  const handleStartOnline = (roomId: string, playerColor: 'fire' | 'ice') => {
    setExiting(true);
    setTimeout(() => onStartOnline(roomId, playerColor), 800);
  };

  // Check URL for join parameter on mount
  const [initialJoinCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join') || null;
  });

  // Show online panel if join code in URL
  useState(() => {
    if (initialJoinCode) {
      setShowOnline(true);
    }
  });

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1020 40%, #0a0a18 100%)' }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Ambient fire particles (left) */}
          <div className="absolute left-0 top-0 w-1/2 h-full pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 4 + Math.random() * 8,
                  height: 4 + Math.random() * 8,
                  left: `${10 + Math.random() * 35}%`,
                  bottom: `${Math.random() * 30}%`,
                  background: `hsl(${15 + Math.random() * 20}, 90%, ${50 + Math.random() * 15}%)`,
                  filter: 'blur(1px)',
                }}
                animate={{
                  y: [0, -120 - Math.random() * 200],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.3],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Ambient ice particles (right) */}
          <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`ice-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 3 + Math.random() * 6,
                  height: 3 + Math.random() * 6,
                  right: `${10 + Math.random() * 35}%`,
                  top: `${Math.random() * 30}%`,
                  background: `hsl(${200 + Math.random() * 20}, 80%, ${60 + Math.random() * 20}%)`,
                  filter: 'blur(1px)',
                }}
                animate={{
                  y: [0, 80 + Math.random() * 150],
                  opacity: [0, 0.7, 0],
                  scale: [0.5, 1, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Title section */}
          <motion.div
            className="flex flex-col items-center gap-2 mb-10 md:mb-14"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 md:gap-5 mb-2">
              <motion.div
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame className="w-8 h-8 md:w-12 md:h-12 text-orange-500 drop-shadow-[0_0_12px_hsl(15,90%,55%)]" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className="w-6 h-6 md:w-8 md:h-8 text-zinc-400" />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <Snowflake className="w-8 h-8 md:w-12 md:h-12 text-sky-400 drop-shadow-[0_0_12px_hsl(210,80%,55%)]" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, hsl(15, 90%, 55%), hsl(45, 100%, 60%), hsl(0, 0%, 90%), hsl(200, 80%, 60%), hsl(210, 80%, 55%))',
              }}
            >
              FIRE vs ICE
            </h1>
            <p className="text-zinc-500 text-sm md:text-base tracking-[0.3em] uppercase font-light">
              3D Chess Battle
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showOnline ? (
              <motion.div
                key="modes"
                className="flex flex-col sm:flex-row gap-4 md:gap-5"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* PvP */}
                <motion.button
                  onClick={() => handleStart('pvp')}
                  className="group relative px-7 py-4 md:px-9 md:py-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm cursor-pointer overflow-hidden"
                  whileHover={{ scale: 1.04, borderColor: 'hsl(15, 90%, 55%)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col items-center gap-2">
                    <Users className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                    <span className="text-base md:text-lg font-bold text-zinc-200 tracking-wide">Local PvP</span>
                    <span className="text-xs text-zinc-500">Same device</span>
                  </div>
                </motion.button>

                {/* PvAI */}
                <motion.button
                  onClick={() => handleStart('pvai')}
                  className="group relative px-7 py-4 md:px-9 md:py-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm cursor-pointer overflow-hidden"
                  whileHover={{ scale: 1.04, borderColor: 'hsl(210, 80%, 55%)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col items-center gap-2">
                    <Bot className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 group-hover:text-sky-400 transition-colors" />
                    <span className="text-base md:text-lg font-bold text-zinc-200 tracking-wide">vs AI</span>
                    <span className="text-xs text-zinc-500">Challenge CPU</span>
                  </div>
                </motion.button>

                {/* Online */}
                <motion.button
                  onClick={() => setShowOnline(true)}
                  className="group relative px-7 py-4 md:px-9 md:py-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm cursor-pointer overflow-hidden"
                  whileHover={{ scale: 1.04, borderColor: 'hsl(150, 70%, 50%)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col items-center gap-2">
                    <Globe className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-base md:text-lg font-bold text-zinc-200 tracking-wide">Online</span>
                    <span className="text-xs text-zinc-500">Invite a friend</span>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              <OnlinePanel
                key="online"
                onBack={() => setShowOnline(false)}
                onStartOnline={handleStartOnline}
              />
            )}
          </AnimatePresence>

          <motion.p
            className="absolute bottom-6 text-zinc-600 text-xs tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Choose your battle
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1020 40%, #0a0a18 100%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        />
      )}
    </AnimatePresence>
  );
}
