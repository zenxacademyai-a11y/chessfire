import { useRef, useEffect, useState } from 'react';
import { Clock, Undo2, ChevronUp, ChevronDown } from 'lucide-react';
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

function toAlgebraic(pos: Position): string {
  const file = String.fromCharCode(97 + pos.col);
  const rank = String(8 - pos.row);
  return `${file}${rank}`;
}

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

function pieceUnicode(type: PieceType, color: PieceColor): string {
  const symbols: Record<PieceColor, Record<PieceType, string>> = {
    fire: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    ice: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
  };
  return symbols[color][type];
}

export function buildMoveNotation(
  pieceType: PieceType, from: Position, to: Position,
  isCapture: boolean, isCheck: boolean, isCheckmate: boolean,
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
  viewingMoveIndex: number | null;
  onMoveClick: (moveIndex: number) => void;
  onExitReplay: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export default function MoveHistoryPanel({ moves, viewingMoveIndex, onMoveClick, onExitReplay, canUndo, onUndo }: MoveHistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current && viewingMoveIndex === null) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, viewingMoveIndex]);

  const movePairs: Array<{ number: number; fire?: { record: MoveRecord; index: number }; ice?: { record: MoveRecord; index: number } }> = [];
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (move.color === 'fire') {
      movePairs.push({ number: move.moveNumber, fire: { record: move, index: i } });
    } else {
      const last = movePairs[movePairs.length - 1];
      if (last && !last.ice) {
        last.ice = { record: move, index: i };
      } else {
        movePairs.push({ number: move.moveNumber, ice: { record: move, index: i } });
      }
    }
  }

  const isReplaying = viewingMoveIndex !== null;

  const panelContent = (
    <>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
        <Clock size={12} className="text-muted-foreground" />
        <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Moves</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{moves.length}</span>
        {canUndo && (
          <button onClick={onUndo} className="ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" title="Undo last move">
            <Undo2 size={12} />
          </button>
        )}
      </div>

      {isReplaying && (
        <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary tracking-wide">MOVE {viewingMoveIndex! + 1}</span>
          <button onClick={onExitReplay} className="text-[10px] font-bold text-primary hover:text-primary/80 underline">Back to live</button>
        </div>
      )}

      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '260px' }}>
        {movePairs.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[10px] text-muted-foreground italic">No moves yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {movePairs.map((pair, i) => (
              <div key={i} className="flex items-stretch text-xs">
                <div className="w-7 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 border-r border-border/20">
                  {pair.number}
                </div>
                <MoveCell entry={pair.fire} color="fire" isActive={pair.fire ? pair.fire.index === viewingMoveIndex : false}
                  isLatest={pair.fire ? pair.fire.index === moves.length - 1 && viewingMoveIndex === null : false} onClick={onMoveClick} />
                <div className="w-px bg-border/20" />
                <MoveCell entry={pair.ice} color="ice" isActive={pair.ice ? pair.ice.index === viewingMoveIndex : false}
                  isLatest={pair.ice ? pair.ice.index === moves.length - 1 && viewingMoveIndex === null : false} onClick={onMoveClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: right side panel */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto z-20 hidden md:block">
        <div className="glass-panel rounded-xl w-48 lg:w-56 overflow-hidden" style={{ maxHeight: '360px' }}>
          {panelContent}
        </div>
      </div>

      {/* Mobile: bottom toggle panel */}
      <div className="md:hidden absolute bottom-28 right-2 left-auto pointer-events-auto z-20">
        {mobileExpanded ? (
          <div className="glass-panel rounded-xl w-44 overflow-hidden" style={{ maxHeight: '280px' }}>
            <button onClick={() => setMobileExpanded(false)} className="w-full px-3 py-1 flex items-center justify-center border-b border-border/30">
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
            {panelContent}
          </div>
        ) : (
          <button onClick={() => setMobileExpanded(true)}
            className="glass-panel rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground tracking-wide">
            <Clock size={10} />
            <span>{moves.length}</span>
            <ChevronUp size={10} />
          </button>
        )}
      </div>
    </>
  );
}

function MoveCell({ entry, color, isActive, isLatest, onClick }: {
  entry?: { record: MoveRecord; index: number }; color: PieceColor; isActive: boolean; isLatest: boolean; onClick: (index: number) => void;
}) {
  if (!entry) {
    return <div className="flex-1 px-1.5 py-1 flex items-center gap-1 min-h-[26px]"><span className="text-muted-foreground/40">—</span></div>;
  }

  const { record, index } = entry;
  const colorClass = color === 'fire' ? 'text-primary' : 'text-secondary';

  return (
    <div className={`flex-1 px-1.5 py-1 flex items-center gap-0.5 min-h-[26px] cursor-pointer transition-all ${
      isActive ? 'bg-primary/20 ring-1 ring-inset ring-primary/30' : isLatest ? 'bg-muted/30' : 'hover:bg-muted/40'
    }`} onClick={() => onClick(index)} title="View board after this move">
      <span className={`${colorClass} text-sm leading-none`}>{pieceUnicode(record.pieceType, color)}</span>
      <span className={`font-mono font-semibold tracking-wide text-[11px] ${
        record.isCheckmate ? 'text-destructive' : record.isCheck ? 'text-yellow-600' : record.isCapture ? colorClass : 'text-foreground'
      }`}>{record.notation}</span>
    </div>
  );
}
