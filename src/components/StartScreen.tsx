import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Swords, Users, Bot } from 'lucide-react';

interface StartScreenProps {
  onStart: (mode: 'pvp' | 'pvai') => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'pvp' | 'pvai' | null>(null);

  const handleStart = (mode: 'pvp' | 'pvai') => {
    setSelectedMode(mode);
    setExiting(true);
    setTimeout(() => onStart(mode), 800);
  };

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
            {/* Icons row */}
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

            {/* Title */}
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

          {/* Mode selection */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 md:gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* PvP Button */}
            <motion.button
              onClick={() => handleStart('pvp')}
              className="group relative px-8 py-4 md:px-10 md:py-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.04, borderColor: 'hsl(15, 90%, 55%)' }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex flex-col items-center gap-2">
                <Users className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                <span className="text-lg md:text-xl font-bold text-zinc-200 tracking-wide">Player vs Player</span>
                <span className="text-xs text-zinc-500">Local multiplayer</span>
              </div>
            </motion.button>

            {/* PvAI Button */}
            <motion.button
              onClick={() => handleStart('pvai')}
              className="group relative px-8 py-4 md:px-10 md:py-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.04, borderColor: 'hsl(210, 80%, 55%)' }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex flex-col items-center gap-2">
                <Bot className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 group-hover:text-sky-400 transition-colors" />
                <span className="text-lg md:text-xl font-bold text-zinc-200 tracking-wide">Player vs AI</span>
                <span className="text-xs text-zinc-500">Challenge the computer</span>
              </div>
            </motion.button>
          </motion.div>

          {/* Footer hint */}
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
