"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Move3d,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Heart,
  GitBranch,
  Sliders,
  Info,
} from "lucide-react";
import VesselStudyCanvas from "@/components/VesselStudyCanvas";
import {
  CORONARY_VESSEL_CONFIGS,
  type VesselName,
} from "@/config/coronaryVesselPaths";
import type { ModelMetadata } from "@/components/VesselStudyScene";
import { getRiskStyle } from "@/components/CoronaryVesselOverlay";
import { useSharedPrediction } from "@/utils/predictionStore";
import type { VesselRiskMap, VesselRiskInfo, RiskLevel } from "@/config/coronaryVesselPaths";

const RISK_TEXT: Record<RiskLevel, string> = {
  HIGH: "text-rose-700 bg-rose-50 border-rose-200",
  MODERATE: "text-amber-700 bg-amber-50 border-amber-200",
  LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

function RiskBadge({ risk }: { risk: VesselRiskInfo }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${RISK_TEXT[risk.riskLevel]}`}>
      {risk.riskLevel}
    </span>
  );
}

const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

function VesselChipInfo({ risk }: { risk: VesselRiskInfo | null }) {
  if (!risk) {
    return <span className="mt-1 text-[9px] font-mono text-slate-400">Awaiting</span>;
  }
  return (
    <span className="mt-1 flex flex-col items-center gap-0.5">
      <span className="text-[11px] font-bold font-mono text-slate-800">{fmtPct(risk.probability)}</span>
      <RiskBadge risk={risk} />
    </span>
  );
}

export default function VesselStudyPage() {
  const prediction = useSharedPrediction();
  // Real backend LAD/LCX/RCA predictions (CAD intentionally NOT used for vessel colouring)
  const vesselRisk: VesselRiskMap = useMemo(
    () =>
      prediction
        ? {
            LAD: { probability: prediction.predictions.LAD, riskLevel: prediction.risk_levels.LAD },
            LCX: { probability: prediction.predictions.LCX, riskLevel: prediction.risk_levels.LCX },
            RCA: { probability: prediction.predictions.RCA, riskLevel: prediction.risk_levels.RCA },
          }
        : null,
    [prediction]
  );
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<VesselName | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<VesselName | null>(null);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState<boolean>(false);
  const [selectedMeshDiagnostic, setSelectedMeshDiagnostic] = useState<string | null>(null);

  // Proactively purge old experimental manual object mappings if present in localStorage
  useEffect(() => {
    try {
      localStorage.removeItem("cardiac_vessel_study_anatomy_mapping");
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelectVessel = (name: VesselName) => {
    if (selectedVessel === name) {
      // Trigger camera refocus if already selected
      setFocusTrigger((prev) => prev + 1);
    } else {
      setSelectedVessel(name);
      setFocusTrigger((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setSelectedVessel(null);
    setHoveredVessel(null);
    setSelectedMeshDiagnostic(null);
    setResetTrigger((prev) => prev + 1);
    setFocusTrigger((prev) => prev + 1);
  };

  const activeConfig = selectedVessel ? CORONARY_VESSEL_CONFIGS[selectedVessel] : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 select-none">
      {/* Subtle soft medical ambient background gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-50/40 via-[#F8FAFC] to-[#F1F5F9]" />

      {/* 3D Coronary Artery Stage: Detailed GLB Background + Semantic Overlay */}
      <div className="absolute inset-0 z-0">
        <VesselStudyCanvas
          selectedVessel={selectedVessel}
          hoveredVessel={hoveredVessel}
          vesselRisk={vesselRisk}
          selectedMeshName={selectedMeshDiagnostic}
          focusTrigger={focusTrigger}
          resetTrigger={resetTrigger}
          onSelectVessel={handleSelectVessel}
          onHoverVessel={setHoveredVessel}
          onSelectMesh={setSelectedMeshDiagnostic}
          onModelMetadata={setModelMeta}
          onResetView={handleReset}
        />
      </div>

      {/* =================================================================== */}
      {/* TOP NAVIGATION / HEADER                                             */}
      {/* =================================================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none">
        {/* Top-Left: Back to Overview */}
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 bg-white/95 hover:bg-white backdrop-blur-md rounded-full border border-slate-200/90 hover:border-rose-300 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Overview</span>
          </Link>
        </div>

        {/* Top-Center: Clinical Decision Support Interface Badge */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wide">
            3D CORONARY ARTERY STUDY • SEMANTIC VASCULAR OVERLAY
          </span>
        </div>

        {/* Top-Right: Header Title & Controls (Cleanly Aligned, No Collisions) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Reset View Button */}
          <button
            onClick={handleReset}
            className="group flex items-center gap-1.5 px-3.5 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-rose-600 rounded-full text-xs font-semibold border border-slate-200/90 hover:border-rose-300 backdrop-blur-md shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
            title="Reset 3D camera orientation and selection"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500 group-hover:-rotate-45 transition-transform" />
            <span className="hidden sm:inline">Reset View</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

          {/* Title & Badge */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Vessel Study
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                Coronary Tree
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
              Multi-Vessel Risk Navigation
            </p>
          </div>

          {/* Activity Pulse Icon */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-[0_4px_14px_rgba(244,63,94,0.25)] shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* BOTTOM-CENTER: HUD Controls Guide                                   */}
      {/* =================================================================== */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-md text-slate-700 text-xs font-medium">
          <Move3d className="w-3.5 h-3.5 text-rose-500" />
          <span>Left-Drag: Rotate • Right-Drag: Pan • Scroll: Zoom • Click Vessel Tube: Select &amp; Focus</span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SIDEBAR: CORONARY VESSEL NAVIGATION & CLINICAL PANEL                */}
      {/* =================================================================== */}
      <aside className="absolute top-20 left-6 bottom-6 z-30 pointer-events-auto w-[400px] flex flex-col">
        <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Coronary Vessels
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    3 ARTERIES
                  </span>
                </h2>
                <p className="text-[10px] text-slate-500">
                  LAD • LCX • RCA Navigation &amp; Risk Focus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedVessel && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[10px] font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
                  title="Deselect active vessel"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Deselect</span>
                </button>
              )}

              {/* Concise Medical Safety Info Icon & Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowSafetyInfo((prev) => !prev)}
                  onMouseEnter={() => setShowSafetyInfo(true)}
                  onMouseLeave={() => setShowSafetyInfo(false)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-rose-600 flex items-center justify-center border border-slate-200 transition cursor-pointer"
                  title="Medical safety information"
                  aria-label="Medical safety information"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {showSafetyInfo && (
                  <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-50 text-[11px] leading-relaxed text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-1 text-xs">
                      <Info className="w-3.5 h-3.5 text-rose-500" />
                      <span>Clinical Notice</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px]">
                      For research and educational use only. Model predictions support risk assessment and are not a substitute for professional medical evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto">
            {/* 1. Main Vessel Selector Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Select Coronary Artery</span>
                <span className="text-[9px] font-mono text-slate-400">Click to focus camera</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* LAD Button */}
                <button
                  onClick={() => handleSelectVessel("LAD")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedVessel === "LAD"
                      ? "bg-rose-50/80 border-rose-400 text-slate-900 shadow-[0_4px_16px_rgba(244,63,94,0.18)] ring-2 ring-rose-200"
                      : "bg-slate-50/70 hover:bg-rose-50/40 border-slate-200 text-slate-700 hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                    <span className="text-xs font-bold font-mono">LAD</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium leading-tight">
                    Left Anterior
                  </span>
                  <VesselChipInfo risk={vesselRisk?.LAD ?? null} />
                </button>

                {/* LCX Button */}
                <button
                  onClick={() => handleSelectVessel("LCX")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedVessel === "LCX"
                      ? "bg-rose-50/80 border-rose-400 text-slate-900 shadow-[0_4px_16px_rgba(244,63,94,0.18)] ring-2 ring-rose-200"
                      : "bg-slate-50/70 hover:bg-rose-50/40 border-slate-200 text-slate-700 hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                    <span className="text-xs font-bold font-mono">LCX</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium leading-tight">
                    Circumflex
                  </span>
                  <VesselChipInfo risk={vesselRisk?.LCX ?? null} />
                </button>

                {/* RCA Button */}
                <button
                  onClick={() => handleSelectVessel("RCA")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedVessel === "RCA"
                      ? "bg-rose-50/80 border-rose-400 text-slate-900 shadow-[0_4px_16px_rgba(244,63,94,0.18)] ring-2 ring-rose-200"
                      : "bg-slate-50/70 hover:bg-rose-50/40 border-slate-200 text-slate-700 hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <span className="text-xs font-bold font-mono">RCA</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium leading-tight">
                    Right Coronary
                  </span>
                  <VesselChipInfo risk={vesselRisk?.RCA ?? null} />
                </button>
              </div>
              {!vesselRisk && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-[10px] font-mono text-slate-500">
                  Awaiting Patient Analysis
                </div>
              )}
            </div>

            {/* 2. Selected Vessel Clinical Details Card or Empty State */}
            {activeConfig ? (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        selectedVessel === "LAD"
                          ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          : selectedVessel === "LCX"
                          ? "bg-orange-500 shadow-[0_0_8px_#f97316]"
                          : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                      }`}
                    />
                    <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">
                      {activeConfig.name} — {activeConfig.fullName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Active Focus
                  </span>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Anatomical Trajectory
                    </span>
                    <p className="text-slate-800 leading-relaxed">{activeConfig.anatomicalDescription}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Myocardial Perfusion Territory
                    </span>
                    <p className="text-slate-700 leading-relaxed">{activeConfig.perfusionTerritory}</p>
                  </div>
                </div>

                {/* Real ML prediction for this vessel */}
                <div className="pt-2 border-t border-slate-200">
                  {selectedVessel && vesselRisk ? (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Predicted Stenosis Probability
                      </span>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-2xl font-extrabold font-mono"
                          style={{ color: getRiskStyle(vesselRisk[selectedVessel]).color }}
                        >
                          {fmtPct(vesselRisk[selectedVessel].probability)}
                        </span>
                        <RiskBadge risk={vesselRisk[selectedVessel]} />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Machine-learning risk assessment based on patient clinical parameters.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center text-[10px] font-mono text-slate-500">
                      Awaiting Patient Analysis
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mx-auto">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">
                  Select a Coronary Vessel to Begin Study
                </h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Choose <strong className="text-rose-600">LAD</strong>,{" "}
                  <strong className="text-orange-600">LCX</strong>, or{" "}
                  <strong className="text-red-600">RCA</strong> above to view its anatomical course,
                  smoothly focus the camera, and inspect vessel-specific risk.
                </p>
              </div>
            )}

            {/* Diagnostic Technical Inspector (Collapsible) */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                onClick={() => setIsDiagnosticOpen((prev) => !prev)}
                className="w-full flex items-center justify-between py-1.5 px-1 text-[10px] font-mono text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-slate-500" />
                  <span>3D Scene &amp; Model Architecture</span>
                </div>
                {isDiagnosticOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isDiagnosticOpen && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[10px] font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Background Anatomy:</span>
                    <span className="text-slate-800 font-semibold">92 MB GLB (Single Load)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GLB Total Triangles:</span>
                    <span className="text-slate-800 font-semibold">
                      {modelMeta ? modelMeta.totalTriangles.toLocaleString() : "2,500,028"} △
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GLB Buffer Chunks:</span>
                    <span className="text-slate-800 font-semibold">28 (Object_0 to Object_27)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Semantic Overlay:</span>
                    <span className="text-rose-600 font-semibold">3 Spline Tube Meshes</span>
                  </div>
                  <p className="text-[9px] text-slate-500 pt-1.5 border-t border-slate-200 leading-normal">
                    Note: The 28 Object_# meshes in the GLB are vertex-buffer subdivision chunks, not
                    semantic vessels. LAD, LCX, and RCA are rendered via the independent semantic
                    layer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
