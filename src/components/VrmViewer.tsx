"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";

const MODEL_URL = "/models/Sumisumi_VRM.vrm";

/** 墨澄 VRM をゆっくり回転させて表示するビューア */
export default function VrmViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 1.05, 2.1);
    camera.lookAt(0, 0.85, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(1, 2, 2);
    scene.add(keyLight);

    let vrm: VRM | null = null;
    let disposed = false;
    let frameId = 0;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        const loaded = gltf.userData.vrm as VRM;
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);
        // VRM 0.x は -Z 向きなので正面に補正
        VRMUtils.rotateVRM0(loaded);
        vrm = loaded;
        scene.add(loaded.scene);
        setStatus("ready");
      },
      undefined,
      () => {
        if (!disposed) setStatus("error");
      },
    );

    function resize() {
      if (!container) return;
      const size = Math.min(container.clientWidth, 480);
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    function animate() {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (vrm) {
        vrm.scene.rotation.y += delta * 0.4; // ゆっくり回転
        vrm.update(delta);
      }
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      if (vrm) {
        scene.remove(vrm.scene);
        VRMUtils.deepDispose(vrm.scene);
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-square w-full items-center justify-center"
    >
      {status === "loading" && (
        <p className="absolute animate-pulse text-sm text-stone-400">
          墨澄を読み込み中…
        </p>
      )}
      {status === "error" && (
        <p className="absolute text-sm text-stone-400">
          3D モデルを読み込めませんでした
        </p>
      )}
    </div>
  );
}
