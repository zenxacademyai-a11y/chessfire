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
  hintMove?: { from: Position; to: Position } | null;
}

function BoardSquare({ row, col, isLight, isSelected, isValidMove, isKingInCheck, isHintFrom, isHintTo, onClick }: {
  row: number; col: number; isLight: boolean; isSelected: boolean; isValidMove: boolean; isKingInCheck: boolean; isHintFrom: boolean; isHintTo: boolean; onClick: () => void;
}) {
  const x = col - 3.5;
  const z = row - 3.5;

  const baseColor = isLight ? '#e8dcc8' : '#8b6f47';

  let color = baseColor;
  let emissive = '#000000';
  let emissiveIntensity = 0;

  if (isKingInCheck) {
    color = '#cc2200';
    emissive = '#ff0000';
    emissiveIntensity = 0.6;
  } else if (isHintFrom) {
    color = '#44aaff';
    emissive = '#2288ff';
    emissiveIntensity = 0.4;
  } else if (isHintTo) {
    color = '#ffaa00';
    emissive = '#ff8800';
    emissiveIntensity = 0.4;
  } else if (isSelected) {
    color = '#ffcc44';
    emissive = '#ffaa00';
    emissiveIntensity = 0.3;
  } else if (isValidMove) {
    color = '#44cc66';
    emissive = '#00ff88';
    emissiveIntensity = 0.2;
  }

  return (
    <mesh position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onClick(); }} receiveShadow>
      <boxGeometry args={[1, 0.15, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.1}
        roughness={0.7}
      />
    </mesh>
  );
}

function BoardFrame() {
  return (
    <group>
      {[[-4.5, 0, 0, 1, 0.2, 9], [4.5, 0, 0, 1, 0.2, 9],
        [0, 0, -4.5, 9, 0.2, 1], [0, 0, 4.5, 9, 0.2, 1]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#5c3a1e" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Lightweight fire effect — reduced particles
function RealisticFire() {
  const flames = useMemo(() =>
    Array.from({ length: 25 }, () => ({
      x: (Math.random() - 0.5) * 9,
      z: 3.5 + Math.random() * 3,
      speed: 1.0 + Math.random() * 2.5,
      offset: Math.random() * Math.PI * 2,
      size: 0.03 + Math.random() * 0.07,
      life: 1.5 + Math.random() * 2,
    })), []);

  const flameRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!flameRef.current) return;
    flames.forEach((p, i) => {
      const t = (state.clock.elapsedTime * p.speed + p.offset) % p.life;
      const progress = t / p.life;
      const y = progress * 2.5;
      dummy.position.set(p.x, y, p.z);
      dummy.scale.setScalar(Math.max(p.size * (1 - progress * 0.7), 0.001));
      dummy.updateMatrix();
      flameRef.current!.setMatrixAt(i, dummy.matrix);
    });
    flameRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={flameRef} args={[undefined, undefined, flames.length]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.85} />
      </instancedMesh>
      <pointLight position={[0, 1.5, 5]} color="#ff6600" intensity={2} distance={10} />
    </group>
  );
}

// Realistic ice/snow — snowflakes falling, ice crystals, frost mist
function RealisticIceSnow() {
  // Snowflakes — gently falling
  const snowflakes = useMemo(() =>
    Array.from({ length: 80 }, () => ({
      x: (Math.random() - 0.5) * 12,
      z: -3 - Math.random() * 5,
      y: Math.random() * 5,
      speed: 0.3 + Math.random() * 0.7,
      offset: Math.random() * Math.PI * 2,
      size: 0.015 + Math.random() * 0.035,
      drift: Math.random() * 0.5,
    })), []);

  const snowRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!snowRef.current) return;
    snowflakes.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed + p.offset;
      const fallY = p.y - (t % 5) * 0.8;
      const y = fallY < -0.5 ? p.y : fallY;
      dummy.position.set(
        p.x + Math.sin(t * 0.8 + p.offset) * p.drift,
        y,
        p.z + Math.cos(t * 0.5 + p.offset) * 0.3
      );
      const twinkle = 0.7 + Math.sin(t * 4 + p.offset * 3) * 0.3;
      dummy.scale.setScalar(p.size * twinkle);
      dummy.rotation.set(t * 0.5, t * 0.3, t * 0.7);
      dummy.updateMatrix();
      snowRef.current!.setMatrixAt(i, dummy.matrix);
    });
    snowRef.current.instanceMatrix.needsUpdate = true;
  });

  // Ice crystals — static-ish floating shards
  const crystals = useMemo(() =>
    Array.from({ length: 25 }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: -3.5 - Math.random() * 3,
      y: 0.5 + Math.random() * 2.5,
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.04,
    })), []);

  const crystalRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state) => {
    if (!crystalRef.current) return;
    crystals.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed + p.offset;
      dummy.position.set(
        p.x + Math.sin(t) * 0.2,
        p.y + Math.sin(t * 2) * 0.15,
        p.z + Math.cos(t * 0.7) * 0.15
      );
      dummy.scale.setScalar(p.size);
      dummy.rotation.set(t * 0.3, t * 0.5, t * 0.2);
      dummy.updateMatrix();
      crystalRef.current!.setMatrixAt(i, dummy.matrix);
    });
    crystalRef.current.instanceMatrix.needsUpdate = true;
  });

  // Frost mist — ground-level haze
  const mist = useMemo(() =>
    Array.from({ length: 15 }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: -3 - Math.random() * 4,
      speed: 0.05 + Math.random() * 0.15,
      offset: Math.random() * Math.PI * 2,
      size: 0.15 + Math.random() * 0.2,
    })), []);

  const mistRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state) => {
    if (!mistRef.current) return;
    mist.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed + p.offset;
      dummy.position.set(
        p.x + Math.sin(t) * 0.8,
        0.2 + Math.sin(t * 0.5) * 0.1,
        p.z + Math.cos(t * 0.3) * 0.5
      );
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      mistRef.current!.setMatrixAt(i, dummy.matrix);
    });
    mistRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Snowflakes — white */}
      <instancedMesh ref={snowRef} args={[undefined, undefined, snowflakes.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </instancedMesh>
      {/* Ice crystals — light blue, shiny */}
      <instancedMesh ref={crystalRef} args={[undefined, undefined, crystals.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#aae8ff" emissive="#66ccff" emissiveIntensity={0.5} transparent opacity={0.7} metalness={0.9} roughness={0.1} />
      </instancedMesh>
      {/* Frost mist */}
      <instancedMesh ref={mistRef} args={[undefined, undefined, mist.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#cceeff" transparent opacity={0.08} />
      </instancedMesh>
      {/* Cold blue light */}
      <pointLight position={[0, 2, -5]} color="#88ccff" intensity={2} distance={10} />
      <pointLight position={[-3, 0.5, -4.5]} color="#aaddff" intensity={1} distance={6} />
      <pointLight position={[3, 0.5, -4.5]} color="#66bbff" intensity={1} distance={6} />
    </group>
  );
}

export default function ChessBoard3D({ board, selectedPos, validMoves, onSquareClick, animatingPiece, kingInCheckPos, hintMove }: ChessBoard3DProps) {
  const animFromRow = animatingPiece ? Math.round(animatingPiece.from[2] + 3.5) : -1;
  const animFromCol = animatingPiece ? Math.round(animatingPiece.from[0] + 3.5) : -1;

  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow color="#fff5e6" />
      <directionalLight position={[-3, 6, -3]} intensity={0.4} color="#e0e8ff" />

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
          const isHintFrom = hintMove?.from.row === row && hintMove?.from.col === col;
          const isHintTo = hintMove?.to.row === row && hintMove?.to.col === col;
          
          return (
            <BoardSquare
              key={`${row}-${col}`}
              row={row} col={col}
              isLight={isLight}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isKingInCheck={isKingInCheck}
              isHintFrom={isHintFrom}
              isHintTo={isHintTo}
              onClick={() => onSquareClick(row, col)}
            />
          );
        })
      )}

      {board.map((row, rowIdx) =>
        row.map((piece, colIdx) => {
          if (!piece) return null;
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

      {animatingPiece && (
        <AnimatingPieceComponent anim={animatingPiece} />
      )}

      <RealisticFire />
      <RealisticIceSnow />

      <ContactShadows position={[0, -0.1, 0]} opacity={0.3} scale={14} blur={2.5} color="#333" />
      
      {/* Ground plane for white bg */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} metalness={0} />
      </mesh>
    </>
  );
}
