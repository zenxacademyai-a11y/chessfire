-- Drop the existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Anyone can create a game room" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can update a game room" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can view game rooms" ON public.game_rooms;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can view game rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a game room"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update a game room"
  ON public.game_rooms FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete a game room"
  ON public.game_rooms FOR DELETE
  USING (true);