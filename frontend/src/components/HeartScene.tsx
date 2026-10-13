"use client";

import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF, useProgress, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Heart, RotateCcw, ZoomIn, Info, Eye } from "lucide-react";

import CoronaryVesselOverlay from "./CoronaryVesselOverlay";
import {
  OVERVIEW_CORONARY_VESSEL_CONFIGS,
  type VesselName,
  type VesselRiskMap,
} from "@/config/coronaryVesselPaths";

// Preload the actual GLB model
useGLTF.preload("/models/human_heart.glb");

function ProgressOverlay() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-xs pointer-events-none transition-opacity duration-300 rounded-[34px]">
      <div className="flex flex-col items-center justify-center p-5 bg-white/95 rounded-2xl shadow-xl border border-rose-100 min-w-[220px]">
        <div className="relative mb-2.5">
          <Heart className="w-7 h-7 text-rose-500 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-sm animate-ping" />
        </div>
        <p className="text-xs font-bold text-slate-800 tracking-tight">Loading 3D Cardiac Anatomy</p>
        <p className="text-[10px] text-slate-500 mb-2">Original Human Heart (71 MB)</p>
        <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300 rounded-full"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-slate-600 mt-1">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Camera controller that handles smooth zoom for "Inspect Vessel"
function CameraController({ selectedVessel }: { selectedVessel: string | null }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    // Normal viewing distance = 2.12 (closer, floating forward); Inspect mode distance = 1.78
    const targetDistance = selectedVessel ? 1.78 : 2.12;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetDistance, 4, delta);
  });

  return null;
}

// Tracks camera distance for dynamic protected region scaling around the heart
function CameraDistanceTracker({ onChange }: { onChange?: (dist: number) => void }) {
  const { camera } = useThree();
  const lastDistRef = useRef(camera.position.length());

  useFrame(() => {
    const currentDist = camera.position.length();
    if (Math.abs(currentDist - lastDistRef.current) > 0.015) {
      lastDistRef.current = currentDist;
      onChange?.(currentDist);
    }
  });

  return null;
}

interface HeartModelProps {
  isInteractingRef: React.MutableRefObject<boolean>;
  selectedVessel: string | null;
  hoveredVessel: string | null;
  vesselRisk?: VesselRiskMap;
  onSelectVessel?: (vessel: string) => void;
  onHoverVessel?: (vessel: string | null) => void;
}

function HeartModel({
  isInteractingRef,
  selectedVessel,
  hoveredVessel,
  vesselRisk,
  onSelectVessel,
  onHoverVessel,
}: HeartModelProps) {
  const { scene } = useGLTF("/models/human_heart.glb");
  const heartRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef<number>(0);

  // Material tuning for crisp anatomical depth and organic sheen
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = Math.max(0.32, Math.min(0.56, mat.roughness ?? 0.46));
          mat.metalness = Math.min(0.08, mat.metalness ?? 0.04);
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (!heartRef.current) return;
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    // =========================================================================
    // 1. CINEMATIC ENTRANCE SEQUENCE (0s to 1.8s)
    // =========================================================================
    let entranceScaleMult = 1;
    let entranceRotY = 0;
    let entranceRotX = 0;

    if (t < 0.9) {
      // 0ms to 900ms: Scale 0.65 -> 1.08 -> settling toward 1.0
      const progress = Math.min(1, t / 0.9);
      entranceScaleMult = THREE.MathUtils.lerp(0.65, 1.08, Math.sin(progress * Math.PI * 0.5));
      // Initial smooth 3D rotation: front -> slight left -> slight right
      entranceRotY = Math.sin(progress * Math.PI * 2) * 0.08;
    } else if (t < 1.1) {
      // 900ms to 1100ms: Settles to 1.0; heart subtly tilts toward CAD (top-left)
      const p = (t - 0.9) / 0.2;
      entranceScaleMult = THREE.MathUtils.lerp(1.08, 1.0, p);
      entranceRotY = -0.06 * Math.sin(p * Math.PI);
      entranceRotX = -0.02 * Math.sin(p * Math.PI);
    } else if (t < 1.3) {
      // 1100ms to 1300ms: Heart subtly tilts toward LAD (top-right)
      const p = (t - 1.1) / 0.2;
      entranceRotY = 0.06 * Math.sin(p * Math.PI);
      entranceRotX = -0.02 * Math.sin(p * Math.PI);
    } else if (t < 1.5) {
      // 1300ms to 1500ms: Heart subtly tilts toward LCX (bottom-left)
      const p = (t - 1.3) / 0.2;
      entranceRotY = -0.05 * Math.sin(p * Math.PI);
      entranceRotX = 0.02 * Math.sin(p * Math.PI);
    } else if (t < 1.7) {
      // 1500ms to 1700ms: Heart subtly tilts toward RCA (bottom-right)
      const p = (t - 1.5) / 0.2;
      entranceRotY = 0.05 * Math.sin(p * Math.PI);
      entranceRotX = 0.02 * Math.sin(p * Math.PI);
    }

    // =========================================================================
    // 2. CONTINUOUS SUBTLE HEARTBEAT (Active from t > 1.4s)
    // =========================================================================
    let pulse = 0;
    if (t > 1.4) {
      // Resting heart cycle: 68-70 bpm (~0.88s period)
      // Gentle anatomical sequence: 1.000 -> 1.015 (systole) -> 1.000 -> 1.009 (atrial) -> 1.000
      const cycle = ((t - 1.4) / 0.88) % 1.0;
      if (cycle < 0.16) {
        pulse = Math.sin((cycle / 0.16) * Math.PI) * 0.015;
      } else if (cycle >= 0.20 && cycle < 0.32) {
        pulse = Math.sin(((cycle - 0.20) / 0.12) * Math.PI) * 0.009;
      }
    }

    // Apply scale: enlarged calibrated scale (1.28, ~16% larger) * entrance multiplier * heartbeat pulse
    const baseScale = 1.28;
    const finalScale = baseScale * entranceScaleMult * (1 + pulse);
    heartRef.current.scale.set(finalScale, finalScale, finalScale);

    // =========================================================================
    // 3. SLOW IDLE ROTATION (-4° to +4° over 15-second ease-in-out cycle)
    // =========================================================================
    let idleAngleY = 0;
    if (t > 1.8 && !isInteractingRef.current) {
      // Gentle oscillation between -4° and +4°
      const fourDegreesRad = (4 * Math.PI) / 180;
      idleAngleY = Math.sin((t - 1.8) * ((Math.PI * 2) / 15)) * fourDegreesRad;
    }

    // =========================================================================
    // 4. CARD HOVER / INSPECT REACTION (Tilts 2-4° toward hovered vessel)
    // =========================================================================
    let hoverTargetY = 0;
    let hoverTargetX = 0;

    const activeTarget = selectedVessel || hoveredVessel;
    if (activeTarget === "CAD") {
      hoverTargetY = -0.06;
      hoverTargetX = -0.025;
    } else if (activeTarget === "LAD") {
      hoverTargetY = 0.06;
      hoverTargetX = -0.025;
    } else if (activeTarget === "LCX") {
      hoverTargetY = -0.06;
      hoverTargetX = 0.025;
    } else if (activeTarget === "RCA") {
      hoverTargetY = 0.06;
      hoverTargetX = 0.025;
    }

    // Target rotation combining entrance, idle oscillation, and hover tilt
    const targetRotY = entranceRotY + idleAngleY + hoverTargetY;
    const targetRotX = entranceRotX + hoverTargetX;

    heartRef.current.rotation.y = THREE.MathUtils.damp(
      heartRef.current.rotation.y,
      targetRotY,
      6,
      delta
    );
    heartRef.current.rotation.x = THREE.MathUtils.damp(
      heartRef.current.rotation.x,
      targetRotX,
      6,
      delta
    );

    // Gentle floating bob elevated slightly (+0.02) to give apex room above bottom dock
    const floatY = Math.sin(t * 0.85) * 0.010;
    heartRef.current.position.y = floatY - pulse * 0.015 + 0.02;
  });

  return (
    <group dispose={null}>
      <Center>
        <group ref={heartRef}>
          <primitive object={scene} />
          {/* Anatomical coronary vessel highlights attached directly to the heart */}
          <CoronaryVesselOverlay
            selectedVessel={selectedVessel as VesselName | null}
            hoveredVessel={hoveredVessel as VesselName | null}
            vesselRisk={vesselRisk ?? null}
            configs={OVERVIEW_CORONARY_VESSEL_CONFIGS}
            hideWhenNoRisk={true}
            onSelectVessel={(name) => onSelectVessel?.(name)}
            onHoverVessel={(name) => onHoverVessel?.(name)}
          />
        </group>
      </Center>
    </group>
  );
}

class HeartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white/90 rounded-3xl border border-rose-200">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-2 text-rose-600">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            3D Viewport Notice
          </h3>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            {this.state.error || "WebGL rendering issue detected."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-xl hover:bg-rose-700 transition"
          >
            Retry Viewport
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface HeartSceneProps {
  selectedVessel?: string | null;
  hoveredVessel?: string | null;
  vesselRisk?: VesselRiskMap;
  onSelectVessel?: (vessel: string) => void;
  onHoverVessel?: (vessel: string | null) => void;
  onResetVessel?: () => void;
  onCameraDistanceChange?: (dist: number) => void;
}

export default function HeartScene({
  selectedVessel = null,
  hoveredVessel = null,
  vesselRisk,
  onSelectVessel,
  onHoverVessel,
  onResetVessel,
  onCameraDistanceChange,
}: HeartSceneProps) {
  const controlsRef = useRef<any>(null);
  const isInteractingRef = useRef<boolean>(false);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleControlStart = () => {
    isInteractingRef.current = true;
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }
  };

  const handleControlEnd = () => {
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }
    inactivityTimeout.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  };

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (onResetVessel) {
      onResetVessel();
    }
    if (onCameraDistanceChange) {
      onCameraDistanceChange(2.12);
    }
  };

  return (
    /* Outer Metallic/Glass Beveled Frame: 42-48vw, 65-72vh on desktop */
    <div className="relative w-full max-w-[700px] xl:max-w-[780px] 2xl:max-w-[840px] h-[580px] sm:h-[620px] lg:h-[68vh] lg:min-h-[580px] lg:max-h-[720px] p-3 sm:p-4 rounded-[42px] sm:rounded-[48px] bg-gradient-to-b from-[#eaedf2] via-[#dfe3ea] to-[#cfd6e2] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.14),0_12px_30px_-8px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] border border-white/80 mx-auto flex items-center justify-center">
      {/* Inner Recessed Display Surface */}
      <div className="relative w-full h-full rounded-[32px] sm:rounded-[38px] bg-gradient-to-b from-[#ffffff] via-[#fafbfd] to-[#f4f6fa] shadow-[inset_0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center border border-slate-100/70">
        
        {/* Soft atmospheric warm rose ambient halo & subtle heart back-glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[420px] sm:w-[520px] h-[420px] sm:h-[520px] rounded-full bg-gradient-to-tr from-rose-200/25 via-pink-100/18 to-transparent blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
          <div className="absolute w-[240px] sm:w-[300px] h-[240px] sm:h-[300px] rounded-full bg-rose-400/12 blur-2xl" />
        </div>

        {/* Progress Loading Overlay */}
        <ProgressOverlay />

        {/* Top-Left Status Pill */}
        <div className="absolute top-4 left-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-slate-200/70 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 tracking-tight">
            {selectedVessel
              ? `Inspect Focus: ${selectedVessel}`
              : hoveredVessel
              ? `Orienting toward: ${hoveredVessel}`
              : "Complete 3D Cardiac Anatomy"}
          </span>
        </div>

        {/* Top-Right Reset Control */}
        <div className="absolute top-4 right-5 z-20">
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 rounded-full text-xs font-semibold border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_10px_rgba(244,63,94,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-xs transition-all cursor-pointer"
            title="Reset 3D camera orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Interaction Guide Hint above Dock */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-white/85 backdrop-blur-md rounded-full border border-slate-200/70 shadow-xs flex items-center gap-2 text-[11px] text-slate-500 pointer-events-none select-none">
          <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
          <span>Drag to rotate • Scroll to zoom (bounded)</span>
        </div>

        {/* Sculpted Bottom Dock Notch */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-6 py-2 bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-md rounded-t-2xl border-t border-x border-slate-200/80 shadow-[0_-3px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Complete 3D Cardiac Anatomy</span>
          </div>

          <button
            onClick={resetView}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 rounded-full text-xs font-bold border border-slate-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* 3D Canvas */}
        <HeartErrorBoundary>
          <Canvas
            camera={{ position: [0, 0.02, 2.12], fov: 38 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08,
              preserveDrawingBuffer: true,
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Smooth Camera Zoom Controller */}
            <CameraController selectedVessel={selectedVessel} />

            {/* Dynamic Camera Zoom Reporter for Protected Safe Zone */}
            <CameraDistanceTracker onChange={onCameraDistanceChange} />

            {/* 5-Point Medical Lighting */}
            <ambientLight intensity={0.92} color="#ffffff" />
            <directionalLight position={[3.2, 4.5, 4.0]} intensity={1.95} color="#fffbf7" />
            <directionalLight position={[-3.5, 2.0, -1.8]} intensity={1.05} color="#fce7f3" />
            <directionalLight position={[0, -2.5, -3.5]} intensity={0.85} color="#ffe4e6" />
            <pointLight position={[0, 0.4, 2.3]} intensity={0.85} color="#ffffff" />

            <Suspense fallback={null}>
              <HeartModel
                isInteractingRef={isInteractingRef}
                selectedVessel={selectedVessel}
                hoveredVessel={hoveredVessel}
                vesselRisk={vesselRisk}
                onSelectVessel={onSelectVessel}
                onHoverVessel={onHoverVessel}
              />
              <ContactShadows
                position={[0, -0.66, 0]}
                opacity={0.46}
                scale={2.9}
                blur={1.8}
                far={1.8}
                color="#1e293b"
              />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.06}
              minDistance={1.60}
              maxDistance={3.0}
              rotateSpeed={0.8}
              onStart={handleControlStart}
              onEnd={handleControlEnd}
            />
          </Canvas>
        </HeartErrorBoundary>
      </div>
    </div>
  );
}
