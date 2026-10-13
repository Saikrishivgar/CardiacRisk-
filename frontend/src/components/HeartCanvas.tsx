"use client";

import dynamic from "next/dynamic";
import { Heart } from "lucide-react";

import type { VesselRiskMap } from "@/config/coronaryVesselPaths";

interface HeartCanvasProps {
  selectedVessel?: string | null;
  hoveredVessel?: string | null;
  vesselRisk?: VesselRiskMap;
  onSelectVessel?: (vessel: string) => void;
  onResetVessel?: () => void;
  onCameraDistanceChange?: (dist: number) => void;
}

// Dynamically import Three.js scene strictly on the client side
const HeartScene = dynamic(() => import("./HeartScene"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full max-w-[700px] xl:max-w-[780px] 2xl:max-w-[840px] h-[580px] sm:h-[620px] lg:h-[68vh] lg:min-h-[580px] lg:max-h-[720px] p-3 sm:p-4 rounded-[42px] sm:rounded-[48px] bg-gradient-to-b from-[#eaedf2] via-[#dfe3ea] to-[#cfd6e2] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.14)] border border-white/80 mx-auto flex items-center justify-center">
      <div className="relative w-full h-full rounded-[32px] sm:rounded-[38px] bg-white flex flex-col items-center justify-center p-8">
        <div className="relative mb-3">
          <Heart className="w-10 h-10 text-rose-500 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-md animate-ping" />
        </div>
        <p className="text-sm font-bold text-slate-800 tracking-tight">Initializing 3D Cardiac Viewport</p>
        <p className="text-[11px] text-slate-500 mt-1">Mounting WebGL renderer...</p>
      </div>
    </div>
  ),
});

export default function HeartCanvas({
  selectedVessel = null,
  hoveredVessel = null,
  vesselRisk,
  onSelectVessel,
  onResetVessel,
  onCameraDistanceChange,
}: HeartCanvasProps) {
  return (
    <HeartScene
      selectedVessel={selectedVessel}
      hoveredVessel={hoveredVessel}
      vesselRisk={vesselRisk}
      onSelectVessel={onSelectVessel}
      onResetVessel={onResetVessel}
      onCameraDistanceChange={onCameraDistanceChange}
    />
  );
}
