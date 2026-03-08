import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import ChessPiece3D from './ChessPiece3D';
import AnimatingPieceComponent from './AnimatingPiece';
import type { Board, Position } from '@/utils/chessLogic';
import type { AnimatingPiece } from '@/hooks/useChessGame';

interface ChessBoard3DProps {
  board: Board;
  selectedPos: Position | null;
  validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
  animatingPiece: AnimatingPiece | null;
  kingInCheckPos: Position | null;
}

function BoardSquare({ row, col, isLight, isSelected, isValidMove, isKingInCheck, onClick }: {
  row: number; col: number; isLight: boolean; isSelected: boolean; isValidMove: boolean; isKingInCheck: boolean; onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const x = col - 3.5;
  const z = row - 3.5;

  const baseColor = isLight ? '#1a1a2e' : '#0f0f1a';

  let color = baseColor;
  let emissive = '#000000';
  let emissiveIntensity = 0;

  if (isKingInCheck) {
    color = '#4a0000';
    emissive = '#ff0000';
    emissiveIntensity = 0.6;
  } else if (isSelected) {
    color = '#ff8c00';
    emissive = '#ff6600';
    emissiveIntensity = 0.5;
  } else if (isValidMove) {
    color = '#00cc66';
    emissive = '#00ff88';
    emissiveIntensity = 0.3;
  }

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (isValidMove) {
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
    if (isKingInCheck) {
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onClick(); }} receiveShadow>
      <boxGeometry args={[1, 0.15, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.4}
        roughness={0.6}
      />
    </mesh>
  );
}

function BoardFrame() {
  return (
    <group>
      {[[-4.5, 0, 0, 1, 0.2, 9], [4.5, 0, 0, 1, 0.2, 9],
        [0, 0, -4.5, 9, 0.2, 1], [0, 0, 4.5, 9, 0.2, 1]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#0a0a15" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function FireParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: 4 + Math.random() * 2,
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.04,
    })), []);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed + p.offset;
      dummy.position.set(p.x + Math.sin(t) * 0.3, (t % 3) * 0.8, p.z + Math.cos(t * 0.5) * 0.2);
      dummy.scale.setScalar(p.size * (1 - (t % 3) / 3));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ff6b1a" transparent opacity={0.8} />
    </instancedMesh>
  );
}

function IceParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: -4 - Math.random() * 2,
      speed: 0.3 + Math.random() * 1,
      offset: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.03,
    })), []);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed + p.offset;
      dummy.position.set(p.x + Math.sin(t * 0.7) * 0.5, Math.sin(t) * 0.5 + 1, p.z + Math.cos(t * 0.3) * 0.3);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#4dc9f6" transparent opacity={0.6} />
    </instancedMesh>
  );
}

export default function ChessBoard3D({ board, selectedPos, validMoves, onSquareClick, animatingPiece, kingInCheckPos }: ChessBoard3DProps) {
  // Find source position of animating piece to hide it on the board
  const animFromRow = animatingPiece ? Math.round(animatingPiece.from[2] + 3.5) : -1;
  const animFromCol = animatingPiece ? Math.round(animatingPiece.from[0] + 3.5) : -1;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 5, 5]} color="#ff6b1a" intensity={1} distance={15} />
      <pointLight position={[0, 5, -5]} color="#4dc9f6" intensity={1} distance={15} />

      <OrbitControls
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={6}
        maxDistance={14}
        target={[0, 0, 0]}
        enablePan={false}
      />

      <BoardFrame />
      
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const isLight = (row + col) % 2 === 0;
          const isSelected = selectedPos?.row === row && selectedPos?.col === col;
          const isValidMove = validMoves.some(m => m.row === row && m.col === col);
          const isKingInCheck = kingInCheckPos?.row === row && kingInCheckPos?.col === col;
          
          return (
            <BoardSquare
              key={`${row}-${col}`}
              row={row} col={col}
              isLight={isLight}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isKingInCheck={isKingInCheck}
              onClick={() => onSquareClick(row, col)}
            />
          );
        })
      )}

      {board.map((row, rowIdx) =>
        row.map((piece, colIdx) => {
          if (!piece) return null;
          // Hide piece at animation source
          if (rowIdx === animFromRow && colIdx === animFromCol) return null;
          
          const x = colIdx - 3.5;
          const z = rowIdx - 3.5;
          const isSelected = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;
          const isInCheck = piece.type === 'king' && kingInCheckPos?.row === rowIdx && kingInCheckPos?.col === colIdx;
          
          return (
            <ChessPiece3D
              key={`piece-${rowIdx}-${colIdx}`}
              type={piece.type}
              color={piece.color}
              position={[x, 0.08, z]}
              isSelected={isSelected}
              isInCheck={isInCheck}
              onClick={() => onSquareClick(rowIdx, colIdx)}
            />
          );
        })
      )}

      {/* Animating piece */}
      {animatingPiece && (
        <AnimatingPieceComponent
          anim={animatingPiece}
          duration={animatingPiece.isKnight ? 600 : 400}
        />
      )}

      <FireParticles />
      <IceParticles />

      <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={12} blur={2} />
      <fog attach="fog" args={['#0a0a15', 10, 25]} />
    </>
  );
}
