import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PieceType, PieceColor } from '@/utils/chessLogic';
import type { AnimatingPiece } from '@/hooks/useChessGame';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
}

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

// Simplified piece geometry for animation
function AnimPieceGeom({ type, material, scale = 1 }: { type: PieceType; material: THREE.MeshStandardMaterial; scale?: number }) {
  const h = type === 'king' ? 1.1 : type === 'queen' ? 0.95 : type === 'knight' ? 0.9 : type === 'bishop' ? 0.85 : type === 'rook' ? 0.7 : 0.5;
  return (
    <group scale={[scale, scale, scale]}>
      <mesh material={material} castShadow>
        <cylinderGeometry args={[0.12, 0.22, h, 12]} />
      </mesh>
      <mesh material={material} position={[0, h / 2, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
      </mesh>
    </group>
  );
}

// ============ PARTICLE SYSTEMS ============

// Dust cloud particles (knight landing, rook sliding)
function DustParticles({ position, active, color = '#aa8855' }: { position: THREE.Vector3; active: boolean; color?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 2,
      size: 0.03 + Math.random() * 0.06,
      life: 0.5 + Math.random() * 0.5,
    })), []);
  const startTime = useRef(0);

  useFrame((state) => {
    if (!ref.current || !active) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    particles.forEach((p, i) => {
      const t = elapsed / p.life;
      if (t > 1) {
        dummy.scale.setScalar(0.001);
      } else {
        dummy.position.set(
          position.x + p.vx * t,
          position.y + p.vy * t - 2 * t * t,
          position.z + p.vz * t
        );
        dummy.scale.setScalar(p.size * (1 - t));
      }
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 20]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// Magic trail particles (bishop, queen)
function MagicTrail({ positions, color }: { positions: THREE.Vector3[]; color: string }) {
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04 * (1 - i / positions.length), 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.6 * (1 - i / positions.length)} />
        </mesh>
      ))}
    </group>
  );
}

// Capture impact sparks
function CaptureSparkParticles({ position, active, attackerColor }: { position: THREE.Vector3; active: boolean; attackerColor: PieceColor }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sparkColor = attackerColor === 'fire' ? '#ff6600' : '#44ccff';
  const particles = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      vz: (Math.random() - 0.5) * 4,
      size: 0.015 + Math.random() * 0.03,
      life: 0.4 + Math.random() * 0.4,
    })), []);
  const startTime = useRef(0);

  useFrame((state) => {
    if (!ref.current || !active) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    particles.forEach((p, i) => {
      const t = elapsed / p.life;
      if (t > 1) {
        dummy.scale.setScalar(0.001);
      } else {
        dummy.position.set(
          position.x + p.vx * t,
          position.y + p.vy * t - 5 * t * t,
          position.z + p.vz * t
        );
        dummy.scale.setScalar(p.size * (1 - t * 0.8));
      }
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 30]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={sparkColor} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ============ PIECE-SPECIFIC PATH CALCULATORS ============

// Knight: L-shape gallop path
function getKnightPath(from: THREE.Vector3, to: THREE.Vector3, t: number): { pos: THREE.Vector3; rotY: number; scale: number } {
  // Move to the corner of the L first, then to destination
  const midX = to.x; // go to target column first
  const midZ = from.z; // stay on same row
  const mid = new THREE.Vector3(midX, 0.08, midZ);

  let pos: THREE.Vector3;
  let phase: number;

  if (t < 0.5) {
    // First leg: gallop horizontally
    phase = t * 2;
    const eased = easeInOutCubic(phase);
    pos = new THREE.Vector3(
      from.x + (mid.x - from.x) * eased,
      0.08 + Math.abs(Math.sin(phase * Math.PI * 3)) * 0.4, // gallop bounces
      from.z + (mid.z - from.z) * eased
    );
  } else {
    // Second leg: jump vertically with big arc
    phase = (t - 0.5) * 2;
    const eased = easeInOutCubic(phase);
    pos = new THREE.Vector3(
      mid.x + (to.x - mid.x) * eased,
      0.08 + Math.sin(phase * Math.PI) * 1.8, // big jump
      mid.z + (to.z - mid.z) * eased
    );
  }

  // Landing bounce
  if (t > 0.9) {
    const landT = (t - 0.9) / 0.1;
    pos.y = 0.08 + (1 - easeOutBounce(landT)) * 0.3;
  }

  const rotY = t * Math.PI * 3; // spinning during movement
  const scale = 1 + Math.sin(t * Math.PI) * 0.15; // slight grow at peak

  return { pos, rotY, scale };
}

// Rook: Straight heavy slide with rumble
function getRookPath(from: THREE.Vector3, to: THREE.Vector3, t: number): { pos: THREE.Vector3; rotY: number; scale: number } {
  const eased = easeInOutCubic(t);
  const shake = t > 0.1 && t < 0.9 ? Math.sin(t * 60) * 0.02 : 0; // rumble

  const pos = new THREE.Vector3(
    from.x + (to.x - from.x) * eased + shake,
    0.08 + (t > 0.1 && t < 0.9 ? 0.05 : 0), // slight lift while moving
    from.z + (to.z - from.z) * eased
  );

  return { pos, rotY: 0, scale: 1 };
}

// Bishop: Smooth diagonal glide with ascending arc
function getBishopPath(from: THREE.Vector3, to: THREE.Vector3, t: number): { pos: THREE.Vector3; rotY: number; scale: number } {
  const eased = easeInOutCubic(t);

  const pos = new THREE.Vector3(
    from.x + (to.x - from.x) * eased,
    0.08 + Math.sin(t * Math.PI) * 0.8, // float upward in arc
    from.z + (to.z - from.z) * eased
  );

  // Gentle swaying rotation
  const rotY = Math.sin(t * Math.PI * 2) * 0.3;
  const scale = 1 + Math.sin(t * Math.PI) * 0.1;

  return { pos, rotY, scale };
}

// Queen: Royal teleport-glide — rises, glides fast, descends gracefully
function getQueenPath(from: THREE.Vector3, to: THREE.Vector3, t: number): { pos: THREE.Vector3; rotY: number; scale: number } {
  let pos: THREE.Vector3;
  let scale = 1;

  if (t < 0.2) {
    // Rise phase
    const phase = t / 0.2;
    const eased = easeInOutCubic(phase);
    pos = new THREE.Vector3(from.x, 0.08 + eased * 1.2, from.z);
    scale = 1 + eased * 0.2;
  } else if (t < 0.8) {
    // Glide phase — fast horizontal movement at height
    const phase = (t - 0.2) / 0.6;
    const eased = easeInOutCubic(phase);
    pos = new THREE.Vector3(
      from.x + (to.x - from.x) * eased,
      1.28, // stay at peak height
      from.z + (to.z - from.z) * eased
    );
    scale = 1.2;
  } else {
    // Descend phase
    const phase = (t - 0.8) / 0.2;
    const eased = easeInOutCubic(phase);
    pos = new THREE.Vector3(to.x, 1.28 - eased * 1.2, to.z);
    scale = 1.2 - eased * 0.2;
  }

  const rotY = t * Math.PI * 0.5; // slow majestic spin

  return { pos, rotY, scale };
}

// King: Slow regal walk with subtle bob
function getKingPath(from: THREE.Vector3, to: THREE.Vector3, t: number): { pos: THREE.Vector3; rotY: number; scale: number } {
  // Very slow and deliberate
  const eased = easeInOutCubic(t);
  const walkBob = Math.abs(Math.sin(t * Math.PI * 4)) * 0.06; // gentle walking bob

  const pos = new THREE.Vector3(
    from.x + (to.x - from.x) * eased,
    0.08 + walkBob,
    from.z + (to.z - from.z) * eased
  );

  return { pos, rotY: 0, scale: 1 };
}

// Pawn: Soldier march forward
function getPawnPath(from: THREE.Vector3, to: THREE.Vector3, t: number, isCapture: boolean): { pos: THREE.Vector3; rotY: number; scale: number } {
  const eased = easeInOutCubic(t);
  const marchBob = Math.abs(Math.sin(t * Math.PI * 6)) * 0.05;

  let pos: THREE.Vector3;

  if (isCapture) {
    // Aggressive lunge forward and sideways
    pos = new THREE.Vector3(
      from.x + (to.x - from.x) * eased,
      0.08 + marchBob + (t > 0.6 && t < 0.85 ? Math.sin((t - 0.6) / 0.25 * Math.PI) * 0.3 : 0), // lunge arc
      from.z + (to.z - from.z) * eased
    );
  } else {
    pos = new THREE.Vector3(
      from.x + (to.x - from.x) * eased,
      0.08 + marchBob,
      from.z + (to.z - from.z) * eased
    );
  }

  return { pos, rotY: 0, scale: 1 };
}

// Get animation duration per piece type
function getAnimDuration(type: PieceType, isCapture: boolean): number {
  if (isCapture) {
    return type === 'knight' ? 1000 : type === 'queen' ? 900 : type === 'king' ? 1000 : 800;
  }
  switch (type) {
    case 'knight': return 900;
    case 'rook': return 500;
    case 'bishop': return 700;
    case 'queen': return 800;
    case 'king': return 800;
    case 'pawn': return 400;
    default: return 500;
  }
}

// ============ MAIN COMPONENT ============

interface AnimatingPieceComponentProps {
  anim: AnimatingPiece;
}

export default function AnimatingPieceComponent({ anim }: AnimatingPieceComponentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const capturedRef = useRef<THREE.Group>(null);
  const material = useMemo(() => createMaterial(anim.color), [anim.color]);
  const capturedMaterial = useMemo(
    () => anim.capturedColor ? createMaterial(anim.capturedColor) : null,
    [anim.capturedColor]
  );
  const glowColor = anim.color === 'fire' ? '#ff6b1a' : '#4dc9f6';
  const trailColor = anim.color === 'fire' ? '#ff8833' : '#66bbff';

  const duration = getAnimDuration(anim.type, anim.isCapture);
  const fromVec = useMemo(() => new THREE.Vector3(...anim.from), [anim.from]);
  const toVec = useMemo(() => new THREE.Vector3(...anim.to), [anim.to]);

  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([]);
  const [showDust, setShowDust] = useState(false);
  const [dustPos, setDustPos] = useState(new THREE.Vector3());
  const [showCaptureSparks, setShowCaptureSparks] = useState(false);
  const [capturedScale, setCapturedScale] = useState(1);
  const trailTimer = useRef(0);
  const hasLanded = useRef(false);
  const hasCaptured = useRef(false);

  const showTrail = anim.type === 'bishop' || anim.type === 'queen';

  useFrame((state) => {
    if (!groupRef.current) return;
    const elapsed = (Date.now() - anim.startTime) / duration;
    const t = Math.min(elapsed, 1);

    // Get piece-specific path
    let result: { pos: THREE.Vector3; rotY: number; scale: number };

    switch (anim.type) {
      case 'knight':
        result = getKnightPath(fromVec, toVec, t);
        break;
      case 'rook':
        result = getRookPath(fromVec, toVec, t);
        break;
      case 'bishop':
        result = getBishopPath(fromVec, toVec, t);
        break;
      case 'queen':
        result = getQueenPath(fromVec, toVec, t);
        break;
      case 'king':
        result = getKingPath(fromVec, toVec, t);
        break;
      case 'pawn':
        result = getPawnPath(fromVec, toVec, t, anim.isCapture);
        break;
      default:
        result = { pos: fromVec.clone().lerp(toVec, easeInOutCubic(t)), rotY: 0, scale: 1 };
    }

    groupRef.current.position.copy(result.pos);
    groupRef.current.rotation.y = result.rotY;
    groupRef.current.scale.setScalar(result.scale);

    // Trail for bishop/queen
    if (showTrail) {
      trailTimer.current += 1;
      if (trailTimer.current % 3 === 0) {
        setTrailPositions(prev => [result.pos.clone(), ...prev.slice(0, 12)]);
      }
    }

    // Landing dust for knight
    if (anim.type === 'knight' && t > 0.92 && !hasLanded.current) {
      hasLanded.current = true;
      setShowDust(true);
      setDustPos(toVec.clone());
    }

    // Rook dust while moving
    if (anim.type === 'rook' && t > 0.15 && t < 0.85 && !showDust) {
      setShowDust(true);
      setDustPos(result.pos.clone());
    }

    // Capture animation — when attacker reaches ~70% of path
    if (anim.isCapture && t > 0.7 && !hasCaptured.current) {
      hasCaptured.current = true;
      setShowCaptureSparks(true);
    }

    // Captured piece shrink/fly away
    if (capturedRef.current && anim.isCapture) {
      if (t > 0.7) {
        const captureT = Math.min((t - 0.7) / 0.3, 1);
        const cScale = 1 - easeInOutCubic(captureT);
        capturedRef.current.scale.setScalar(Math.max(cScale, 0.01));
        capturedRef.current.position.y = captureT * 2; // fly upward
        capturedRef.current.rotation.x = captureT * Math.PI;
        capturedRef.current.rotation.z = captureT * Math.PI * 0.5;
        setCapturedScale(cScale);
      }
    }
  });

  return (
    <group>
      {/* Main moving piece */}
      <group ref={groupRef} position={anim.from}>
        <AnimPieceGeom type={anim.type} material={material} />
        <pointLight color={glowColor} intensity={2} distance={3} />

        {/* Ground ring glow */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.25, 16]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Knight gets extra fire/ice trail while jumping */}
        {anim.type === 'knight' && (
          <pointLight color={glowColor} intensity={4} distance={2} position={[0, -0.3, 0]} />
        )}

        {/* Queen gets royal aura */}
        {anim.type === 'queen' && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
              <ringGeometry args={[0.2, 0.4, 32]} />
              <meshBasicMaterial color={glowColor} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            <pointLight color={glowColor} intensity={5} distance={4} />
          </>
        )}

        {/* Bishop gets magic glow */}
        {anim.type === 'bishop' && (
          <pointLight color={anim.color === 'fire' ? '#ffaa00' : '#88ddff'} intensity={3} distance={3} />
        )}
      </group>

      {/* Captured piece at destination (visible until knocked away) */}
      {anim.isCapture && anim.capturedType && capturedMaterial && (
        <group ref={capturedRef} position={[anim.to[0], anim.to[1], anim.to[2]]}>
          <AnimPieceGeom type={anim.capturedType} material={capturedMaterial} scale={capturedScale} />
        </group>
      )}

      {/* Magic trail for bishop/queen */}
      {showTrail && trailPositions.length > 0 && (
        <MagicTrail positions={trailPositions} color={trailColor} />
      )}

      {/* Landing dust */}
      <DustParticles position={dustPos} active={showDust} />

      {/* Capture sparks */}
      <CaptureSparkParticles
        position={toVec}
        active={showCaptureSparks}
        attackerColor={anim.color}
      />

      {/* Impact flash light on capture */}
      {showCaptureSparks && (
        <pointLight
          position={[anim.to[0], anim.to[1] + 0.5, anim.to[2]]}
          color={anim.color === 'fire' ? '#ff4400' : '#44aaff'}
          intensity={8}
          distance={5}
        />
      )}
    </group>
  );
}

export { getAnimDuration };
