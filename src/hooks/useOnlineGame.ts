import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createInitialBoard } from '@/utils/chessLogic';
import type { Json } from '@/integrations/supabase/types';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getSessionId(): string {
  let id = localStorage.getItem('chess_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('chess_session_id', id);
  }
  return id;
}

export type OnlineStatus = 'idle' | 'creating' | 'waiting' | 'joining' | 'playing' | 'error';

interface OnlineGameState {
  status: OnlineStatus;
  roomCode: string | null;
  roomId: string | null;
  playerColor: 'fire' | 'ice' | null;
  error: string | null;
  opponentDisconnected: boolean;
}

export function useOnlineGame() {
  const [state, setState] = useState<OnlineGameState>({
    status: 'idle',
    roomCode: null,
    roomId: null,
    playerColor: null,
    error: null,
  });
  const sessionId = useRef(getSessionId());

  const createRoom = useCallback(async () => {
    setState(s => ({ ...s, status: 'creating', error: null }));
    
    const roomCode = generateRoomCode();
    const initialBoard = createInitialBoard();

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        board_state: initialBoard as unknown as Json,
        player_fire: sessionId.current,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      setState(s => ({ ...s, status: 'error', error: 'Failed to create room. Try again.' }));
      return;
    }

    setState({
      status: 'waiting',
      roomCode: roomCode,
      roomId: data.id,
      playerColor: 'fire',
      error: null,
    });
  }, []);

  const joinRoom = useCallback(async (code: string) => {
    setState(s => ({ ...s, status: 'joining', error: null }));
    
    const upperCode = code.toUpperCase().trim();

    // Find the room
    const { data: room, error: fetchError } = await supabase
      .from('game_rooms')
      .select()
      .eq('room_code', upperCode)
      .eq('status', 'waiting')
      .single();

    if (fetchError || !room) {
      setState(s => ({ ...s, status: 'idle', error: 'Room not found or already full.' }));
      return;
    }

    // Don't join your own room
    if (room.player_fire === sessionId.current) {
      setState(s => ({ ...s, status: 'waiting', roomCode: upperCode, roomId: room.id, playerColor: 'fire', error: null }));
      return;
    }

    // Join as ice player
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        player_ice: sessionId.current,
        status: 'playing',
      })
      .eq('id', room.id)
      .eq('status', 'waiting');

    if (updateError) {
      setState(s => ({ ...s, status: 'idle', error: 'Failed to join room.' }));
      return;
    }

    setState({
      status: 'playing',
      roomCode: upperCode,
      roomId: room.id,
      playerColor: 'ice',
      error: null,
    });
  }, []);

  const leaveRoom = useCallback(() => {
    setState({
      status: 'idle',
      roomCode: null,
      roomId: null,
      playerColor: null,
      error: null,
    });
  }, []);

  // Listen for opponent joining when waiting
  useEffect(() => {
    if (state.status !== 'waiting' || !state.roomId) return;

    const channel = supabase
      .channel(`room-${state.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${state.roomId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'playing' && updated.player_ice) {
            setState(s => ({ ...s, status: 'playing' }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.status, state.roomId]);

  return {
    ...state,
    sessionId: sessionId.current,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
