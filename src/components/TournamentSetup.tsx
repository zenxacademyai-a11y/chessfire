import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Users, Flame, Snowflake, Leaf, Star, Sun, Heart, Droplet, Zap, Pencil } from 'lucide-react';
import type { TournamentSize, TournamentPlayer } from '@/hooks/useTournament';

const PLAYER_ICONS = [Flame, Snowflake, Leaf, Star, Sun, Heart, Droplet, Zap];
const PLAYER_COLORS: TournamentPlayer['color'][] = ['fire', 'ice', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'lime'];
const COLOR_CLASSES: Record<TournamentPlayer['color'], string> = {
  fire: 'text-orange-400 border-orange-500/40',
  ice: 'text-sky-400 border-sky-500/40',
  emerald: 'text-emerald-400 border-emerald-500/40',
  purple: 'text-purple-400 border-purple-500/40',
  amber: 'text-amber-400 border-amber-500/40',
  rose: 'text-rose-400 border-rose-500/40',
  cyan: 'text-cyan-400 border-cyan-500/40',
  lime: 'text-lime-400 border-lime-500/40',
};

interface TournamentSetupProps {
  onBack: () => void;
  onStart: (size: TournamentSize, names: string[]) => void;
}

export default function TournamentSetup({ onBack, onStart }: TournamentSetupProps) {
  const [size, setSize] = useState<TournamentSize>(4);
  const [names, setNames] = useState<string[]>(() => 
    Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`)
  );

  const handleNameChange = (index: number, value: string) => {
    setNames(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-5 w-full max-w-md px-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <button onClick={onBack} className="self-start flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-200 tracking-wide">Tournament</h2>
      </div>

      {/* Size selector */}
      <div className="flex gap-3 w-full">
        <motion.button
          onClick={() => setSize(4)}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            size === 4 
              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' 
              : 'border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600'
          }`}
          whileTap={{ scale: 0.97 }}
        >
          <Users size={16} /> 4 Players
        </motion.button>
        <motion.button
          onClick={() => setSize(8)}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            size === 8 
              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' 
              : 'border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600'
          }`}
          whileTap={{ scale: 0.97 }}
        >
          <Users size={16} /> 8 Players
        </motion.button>
      </div>

      {/* Player name inputs */}
      <div className="w-full space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {Array.from({ length: size }).map((_, i) => {
          const Icon = PLAYER_ICONS[i];
          const color = PLAYER_COLORS[i];
          return (
            <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 bg-zinc-900/50 ${COLOR_CLASSES[color]}`}>
              <Icon size={14} className={COLOR_CLASSES[color].split(' ')[0]} />
              <input
                value={names[i]}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                maxLength={20}
              />
              <Pencil size={10} className="text-zinc-600" />
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <motion.button
        onClick={() => onStart(size, names.slice(0, size))}
        className="w-full py-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 font-bold text-lg hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Trophy size={18} /> Start Tournament
      </motion.button>

      <p className="text-[10px] text-zinc-600 tracking-wider">
        {size === 4 ? '2 rounds • Semis → Final' : '3 rounds • Quarters → Semis → Final'}
      </p>
    </motion.div>
  );
}
