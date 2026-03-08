import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PieceType, PieceColor } from '@/utils/chessLogic';

interface ChessPiece3DProps {
  type: PieceType;
  color: PieceColor;
  position: [number, number, number];
  isSelected: boolean;
  isInCheck?: boolean;
  onClick: () => void;
}

// Detailed horse head knight with mane
function KnightGeometry({ material }: { material: THREE.MeshStandardMaterial }) {
  return (
    <group>
      {/* Base pedestal */}
      <mesh material={material} position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 0.24, 20]} />
      </mesh>
      {/* Base ring */}
      <mesh material={material} position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 20]} />
      </mesh>
      
      {/* Neck - curved using multiple segments */}
      <mesh material={material} position={[0, 0.38, 0.02]} rotation={[0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.2, 12]} />
      </mesh>
      <mesh material={material} position={[0, 0.52, 0.06]} rotation={[0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.18, 12]} />
      </mesh>
      <mesh material={material} position={[0, 0.64, 0.1]} rotation={[0.35, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.15, 12]} />
      </mesh>
      
      {/* Head - main skull shape */}
      <mesh material={material} position={[0, 0.74, 0.16]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.18, 0.22]} />
      </mesh>
      
      {/* Snout / muzzle - elongated */}
      <mesh material={material} position={[0, 0.78, 0.3]} rotation={[0.8, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 0.18]} />
      </mesh>
      <mesh material={material} position={[0, 0.78, 0.4]} rotation={[0.9, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.09, 0.12]} />
      </mesh>
      
      {/* Nostrils */}
      <mesh material={material} position={[-0.03, 0.76, 0.46]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
      <mesh material={material} position={[0.03, 0.76, 0.46]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
      
      {/* Lower jaw */}
      <mesh material={material} position={[0, 0.7, 0.28]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.18]} />
      </mesh>
      
      {/* Eyes - slight bulge */}
      <mesh material={material} position={[-0.08, 0.78, 0.2]} castShadow>
        <sphereGeometry args={[0.03, 8, 8]} />
      </mesh>
      <mesh material={material} position={[0.08, 0.78, 0.2]} castShadow>
        <sphereGeometry args={[0.03, 8, 8]} />
      </mesh>
      
      {/* Ears - pointed */}
      <mesh material={material} position={[-0.05, 0.88, 0.1]} rotation={[0.2, 0, -0.3]} castShadow>
        <coneGeometry args={[0.035, 0.14, 4]} />
      </mesh>
      <mesh material={material} position={[0.05, 0.88, 0.1]} rotation={[0.2, 0, 0.3]} castShadow>
        <coneGeometry args={[0.035, 0.14, 4]} />
      </mesh>
      
      {/* Mane - flowing ridge pieces down the neck */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const t = i / 6;
        const y = 0.85 - t * 0.5;
        const z = 0.08 - t * 0.06;
        const scale = 0.8 + Math.sin(t * Math.PI) * 0.4;
        return (
          <mesh key={`mane-${i}`} material={material} position={[0, y, z - 0.06]} rotation={[-0.3 + t * 0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.08 * scale, 0.06]} />
          </mesh>
        );
      })}
      
      {/* Mane side tufts */}
      {[0, 1, 2, 3].map(i => {
        const t = i / 3;
        const y = 0.8 - t * 0.35;
        const z = 0.04 - t * 0.04;
        return (
          <group key={`mane-tuft-${i}`}>
            <mesh material={material} position={[-0.07, y, z - 0.04]} rotation={[0, 0, -0.4 - t * 0.2]} castShadow>
              <boxGeometry args={[0.06, 0.04, 0.04]} />
            </mesh>
            <mesh material={material} position={[0.07, y, z - 0.04]} rotation={[0, 0, 0.4 + t * 0.2]} castShadow>
              <boxGeometry args={[0.06, 0.04, 0.04]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PieceGeometry({ type, material }: { type: PieceType; material: THREE.MeshStandardMaterial }) {
  if (type === 'knight') return <KnightGeometry material={material} />;
  
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

export default function ChessPiece3D({ type, color, position, isSelected, isInCheck, onClick }: ChessPiece3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const needsAnimation = isSelected || isInCheck;

  const material = useMemo(() => {
    if (color === 'fire') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e8520d'),
        emissive: new THREE.Color(isInCheck ? '#ff0000' : '#ff6b1a'),
        emissiveIntensity: isInCheck ? 1.0 : isSelected ? 0.8 : 0.3,
        metalness: 0.7,
        roughness: 0.2,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2d8cf0'),
      emissive: new THREE.Color(isInCheck ? '#ff0000' : '#4dc9f6'),
      emissiveIntensity: isInCheck ? 1.0 : isSelected ? 0.8 : 0.3,
      metalness: 0.7,
      roughness: 0.2,
    });
  }, [color, isSelected, isInCheck]);

  useFrame((state) => {
    if (!groupRef.current || !needsAnimation) return;
    if (isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    } else if (isInCheck) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 20) * 0.03;
    }
  });

  const glowColor = color === 'fire' ? '#ff6b1a' : '#4dc9f6';

  return (
    <group ref={groupRef} position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <PieceGeometry type={type} material={material} />
      {isInCheck && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.42, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.35, 16]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
