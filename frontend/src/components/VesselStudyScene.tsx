"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Activity } from "lucide-react";
import CoronaryVesselOverlay from "./CoronaryVesselOverlay";
import {
  CORONARY_VESSEL_CONFIGS,
  DEFAULT_CAMERA_FRAMING,
  type VesselName,
  type VesselRiskMap,
} from "@/config/coronaryVesselPaths";

export interface MeshDetailInfo {
  index: number;
  name: string;
  nodeName: string;
  vertexCount: number;
  triangleCount: number;
  boxDimensions: { x: number; y: number; z: number };
  boxCenter: { x: number; y: number; z: number };
}

export interface ModelMetadata {
  totalNodes: number;
  totalMeshes: number;
  totalMaterials: number;
  totalTriangles: number;
  meshes: MeshDetailInfo[];
}

interface VesselStudyModelProps {
  selectedVessel: VesselName | null;
  selectedMeshName: string | null;
  onModelLoaded?: (meta: ModelMetadata) => void;
  onSelectMesh?: (name: string | null) => void;
}

function VesselStudyModel({
  selectedVessel,
  selectedMeshName,
  onModelLoaded,
  onSelectMesh,
}: VesselStudyModelProps) {
  // Load ONLY ONCE on the Vessel Study page as the detailed anatomical background
  const { scene: gltfScene } = useGLTF("/models/3d_digital_model_of_coronary_arteries.glb");
  const hasReportedRef = useRef<boolean>(false);
  const meshesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Normalize model scale and center precisely at origin
  useEffect(() => {
    if (!gltfScene) return;

    gltfScene.position.set(0, 0, 0);
    gltfScene.scale.set(1, 1, 1);
    gltfScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(gltfScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Normalize size so maximum dimension is 2.4 units (consistent 70% viewport framing)
    const s = 2.4 / (maxDim || 1);
    gltfScene.scale.set(s, s, s);
    gltfScene.position.set(-center.x * s, -center.y * s, -center.z * s);
    gltfScene.updateMatrixWorld(true);

    const meshes: MeshDetailInfo[] = [];
    let totalTriangles = 0;
    const materialsFound = new Set<string>();

    meshesMapRef.current.clear();

    const meshChildren: THREE.Mesh[] = [];
    gltfScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshChildren.push(child as THREE.Mesh);
      }
    });

    meshChildren.forEach((mesh, index) => {
      const geom = mesh.geometry;
      const vertexCount = geom.attributes.position ? geom.attributes.position.count : 0;
      const triangleCount = geom.index ? geom.index.count / 3 : vertexCount / 3;
      const semanticMeshName = `Object_${index}`;
      const nodeName = mesh.name && mesh.name.startsWith("Object_") ? mesh.name : `Object_${index + 2}`;

      mesh.userData.meshName = semanticMeshName;
      mesh.userData.nodeName = nodeName;
      totalTriangles += Math.round(triangleCount);

      meshesMapRef.current.set(semanticMeshName, mesh);

      mesh.updateMatrixWorld(true);
      const mBox = new THREE.Box3().setFromObject(mesh);
      const mCenter = mBox.getCenter(new THREE.Vector3());
      const mSize = mBox.getSize(new THREE.Vector3());

      meshes.push({
        index,
        name: semanticMeshName,
        nodeName,
        vertexCount,
        triangleCount: Math.round(triangleCount),
        boxDimensions: {
          x: Number(mSize.x.toFixed(3)),
          y: Number(mSize.y.toFixed(3)),
          z: Number(mSize.z.toFixed(3)),
        },
        boxCenter: {
          x: Number(mCenter.x.toFixed(3)),
          y: Number(mCenter.y.toFixed(3)),
          z: Number(mCenter.z.toFixed(3)),
        },
      });

      // Optimize anatomical material for clarity under clinical lighting
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        materialsFound.add(mat.name || "default");
        mat.side = THREE.DoubleSide;
        mat.roughness = 0.52;
        mat.metalness = 0.08;
        mat.transparent = true;
        mat.opacity = 0.95;
        mat.needsUpdate = true;
      }
    });

    if (!hasReportedRef.current && onModelLoaded) {
      hasReportedRef.current = true;
      onModelLoaded({
        totalNodes: 30,
        totalMeshes: meshes.length,
        totalMaterials: materialsFound.size,
        totalTriangles,
        meshes,
      });
    }
  }, [gltfScene, onModelLoaded]);

  // When a vessel is focused, subtly soften background opacity so the semantic overlay pops
  useEffect(() => {
    if (!gltfScene) return;
    gltfScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = selectedVessel ? 0.78 : 0.95;
      }
    });
  }, [selectedVessel, gltfScene]);

  return (
    <primitive
      object={gltfScene}
      onPointerDown={(e: any) => {
        if (onSelectMesh && e.object && (e.object as THREE.Mesh).isMesh) {
          e.stopPropagation();
          onSelectMesh(e.object.userData.meshName || e.object.name);
        }
      }}
    />
  );
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  const isComplete = !active && progress >= 100;

  let statusText = "Downloading volumetric coronary tree...";
  if (progress > 35 && progress <= 75) {
    statusText = "Parsing vascular mesh geometries...";
  } else if (progress > 75 && progress < 100) {
    statusText = "Compiling PBR materials & textures...";
  } else if (progress >= 100) {
    statusText = "Mounting semantic coronary layers...";
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/95 backdrop-blur-md transition-opacity duration-700 ${
        isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-[0_4px_20px_rgba(244,63,94,0.15)]">
            <Activity className="w-8 h-8 animate-pulse text-rose-500" />
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-rose-500/20 blur-md animate-ping pointer-events-none" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Loading Vessel Study...
        </h2>
        <p className="text-xs text-rose-600 font-medium mt-1">
          Coronary Anatomy &amp; Semantic Vessel Layers
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          High-Resolution Vascular Scan (~92 MB)
        </p>

        <div className="w-64 h-2 bg-slate-100 rounded-full mt-5 overflow-hidden border border-slate-200 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-rose-600 to-red-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
            style={{ width: `${Math.max(8, Math.round(progress))}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-64 mt-2 text-[11px] font-mono">
          <span className="text-slate-500">{statusText}</span>
          <span className="text-rose-600 font-bold">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

// Camera controller with smooth interpolation to vessel focus targets
function CameraVesselController({
  selectedVessel,
  focusTrigger,
  resetTrigger,
  isInteractingRef,
  controlsRef,
}: {
  selectedVessel: VesselName | null;
  focusTrigger: number;
  resetTrigger?: number;
  isInteractingRef: React.MutableRefObject<boolean>;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // When resetTrigger fires, immediately re-center framing and unlock interactions
  useEffect(() => {
    if (!resetTrigger) return;
    isInteractingRef.current = false;
    if (controlsRef.current) {
      controlsRef.current.target.set(...DEFAULT_CAMERA_FRAMING.target);
      controlsRef.current.update();
    }
    targetPosRef.current = new THREE.Vector3(...DEFAULT_CAMERA_FRAMING.position);
    targetLookAtRef.current = new THREE.Vector3(...DEFAULT_CAMERA_FRAMING.target);
  }, [resetTrigger, controlsRef, isInteractingRef]);

  // When vessel selection changes or focusTrigger triggers, compute smooth interpolation targets
  useEffect(() => {
    if (!controlsRef.current) return;

    if (selectedVessel) {
      const config = CORONARY_VESSEL_CONFIGS[selectedVessel];
      targetPosRef.current = new THREE.Vector3(...config.cameraFocus.position);
      targetLookAtRef.current = new THREE.Vector3(...config.cameraFocus.target);
    } else {
      targetPosRef.current = new THREE.Vector3(...DEFAULT_CAMERA_FRAMING.position);
      targetLookAtRef.current = new THREE.Vector3(...DEFAULT_CAMERA_FRAMING.target);
    }
  }, [selectedVessel, focusTrigger, controlsRef]);

  useFrame(() => {
    if (!controlsRef.current || !targetPosRef.current || !targetLookAtRef.current) return;

    // Do not fight active manual user drag/pinch
    if (isInteractingRef.current) {
      targetPosRef.current = null;
      targetLookAtRef.current = null;
      return;
    }

    // Smooth exponential lerp
    camera.position.lerp(targetPosRef.current, 0.08);
    controlsRef.current.target.lerp(targetLookAtRef.current, 0.08);
    controlsRef.current.update();

    const posDist = camera.position.distanceTo(targetPosRef.current);
    const lookDist = controlsRef.current.target.distanceTo(targetLookAtRef.current);

    if (posDist < 0.008 && lookDist < 0.008) {
      targetPosRef.current = null;
      targetLookAtRef.current = null;
    }
  });

  return null;
}

export interface VesselStudySceneProps {
  selectedVessel: VesselName | null;
  hoveredVessel: VesselName | null;
  vesselRisk: VesselRiskMap;
  selectedMeshName: string | null;
  focusTrigger: number;
  resetTrigger?: number;
  onSelectVessel: (name: VesselName) => void;
  onHoverVessel: (name: VesselName | null) => void;
  onSelectMesh?: (name: string | null) => void;
  onModelMetadata?: (meta: ModelMetadata) => void;
  onResetView?: () => void;
}

export default function VesselStudyScene({
  selectedVessel,
  hoveredVessel,
  vesselRisk,
  selectedMeshName,
  focusTrigger,
  resetTrigger,
  onSelectVessel,
  onHoverVessel,
  onSelectMesh,
  onModelMetadata,
  onResetView,
}: VesselStudySceneProps) {
  const controlsRef = useRef<any>(null);
  const isInteractingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    isInteractingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleEnd = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2000);
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading Overlay */}
      <LoadingOverlay />

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: DEFAULT_CAMERA_FRAMING.position, fov: 42 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.45,
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Clinical Vascular Lighting */}
        <ambientLight intensity={1.25} color="#ffffff" />
        <directionalLight position={[4, 6, 5]} intensity={2.6} color="#ffffff" />
        <directionalLight position={[-4, 3, -2]} intensity={1.8} color="#fed7aa" />
        <directionalLight position={[0, -4, 4]} intensity={1.6} color="#ffe4e6" />
        <pointLight position={[0, 0.5, 3.5]} intensity={1.5} color="#ffffff" />

        <group>
          {/* Layer 1: Detailed 92 MB Coronary GLB (Loaded ONCE as Anatomical Background) */}
          <VesselStudyModel
            selectedVessel={selectedVessel}
            selectedMeshName={selectedMeshName}
            onModelLoaded={onModelMetadata}
            onSelectMesh={onSelectMesh}
          />

          {/* Layer 2: Semantic Coronary Vessel Overlay (LAD, LCX, RCA) */}
          <CoronaryVesselOverlay
            selectedVessel={selectedVessel}
            hoveredVessel={hoveredVessel}
            vesselRisk={vesselRisk}
            onSelectVessel={onSelectVessel}
            onHoverVessel={onHoverVessel}
          />
        </group>

        {/* Smooth Camera Motion Controller */}
        <CameraVesselController
          selectedVessel={selectedVessel}
          focusTrigger={focusTrigger}
          resetTrigger={resetTrigger}
          isInteractingRef={isInteractingRef}
          controlsRef={controlsRef}
        />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.8}
          zoomSpeed={0.9}
          panSpeed={0.8}
          minDistance={0.5}
          maxDistance={8.0}
          enablePan
          onStart={handleStart}
          onEnd={handleEnd}
        />
      </Canvas>
    </div>
  );
}
