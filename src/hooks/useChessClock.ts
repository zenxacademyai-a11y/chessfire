import { useState, useRef, useCallback, useEffect } from 'react';
import type { PieceColor } from '@/utils/chessLogic';

const INITIAL_TIME = 10 * 60; // 10 minutes per player

export function useChessClock(currentTurn: PieceColor, checkmatedColor: PieceColor | null) {
  const [fireTime, setFireTime] = useState(INITIAL_TIME);
  const [iceTime, setIceTime] = useState(INITIAL_TIME);
  const [timedOutColor, setTimedOutColor] = useState<PieceColor | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (checkmatedColor || timedOutColor) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (currentTurn === 'fire') {
        setFireTime(prev => {
          if (prev <= 1) { setTimedOutColor('fire'); return 0; }
          return prev - 1;
        });
      } else {
        setIceTime(prev => {
          if (prev <= 1) { setTimedOutColor('ice'); return 0; }
          return prev - 1;
        });
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentTurn, checkmatedColor, timedOutColor]);

  const resetClock = useCallback(() => {
    setFireTime(INITIAL_TIME);
    setIceTime(INITIAL_TIME);
    setTimedOutColor(null);
  }, []);

  return { fireTime, iceTime, timedOutColor, resetClock };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
