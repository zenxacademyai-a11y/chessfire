import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PieceType, PieceColor } from '@/utils/chessLogic';
import type { AnimatingPiece } from '@/hooks/useChessGame';

// Easing function
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Reuse the same material creation logic
function createMaterial(color: PieceColor) {
  if (color === 'fire') {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8520d'),
      emissive: new THREE.Color('#ff6b1a'),
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2d8cf0'),
    emissive: new THREE.Color('#4dc9f6'),
    emissiveIntensity: 0.5,
    metalness: 0.7,
    roughness: 0.2,
  });
}

// Simple geometry for animating piece
function AnimPieceGeom({ type, material }: { type: PieceType; material: THREE.MeshStandardMaterial }) {
  // Simplified versions for animation
  const h = type === 'king' ? 1.1 : type === 'queen' ? 0.95 : type === 'knight' ? 0.9 : type === 'bishop' ? 0.85 : type === 'rook' ? 0.7 : 0.5;
  return (
    <group>
      <mesh material={material} castShadow>
        <cylinderGeometry args={[0.12, 0.22, h, 12]} />
        </mesh>
      <mesh material={material} position={[0, h / 2, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
      </mesh>
    </group>
  );
}

interface AnimatingPieceComponentProps {
  anim: AnimatingPiece;
  duration: number;
}

export default function AnimatingPieceComponent({ anim, duration }: AnimatingPieceComponentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = useMemo(() => createMaterial(anim.color), [anim.color]);
  const glowColor = anim.color === 'fire' ? '#ff6b1a' : '#4dc9f6';

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = (Date.now() - anim.startTime) / duration;
    const t = Math.min(easeInOutCubic(elapsed), 1);

    const x = anim.from[0] + (anim.to[0] - anim.from[0]) * t;
    const z = anim.from[2] + (anim.to[2] - anim.from[2]) * t;
    
    // Arc height - knights jump higher
    const arcHeight = anim.isKnight ? 1.5 : 0.4;
    const y = anim.from[1] + Math.sin(t * Math.PI) * arcHeight;

    groupRef.current.position.set(x, y, z);
    
    // Knights rotate during jump
    if (anim.isKnight) {
      groupRef.current.rotation.y = t * Math.PI * 2;
    }
  });

  return (
    <group ref={groupRef} position={anim.from}>
      <AnimPieceGeom type={anim.type} material={material} />
      <pointLight color={glowColor} intensity={2} distance={3} />
      {/* Trail effect */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.25, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
