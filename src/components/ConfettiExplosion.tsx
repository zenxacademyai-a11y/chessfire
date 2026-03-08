import { useEffect, useState, useRef } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'triangle';
  opacity: number;
}

const CONFETTI_COLORS = [
  'hsl(15, 90%, 55%)',   // fire orange
  'hsl(25, 100%, 60%)',  // fire glow
  'hsl(45, 100%, 55%)',  // gold
  'hsl(0, 85%, 55%)',    // red
  'hsl(30, 95%, 50%)',   // amber
  'hsl(55, 90%, 55%)',   // yellow
  'hsl(320, 80%, 55%)',  // pink
  'hsl(280, 70%, 60%)',  // purple
  'hsl(160, 70%, 50%)',  // teal
];

export default function ConfettiExplosion({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const animRef = useRef<number>();
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 30 + (Math.random() - 0.5) * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 8,
      speedY: -4 - Math.random() * 8,
      rotationSpeed: (Math.random() - 0.5) * 15,
      shape: (['rect', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      opacity: 1,
    }));

    setPieces(newPieces);
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      setPieces(prev => prev.map(p => ({
        ...p,
        x: p.x + p.speedX * 0.15,
        y: p.y + (p.speedY + elapsed * 3) * 0.15, // gravity
        rotation: p.rotation + p.rotationSpeed,
        speedX: p.speedX * 0.995, // air resistance
        opacity: Math.max(0, 1 - elapsed / 4),
      })).filter(p => p.opacity > 0 && p.y < 110));

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 1.5,
            backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0',
            borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            boxShadow: p.shape !== 'triangle' ? `0 0 ${p.size}px ${p.color}40` : undefined,
          }}
        />
      ))}
    </div>
  );
}
