import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Flame, Snowflake, Clock } from 'lucide-react';
import type { PieceColor, PieceType, Position } from '@/utils/chessLogic';

export interface MoveRecord {
  moveNumber: number;
  color: PieceColor;
  pieceType: PieceType;
  from: Position;
  to: Position;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  notation: string;
}

// Convert position to algebraic notation
function toAlgebraic(pos: Position): string {
  const file = String.fromCharCode(97 + pos.col); // a-h
  const rank = String(8 - pos.row); // 1-8
  return `${file}${rank}`;
}

// Piece letter for notation
function pieceSymbol(type: PieceType): string {
  switch (type) {
    case 'king': return 'K';
    case 'queen': return 'Q';
    case 'rook': return 'R';
    case 'bishop': return 'B';
    case 'knight': return 'N';
    case 'pawn': return '';
  }
}

// Unicode chess symbols
function pieceUnicode(type: PieceType, color: PieceColor): string {
  const symbols: Record<PieceColor, Record<PieceType, string>> = {
    fire: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    ice: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
  };
  return symbols[color][type];
}

export function buildMoveNotation(
  pieceType: PieceType,
  from: Position,
  to: Position,
  isCapture: boolean,
  isCheck: boolean,
  isCheckmate: boolean,
): string {
  let notation = pieceSymbol(pieceType);
  if (isCapture) {
    if (pieceType === 'pawn') notation += String.fromCharCode(97 + from.col);
    notation += 'x';
  }
  notation += toAlgebraic(to);
  if (isCheckmate) notation += '#';
  else if (isCheck) notation += '+';
  return notation;
}

interface MoveHistoryPanelProps {
  moves: MoveRecord[];
}

export default function MoveHistoryPanel({ moves }: MoveHistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  // Group moves into pairs (fire + ice = 1 full move)
  const movePairs: Array<{ number: number; fire?: MoveRecord; ice?: MoveRecord }> = [];
  for (const move of moves) {
    if (move.color === 'fire') {
      movePairs.push({ number: move.moveNumber, fire: move });
    } else {
      const last = movePairs[movePairs.length - 1];
      if (last && !last.ice) {
        last.ice = move;
      } else {
        movePairs.push({ number: move.moveNumber, ice: move });
      }
    }
  }

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto z-20">
      <div className="glass-panel rounded-xl w-48 md:w-56 overflow-hidden"
        style={{ maxHeight: '360px' }}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
          <Clock size={12} className="text-muted-foreground" />
          <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Move History</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{moves.length}</span>
        </div>

        {/* Moves list */}
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '310px' }}>
          {movePairs.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-muted-foreground italic">No moves yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Make a move to begin</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {movePairs.map((pair, i) => (
                <div key={i} className={`flex items-stretch text-xs ${
                  i === movePairs.length - 1 ? 'bg-muted/30' : ''
                }`}>
                  {/* Move number */}
                  <div className="w-8 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 border-r border-border/20">
                    {pair.number}
                  </div>

                  {/* Fire move */}
                  <div className="flex-1 px-2 py-1.5 flex items-center gap-1 min-h-[28px]">
                    {pair.fire ? (
                      <>
                        <span className="text-primary text-sm leading-none">
                          {pieceUnicode(pair.fire.pieceType, 'fire')}
                        </span>
                        <span className={`font-mono font-semibold tracking-wide ${
                          pair.fire.isCheckmate ? 'text-destructive' : pair.fire.isCheck ? 'text-yellow-600' : pair.fire.isCapture ? 'text-primary' : 'text-foreground'
                        }`}>
                          {pair.fire.notation}
                        </span>
                      </>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-border/20" />

                  {/* Ice move */}
                  <div className="flex-1 px-2 py-1.5 flex items-center gap-1 min-h-[28px]">
                    {pair.ice ? (
                      <>
                        <span className="text-secondary text-sm leading-none">
                          {pieceUnicode(pair.ice.pieceType, 'ice')}
                        </span>
                        <span className={`font-mono font-semibold tracking-wide ${
                          pair.ice.isCheckmate ? 'text-destructive' : pair.ice.isCheck ? 'text-yellow-600' : pair.ice.isCapture ? 'text-secondary' : 'text-foreground'
                        }`}>
                          {pair.ice.notation}
                        </span>
                      </>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
