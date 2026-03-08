import { useState, useCallback } from 'react';
import type { PieceColor } from '@/utils/chessLogic';

export type TournamentSize = 4 | 8;

export interface TournamentPlayer {
  id: string;
  name: string;
  color: 'fire' | 'ice' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan' | 'lime';
  eliminated: boolean;
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  status: 'pending' | 'playing' | 'finished';
}

export interface TournamentState {
  active: boolean;
  size: TournamentSize;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  currentMatch: TournamentMatch | null;
  currentRound: number;
  champion: TournamentPlayer | null;
}

const PLAYER_COLORS: TournamentPlayer['color'][] = ['fire', 'ice', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'lime'];

const DEFAULT_NAMES_4 = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const DEFAULT_NAMES_8 = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8'];

function createPlayers(size: TournamentSize, names?: string[]): TournamentPlayer[] {
  const defaultNames = size === 4 ? DEFAULT_NAMES_4 : DEFAULT_NAMES_8;
  const playerNames = names || defaultNames;
  return playerNames.slice(0, size).map((name, i) => ({
    id: `p${i}`,
    name,
    color: PLAYER_COLORS[i],
    eliminated: false,
  }));
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createMatches(players: TournamentPlayer[]): TournamentMatch[] {
  const shuffled = shuffleArray(players);
  const totalRounds = Math.log2(players.length);
  const matches: TournamentMatch[] = [];
  
  // Create first round matches
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      id: `r1-m${i / 2}`,
      round: 1,
      matchIndex: i / 2,
      player1: shuffled[i],
      player2: shuffled[i + 1],
      winner: null,
      status: 'pending',
    });
  }
  
  // Create placeholder matches for subsequent rounds
  let prevRoundMatches = matches.length;
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = prevRoundMatches / 2;
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `r${round}-m${i}`,
        round,
        matchIndex: i,
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
      });
    }
    prevRoundMatches = matchesInRound;
  }
  
  return matches;
}

export function useTournament() {
  const [tournament, setTournament] = useState<TournamentState>({
    active: false,
    size: 4,
    players: [],
    matches: [],
    currentMatch: null,
    currentRound: 1,
    champion: null,
  });

  const startTournament = useCallback((size: TournamentSize, playerNames?: string[]) => {
    const players = createPlayers(size, playerNames);
    const matches = createMatches(players);
    const firstMatch = matches.find(m => m.round === 1 && m.status === 'pending') || null;
    
    setTournament({
      active: true,
      size,
      players,
      matches,
      currentMatch: firstMatch,
      currentRound: 1,
      champion: null,
    });
    
    // Mark first match as playing
    if (firstMatch) {
      setTournament(prev => ({
        ...prev,
        matches: prev.matches.map(m => 
          m.id === firstMatch.id ? { ...m, status: 'playing' as const } : m
        ),
        currentMatch: { ...firstMatch, status: 'playing' },
      }));
    }

    return firstMatch;
  }, []);

  const reportMatchResult = useCallback((winnerColor: PieceColor) => {
    setTournament(prev => {
      if (!prev.currentMatch) return prev;
      
      const match = prev.currentMatch;
      // Map game color to tournament player
      const winner = winnerColor === 'fire' ? match.player1 : match.player2;
      const loser = winnerColor === 'fire' ? match.player2 : match.player1;
      
      if (!winner || !loser) return prev;
      
      // Update matches
      let newMatches = prev.matches.map(m => 
        m.id === match.id ? { ...m, winner, status: 'finished' as const } : m
      );
      
      // Mark loser as eliminated
      const newPlayers = prev.players.map(p => 
        p.id === loser.id ? { ...p, eliminated: true } : p
      );
      
      // Advance winner to next round
      const totalRounds = Math.log2(prev.size);
      if (match.round < totalRounds) {
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const isFirstSlot = match.matchIndex % 2 === 0;
        
        newMatches = newMatches.map(m => {
          if (m.round === nextRound && m.matchIndex === nextMatchIndex) {
            return isFirstSlot 
              ? { ...m, player1: winner }
              : { ...m, player2: winner };
          }
          return m;
        });
      }
      
      // Find next match to play
      // First check current round for unfinished matches
      let nextMatch = newMatches.find(m => 
        m.round === prev.currentRound && m.status === 'pending' && m.player1 && m.player2
      );
      
      // If current round done, move to next round
      let nextRound = prev.currentRound;
      if (!nextMatch) {
        const currentRoundDone = newMatches
          .filter(m => m.round === prev.currentRound)
          .every(m => m.status === 'finished');
        
        if (currentRoundDone && prev.currentRound < totalRounds) {
          nextRound = prev.currentRound + 1;
          nextMatch = newMatches.find(m => 
            m.round === nextRound && m.status === 'pending' && m.player1 && m.player2
          );
        }
      }
      
      // Check for champion
      const isFinal = match.round === totalRounds;
      const champion = isFinal ? winner : null;
      
      // Mark next match as playing
      if (nextMatch) {
        newMatches = newMatches.map(m => 
          m.id === nextMatch!.id ? { ...m, status: 'playing' as const } : m
        );
        nextMatch = { ...nextMatch, status: 'playing' };
      }
      
      return {
        ...prev,
        matches: newMatches,
        players: newPlayers,
        currentMatch: nextMatch || null,
        currentRound: nextRound,
        champion,
      };
    });
  }, []);

  const resetTournament = useCallback(() => {
    setTournament({
      active: false,
      size: 4,
      players: [],
      matches: [],
      currentMatch: null,
      currentRound: 1,
      champion: null,
    });
  }, []);

  return {
    tournament,
    startTournament,
    reportMatchResult,
    resetTournament,
  };
}
