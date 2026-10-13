"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Activity } from "lucide-react";
import type { ModelMetadata } from "./VesselStudyScene";
import type { VesselName, VesselRiskMap } from "@/config/coronaryVesselPaths";

interface VesselStudyCanvasProps {
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

const VesselStudyScene = dynamic(() => import("./VesselStudyScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center text-center p-8 max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 animate-pulse shadow-xs">
          <Activity className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-slate-800 tracking-tight">Initializing 3D Coronary Stage</p>
        <p className="text-xs text-slate-500 mt-1">Mounting WebGL rendering engine...</p>
      </div>
    </div>
  ),
});

export default function VesselStudyCanvas(props: VesselStudyCanvasProps) {
  return <VesselStudyScene {...props} />;
}
