"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COLORS = [
  "#f43f5e", // red
  "#2456e6", // brand blue
  "#f7961e", // brand orange
  "#ff77aa", // pink
  "#ffffff", // white
  "#22c55e", // green
];
const COUNT = 160;
const SPREAD_X = 9;
const TOP = 7;
const BOTTOM = -7;

interface Piece {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  vRot: number;
  vFall: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  scale: number;
}

function makePiece(randomTop: boolean): Piece {
  return {
    x: (Math.random() - 0.5) * 2 * SPREAD_X,
    y: randomTop ? TOP + Math.random() * 6 : Math.random() * (TOP - BOTTOM) + BOTTOM,
    z: (Math.random() - 0.5) * 5,
    rx: Math.random() * Math.PI * 2,
    ry: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 3.5,
    vFall: 1.1 + Math.random() * 2.1,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 1.2,
    swayAmp: 0.3 + Math.random() * 0.7,
    scale: 0.14 + Math.random() * 0.16,
  };
}

function Pieces() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pieces = useMemo(
    () => Array.from({ length: COUNT }, () => makePiece(false)),
    [],
  );

  // 一度だけ各インスタンスに色を割り当てる
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      color.set(COLORS[i % COLORS.length]);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const p = pieces[i];
      p.y -= p.vFall * dt;
      p.rx += p.vRot * dt;
      p.ry += p.vRot * 0.7 * dt;
      p.rz += p.vRot * 0.4 * dt;
      if (p.y < BOTTOM) Object.assign(p, makePiece(true));
      dummy.position.set(
        p.x + Math.sin(t * p.swaySpeed + p.swayPhase) * p.swayAmp,
        p.y,
        p.z,
      );
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.scale, p.scale * 0.65, p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

export default function ConfettiScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ pointerEvents: "none" }}
    >
      <Pieces />
    </Canvas>
  );
}
