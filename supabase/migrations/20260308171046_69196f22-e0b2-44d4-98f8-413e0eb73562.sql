
-- Create game_rooms table for online multiplayer
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  board_state JSONB NOT NULL,
  current_turn TEXT NOT NULL DEFAULT 'fire',
  player_fire TEXT, -- anonymous session ID
  player_ice TEXT,  -- anonymous session ID
  last_move JSONB,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  winner TEXT, -- fire, ice, draw, or null
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Everyone can read game rooms (needed for joining and real-time sync)
CREATE POLICY "Anyone can view game rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

-- Anyone can create a room
CREATE POLICY "Anyone can create a game room"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

-- Anyone can update a room (players identified by session ID in app logic)
CREATE POLICY "Anyone can update a game room"
  ON public.game_rooms FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for room code lookups
CREATE INDEX idx_game_rooms_code ON public.game_rooms (room_code);

-- Index for active rooms cleanup
CREATE INDEX idx_game_rooms_status ON public.game_rooms (status, created_at);
