"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CORONARY_VESSEL_CONFIGS,
  type VesselName,
  type VesselRiskInfo,
  type VesselRiskMap,
  type CoronaryVesselConfig,
} from "@/config/coronaryVesselPaths";

interface RiskStyle {
  color: string;
  baseEmissive: number;
  opacity: number;
  halo: number;
}

const NEUTRAL_STYLE: RiskStyle = { color: "#94a3b8", baseEmissive: 0.12, opacity: 0.5, halo: 0 };

/** Visualization-only mapping: backend risk level picks colour; probability scales intensity. */
export function getRiskStyle(risk: VesselRiskInfo | null): RiskStyle {
  if (!risk) return NEUTRAL_STYLE;
  const p = Math.min(1, Math.max(0, risk.probability));
  switch (risk.riskLevel) {
    case "HIGH":
      return { color: "#ff1f5a", baseEmissive: 0.9 + 0.7 * p, opacity: 0.9 + 0.08 * p, halo: 0.2 + 0.12 * p };
    case "MODERATE":
      return { color: "#f59e0b", baseEmissive: 0.5 + 0.5 * p, opacity: 0.72 + 0.12 * p, halo: 0.1 + 0.08 * p };
    default:
      return { color: "#22c55e", baseEmissive: 0.18 + 0.3 * p, opacity: 0.5 + 0.12 * p, halo: 0.04 + 0.04 * p };
  }
}

interface SingleVesselSegmentProps {
  config: CoronaryVesselConfig;
  risk: VesselRiskInfo | null;
  isSelected: boolean;
  isHovered: boolean;
  isAnySelected: boolean;
  onSelect?: (name: VesselName) => void;
  onHover?: (name: VesselName | null) => void;
  customConfigs?: boolean;
  hideWhenNoRisk?: boolean;
}

function SingleVesselSegment({
  config,
  risk,
  isSelected,
  isHovered,
  isAnySelected,
  onSelect,
  onHover,
  customConfigs = false,
  hideWhenNoRisk = false,
}: SingleVesselSegmentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Build CatmullRomCurve3 and TubeGeometry from control points (unconditional hook)
  const { tubeGeometry, haloGeometry } = useMemo(() => {
    let points: THREE.Vector3[];
    if (customConfigs) {
      // Custom configs (e.g. Overview) already contain exact surface-normal-offset control points
      points = config.controlPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    } else {
      // Control points lie on the GLB surface; lift them marginally outward (radially from the
      // ventricular centre) so the thin tube hugs the vessel instead of z-fighting with the mesh.
      const heartCentre = new THREE.Vector3(0, -0.45, -0.1);
      points = config.controlPoints.map((p) => {
        const v = new THREE.Vector3(p[0], p[1], p[2]);
        return v.addScaledVector(v.clone().sub(heartCentre).normalize(), 0.008);
      });
    }
    // Tension=0.1 preserves the dense sampled points and eliminates overshooting
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.1);

    // Primary vascular lumen tube - smooth dense subdivision
    const tube = new THREE.TubeGeometry(curve, 128, config.tubeRadius, 10, false);
    // Soft glowing aura halo
    const halo = new THREE.TubeGeometry(curve, 96, config.tubeRadius * 1.6, 8, false);

    return { tubeGeometry: tube, haloGeometry: halo };
  }, [config, customConfigs]);

  // Determine visual state
  const isHighlighted = isSelected || isHovered;
  const isDimmed = isAnySelected && !isHighlighted;
  const style = getRiskStyle(risk);
  const showHalo = isHighlighted || (!isDimmed && style.halo > 0);
  const isHidden = !risk && hideWhenNoRisk;

  // Only material properties change on prediction/selection updates (unconditional hook)
  useFrame(({ clock }) => {
    if (isHidden || !materialRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * 3.8);

    if (isSelected) {
      materialRef.current.emissiveIntensity = style.baseEmissive * 1.5 + 0.5 + pulse * 0.3;
      if (glowMaterialRef.current) {
        glowMaterialRef.current.opacity = Math.min(0.55, style.halo * 2 + 0.15) + pulse * 0.08;
      }
    } else if (isHovered) {
      materialRef.current.emissiveIntensity = style.baseEmissive * 1.25 + 0.2;
      if (glowMaterialRef.current) glowMaterialRef.current.opacity = style.halo * 1.6;
    } else if (isDimmed) {
      materialRef.current.emissiveIntensity = 0.05;
    } else {
      materialRef.current.emissiveIntensity = style.baseEmissive;
      if (glowMaterialRef.current) glowMaterialRef.current.opacity = style.halo;
    }
  });

  if (isHidden) {
    return null;
  }

  return (
    <group>
      {/* Primary Vascular Lumen Tube - thin emissive vascular highlight */}
      <mesh
        ref={meshRef}
        geometry={tubeGeometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(config.name);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(config.name);
        }}
        onPointerOut={() => {
          onHover?.(null);
        }}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={isDimmed ? config.dimmedColor : style.color}
          emissive={isDimmed ? "#000000" : style.color}
          emissiveIntensity={style.baseEmissive}
          roughness={0.15}
          metalness={0.05}
          transparent
          opacity={isDimmed ? 0.12 : isHighlighted ? 0.95 : 0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Volumetric soft glow halo, intensity driven by risk level */}
      {showHalo && (
        <mesh ref={glowMeshRef} geometry={haloGeometry}>
          <meshBasicMaterial
            ref={glowMaterialRef}
            color={style.color}
            transparent
            opacity={style.halo * 0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

export interface CoronaryVesselOverlayProps {
  selectedVessel: VesselName | null;
  hoveredVessel: VesselName | null;
  vesselRisk: VesselRiskMap;
  onSelectVessel?: (name: VesselName) => void;
  onHoverVessel?: (name: VesselName | null) => void;
  configs?: Record<VesselName, CoronaryVesselConfig>;
  hideWhenNoRisk?: boolean;
}

export default function CoronaryVesselOverlay({
  selectedVessel,
  hoveredVessel,
  vesselRisk,
  onSelectVessel,
  onHoverVessel,
  configs,
  hideWhenNoRisk = false,
}: CoronaryVesselOverlayProps) {
  const vesselKeys: VesselName[] = ["LAD", "LCX", "RCA"];
  const isAnySelected = Boolean(selectedVessel);
  const activeConfigs = configs ?? CORONARY_VESSEL_CONFIGS;

  return (
    <group name="semantic-coronary-overlay">
      {vesselKeys.map((key) => {
        const config = activeConfigs[key];
        const isSelected = selectedVessel === key;
        const isHovered = hoveredVessel === key;
        const risk = vesselRisk ? vesselRisk[key] : null;

        if (hideWhenNoRisk && !risk) {
          return null;
        }

        return (
          <SingleVesselSegment
            key={key}
            config={config}
            risk={risk}
            isSelected={isSelected}
            isHovered={isHovered}
            isAnySelected={isAnySelected}
            onSelect={onSelectVessel}
            onHover={onHoverVessel}
            customConfigs={Boolean(configs)}
            hideWhenNoRisk={hideWhenNoRisk}
          />
        );
      })}
    </group>
  );
}
