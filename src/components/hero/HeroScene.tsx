"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type MutableRefObject,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

export interface DragState {
  /** ドラッグ由来の目標回転（ラジアン） */
  x: number;
  y: number;
}

const CONFETTI_COLORS = [
  "#f43f5e",
  "#2456e6",
  "#f7961e",
  "#ff77aa",
  "#ffffff",
  "#22c55e",
];
const CONFETTI_COUNT = 150;
const Z_BACK = -5;
const Z_FRONT = 4;

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

function makePiece(fromTop: boolean): Piece {
  return {
    x: (Math.random() - 0.5) * 18,
    y: fromTop ? 7 + Math.random() * 5 : Math.random() * 16 - 8,
    z: Z_BACK + Math.random() * (Z_FRONT - Z_BACK),
    rx: Math.random() * Math.PI * 2,
    ry: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 3.5,
    vFall: 1.0 + Math.random() * 2.0,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 1.2,
    swayAmp: 0.3 + Math.random() * 0.8,
    scale: 0.16 + Math.random() * 0.2,
  };
}

function Confetti() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pieces = useMemo(
    () => Array.from({ length: CONFETTI_COUNT }, () => makePiece(false)),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const p = pieces[i];
      p.y -= p.vFall * dt;
      p.rx += p.vRot * dt;
      p.ry += p.vRot * 0.7 * dt;
      p.rz += p.vRot * 0.4 * dt;
      if (p.y < -8) Object.assign(p, makePiece(true));
      dummy.position.set(
        p.x + Math.sin(t * p.swaySpeed + p.swayPhase) * p.swayAmp,
        p.y,
        p.z,
      );
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.scale, p.scale * 0.62, p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

/** 紙吹雪に紛れて時々落ちてくる墨澄ピース */
function SumiPieces() {
  const texture = useTexture("/surisurikun.svg");
  texture.colorSpace = THREE.SRGBColorSpace;
  const COUNT = 2;
  const ASPECT = 172 / 103;
  const H = 0.2;
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const pieces = useMemo(
    () => Array.from({ length: COUNT }, () => makePiece(true)),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const p = pieces[i];
      p.y -= p.vFall * 0.7 * dt; // 少しゆっくり
      p.rz += p.vRot * 0.5 * dt;
      if (p.y < -8) Object.assign(p, makePiece(true));
      const m = meshes.current[i];
      if (!m) continue;
      m.position.set(
        p.x + Math.sin(t * p.swaySpeed + p.swayPhase) * p.swayAmp,
        p.y,
        p.z,
      );
      m.rotation.set(0, 0, p.rz);
    }
  });

  return (
    <>
      {pieces.map((_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)}>
          <planeGeometry args={[H * ASPECT, H]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

/** 立ち絵（透過テクスチャの板） */
function Character() {
  const texture = useTexture("/sumusumi-pose.webp");
  const aspect = useMemo(() => {
    const img = texture.image as { width: number; height: number } | undefined;
    return img && img.height ? img.width / img.height : 0.5;
  }, [texture]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const height = 7.2;

  return (
    <mesh position={[0, -0.3, 0]}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

/** 「2周年」の赤いディスプレイ文字（Canvas テクスチャ） */
function AnnivText() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useLayoutEffect(() => {
    let disposed = false;
    const W = 1400;
    const H = 1040;
    const PAD = 70;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const family =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-display")
        .trim() || "sans-serif";

    const draw = () => {
      if (disposed) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(24, 18, 8, 0.22)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#ffffff";

      // 目標サイズで幅を超える場合は縮小して収める
      const fit = (text: string, target: number) => {
        ctx.font = `400 ${target}px ${family}`;
        const w = ctx.measureText(text).width;
        const max = W - PAD * 2;
        return w > max ? Math.floor((target * max) / w) : target;
      };

      // 墨澄
      ctx.font = `400 ${fit("墨澄", 340)}px ${family}`;
      ctx.fillText("墨澄", W / 2, 320);
      // 2周年
      ctx.font = `400 ${fit("2周年", 500)}px ${family}`;
      ctx.fillText("2周年", W / 2, 760);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      setTexture(tex);
    };

    // Dela Gothic One の読み込みを待ってから描画
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      fonts.load(`400 460px ${family}`, "墨澄2周年").then(draw).catch(draw);
    } else {
      draw();
    }
    return () => {
      disposed = true;
    };
  }, []);

  if (!texture) return null;
  const width = 9.5;
  const height = width * (1040 / 1400);
  return (
    <mesh position={[0, 0.4, -3]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/** ドラッグに追従して回転する親グループ（視差） */
function ParallaxGroup({
  drag,
  children,
}: {
  drag: MutableRefObject<DragState>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += (drag.current.y - g.rotation.y) * 0.08;
    g.rotation.x += (drag.current.x - g.rotation.x) * 0.08;
  });
  return <group ref={groupRef}>{children}</group>;
}

function Rig() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function HeroScene({
  drag,
}: {
  drag: MutableRefObject<DragState>;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Rig />
      <ParallaxGroup drag={drag}>
        <AnnivText />
        <Suspense fallback={null}>
          <Character />
        </Suspense>
        <Confetti />
        <Suspense fallback={null}>
          <SumiPieces />
        </Suspense>
      </ParallaxGroup>
    </Canvas>
  );
}
