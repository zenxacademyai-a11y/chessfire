import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Crown, Flame, Snowflake, Leaf, Star, Sun, Heart, Droplet, Zap } from 'lucide-react';
import type { TournamentState, TournamentMatch, TournamentPlayer } from '@/hooks/useTournament';

const COLOR_MAP: Record<TournamentPlayer['color'], { bg: string; text: string; border: string; glow: string; icon: typeof Flame }> = {
  fire: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', glow: '0 0 15px hsl(15 90% 55% / 0.3)', icon: Flame },
  ice: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40', glow: '0 0 15px hsl(210 80% 55% / 0.3)', icon: Snowflake },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: '0 0 15px hsl(160 70% 45% / 0.3)', icon: Leaf },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', glow: '0 0 15px hsl(270 70% 55% / 0.3)', icon: Star },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', glow: '0 0 15px hsl(40 90% 50% / 0.3)', icon: Sun },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', glow: '0 0 15px hsl(350 80% 55% / 0.3)', icon: Heart },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40', glow: '0 0 15px hsl(190 80% 50% / 0.3)', icon: Droplet },
  lime: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/40', glow: '0 0 15px hsl(80 70% 50% / 0.3)', icon: Zap },
};

function PlayerSlot({ player, isWinner, isPlaying }: { player: TournamentPlayer | null; isWinner?: boolean; isPlaying?: boolean }) {
  if (!player) {
    return (
      <div className="h-8 md:h-9 px-2 md:px-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 flex items-center justify-center">
        <span className="text-[10px] md:text-xs text-zinc-700 italic">TBD</span>
      </div>
    );
  }
  
  const colors = COLOR_MAP[player.color];
  const Icon = colors.icon;
  
  return (
    <motion.div
      className={`h-8 md:h-9 px-2 md:px-3 rounded-lg border flex items-center gap-1.5 md:gap-2 transition-all ${
        isWinner ? `${colors.bg} ${colors.border}` : 
        player.eliminated ? 'border-zinc-800/40 bg-zinc-900/20 opacity-40' :
        isPlaying ? `${colors.border} bg-zinc-900/60` :
        'border-zinc-700/40 bg-zinc-900/50'
      }`}
      style={isWinner ? { boxShadow: colors.glow } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Icon size={12} className={`${colors.text} flex-shrink-0`} />
      <span className={`text-[10px] md:text-xs font-semibold tracking-wide truncate ${isWinner ? colors.text : player.eliminated ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
        {player.name}
      </span>
      {isWinner && <Trophy size={10} className={`${colors.text} flex-shrink-0`} />}
    </motion.div>
  );
}

function MatchCard({ match }: { match: TournamentMatch }) {
  const isPlaying = match.status === 'playing';
  
  return (
    <motion.div
      className={`flex flex-col gap-1 p-1.5 md:p-2 rounded-xl border transition-all min-w-[120px] md:min-w-[150px] ${
        isPlaying ? 'border-yellow-500/40 bg-yellow-500/5' : 
        match.status === 'finished' ? 'border-zinc-700/30 bg-zinc-900/30' :
        'border-zinc-800/40 bg-zinc-900/40'
      }`}
      style={isPlaying ? { boxShadow: '0 0 20px hsl(45 90% 50% / 0.15)' } : {}}
      layout
    >
      {isPlaying && (
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <Swords size={10} className="text-yellow-500" />
          <span className="text-[8px] md:text-[9px] font-bold text-yellow-500 tracking-widest uppercase animate-pulse">LIVE</span>
        </div>
      )}
      <PlayerSlot player={match.player1} isWinner={match.winner?.id === match.player1?.id} isPlaying={isPlaying} />
      <div className="flex items-center gap-1 px-2">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[8px] text-zinc-600 font-bold">VS</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <PlayerSlot player={match.player2} isWinner={match.winner?.id === match.player2?.id} isPlaying={isPlaying} />
    </motion.div>
  );
}

function RoundColumn({ matches, roundLabel }: { matches: TournamentMatch[]; roundLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{roundLabel}</span>
      <div className="flex flex-col gap-4 md:gap-6 justify-center h-full">
        {matches.map(match => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

interface TournamentBracketProps {
  tournament: TournamentState;
  onStartMatch?: () => void;
  onClose?: () => void;
}

export default function TournamentBracket({ tournament, onStartMatch, onClose }: TournamentBracketProps) {
  const totalRounds = Math.log2(tournament.size);
  const roundLabels = tournament.size === 4 
    ? ['Semis', 'Final']
    : ['Quarter', 'Semis', 'Final'];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1020 40%, #0a0a18 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
          <h2 className="text-2xl md:text-4xl font-black tracking-wider text-zinc-100">TOURNAMENT</h2>
          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
        </div>
        <p className="text-xs md:text-sm text-zinc-500 tracking-widest uppercase">
          {tournament.size}-Player Elimination • Round {tournament.currentRound}
        </p>
      </div>

      {/* Champion announcement */}
      <AnimatePresence>
        {tournament.champion && (
          <motion.div
            className="flex flex-col items-center gap-3 mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <Crown className="w-10 h-10 md:w-14 md:h-14 text-yellow-500" style={{ filter: 'drop-shadow(0 0 20px hsl(45 90% 50% / 0.5))' }} />
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = COLOR_MAP[tournament.champion.color].icon;
                return <Icon size={20} className={COLOR_MAP[tournament.champion.color].text} />;
              })()}
              <span className="text-xl md:text-3xl font-black text-yellow-400 tracking-wider">{tournament.champion.name}</span>
            </div>
            <span className="text-sm md:text-base text-yellow-500/80 tracking-widest uppercase font-bold">🏆 Champion! 🏆</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bracket */}
      <div className="flex items-center gap-4 md:gap-8 px-4 overflow-x-auto max-w-full">
        {Array.from({ length: totalRounds }).map((_, roundIndex) => {
          const round = roundIndex + 1;
          const roundMatches = tournament.matches.filter(m => m.round === round);
          return (
            <div key={round} className="flex items-center gap-4 md:gap-8">
              <RoundColumn 
                matches={roundMatches} 
                roundLabel={roundLabels[roundIndex] || `Round ${round}`} 
              />
              {round < totalRounds && (
                <div className="flex flex-col gap-4 md:gap-6 justify-center">
                  {roundMatches.map((_, i) => (
                    i % 2 === 0 && (
                      <div key={i} className="w-6 md:w-10 flex flex-col items-center">
                        <div className="w-px h-8 md:h-12 bg-zinc-700/40" />
                        <div className="w-3 md:w-5 h-px bg-zinc-700/40" />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current match info + actions */}
      <div className="mt-6 md:mt-8 flex flex-col items-center gap-3">
        {tournament.currentMatch && !tournament.champion && (
          <>
            <div className="flex items-center gap-2 text-zinc-400 text-xs md:text-sm">
              <Swords size={14} />
              <span>
                <strong className={COLOR_MAP[tournament.currentMatch.player1?.color || 'fire'].text}>
                  {tournament.currentMatch.player1?.name}
                </strong>
                {' vs '}
                <strong className={COLOR_MAP[tournament.currentMatch.player2?.color || 'ice'].text}>
                  {tournament.currentMatch.player2?.name}
                </strong>
              </span>
            </div>
            {onStartMatch && (
              <motion.button
                onClick={onStartMatch}
                className="px-6 py-3 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 font-bold text-sm md:text-base hover:bg-yellow-500/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⚔ Start Match
              </motion.button>
            )}
          </>
        )}

        {(tournament.champion || !tournament.currentMatch) && onClose && (
          <motion.button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-300 font-bold text-sm md:text-base hover:bg-zinc-800/60 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tournament.champion ? '🏠 Back to Menu' : 'Close'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
