import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PieceType, PieceColor } from '@/utils/chessLogic';

interface ChessPiece3DProps {
  type: PieceType;
  color: PieceColor;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}

function PieceGeometry({ type, material }: { type: PieceType; material: THREE.MeshStandardMaterial }) {
  switch (type) {
    case 'pawn':
      return (
        <group>
          <mesh material={material} position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 0.3, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.15, 0.15, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>
        </group>
      );
    case 'rook':
      return (
        <group>
          <mesh material={material} position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.25, 0.4, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.2, 4]} />
          </mesh>
          <mesh material={material} position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.35, 0.15, 0.35]} />
          </mesh>
        </group>
      );
    case 'knight':
      return (
        <group>
          <mesh material={material} position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.25, 0.4, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.5, 0.05]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.15, 0.35, 0.25]} />
          </mesh>
          <mesh material={material} position={[0, 0.72, 0.12]} rotation={[0.6, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.2, 0.15]} />
          </mesh>
          <mesh material={material} position={[-0.06, 0.82, 0.08]} rotation={[0.3, 0, -0.2]} castShadow>
            <coneGeometry args={[0.04, 0.12, 4]} />
          </mesh>
          <mesh material={material} position={[0.06, 0.82, 0.08]} rotation={[0.3, 0, 0.2]} castShadow>
            <coneGeometry args={[0.04, 0.12, 4]} />
          </mesh>
        </group>
      );
    case 'bishop':
      return (
        <group>
          <mesh material={material} position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.23, 0.4, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.55, 0]} castShadow>
            <coneGeometry args={[0.18, 0.5, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.85, 0]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
        </group>
      );
    case 'queen':
      return (
        <group>
          <mesh material={material} position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.25, 0.4, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.2, 0.25, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.75, 0]} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.95, 0]} castShadow>
            <coneGeometry args={[0.06, 0.15, 8]} />
          </mesh>
        </group>
      );
    case 'king':
      return (
        <group>
          <mesh material={material} position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.26, 0.4, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.2, 0.25, 16]} />
          </mesh>
          <mesh material={material} position={[0, 0.75, 0]} castShadow>
            <sphereGeometry args={[0.17, 16, 16]} />
          </mesh>
          <mesh material={material} position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
          </mesh>
          <mesh material={material} position={[0, 1.05, 0]} castShadow>
            <boxGeometry args={[0.15, 0.04, 0.04]} />
          </mesh>
        </group>
      );
  }
}

export default function ChessPiece3D({ type, color, position, isSelected, onClick }: ChessPiece3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const material = useMemo(() => {
    if (color === 'fire') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e8520d'),
        emissive: new THREE.Color('#ff6b1a'),
        emissiveIntensity: isSelected ? 0.8 : 0.3,
        metalness: 0.7,
        roughness: 0.2,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2d8cf0'),
      emissive: new THREE.Color('#4dc9f6'),
      emissiveIntensity: isSelected ? 0.8 : 0.3,
      metalness: 0.7,
      roughness: 0.2,
    });
  }, [color, isSelected]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    } else {
      groupRef.current.position.y = position[1];
      groupRef.current.rotation.y = 0;
    }
    if (glowRef.current) {
      glowRef.current.intensity = isSelected ? 2 + Math.sin(state.clock.elapsedTime * 4) : 0.5;
    }
  });

  const glowColor = color === 'fire' ? '#ff6b1a' : '#4dc9f6';

  return (
    <group ref={groupRef} position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <PieceGeometry type={type} material={material} />
      <pointLight ref={glowRef} color={glowColor} intensity={0.5} distance={2} />
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.35, 32]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
