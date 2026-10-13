"use client";

import React from "react";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, HeartPulse } from "lucide-react";
import type { RiskLevel } from "@/types/patient";

interface CardProps {
  isSelected?: boolean;
  onSelect?: () => void;
  onHover?: (vessel: string | null) => void;
  onOpenPatientData?: () => void;
  probability?: number | null;
  riskLevel?: RiskLevel | null;
}

function getRiskConfig(level: RiskLevel | null | undefined, hasData: boolean) {
  if (!hasData || !level) {
    return {
      badge: (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-xs">
          <Clock className="w-3 h-3 text-slate-500" />
          Awaiting Analysis
        </span>
      ),
      bar: "bg-slate-200",
      textColor: "text-slate-300",
    };
  }

  switch (level) {
    case "HIGH":
      return {
        badge: (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            HIGH RISK
          </span>
        ),
        bar: "bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 animate-pulse",
        textColor: "text-rose-600",
      };
    case "MODERATE":
      return {
        badge: (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <Activity className="w-3 h-3 text-amber-600" />
            MODERATE RISK
          </span>
        ),
        bar: "bg-gradient-to-r from-amber-400 to-amber-500",
        textColor: "text-amber-600",
      };
    case "LOW":
      return {
        badge: (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            LOW RISK
          </span>
        ),
        bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
        textColor: "text-emerald-600",
      };
  }
}

// 1. TOP LEFT: CAD CARD (Delay 900ms)
export function CadCard({
  isSelected,
  onSelect,
  onHover,
  onOpenPatientData,
  probability,
  riskLevel,
}: CardProps) {
  const hasData = typeof probability === "number";
  const config = getRiskConfig(riskLevel, hasData);
  const displayPct = hasData ? `${(probability * 100).toFixed(1)}%` : "--";

  return (
    <div
      className="perspective-1000 relative w-full"
      style={{ animationDelay: "900ms" }}
    >
      {/* Entry Light Flash (fades after entrance) */}
      <div
        className="absolute -inset-2 rounded-3xl bg-rose-400/25 blur-xl pointer-events-none animate-entry-glow"
        style={{ animationDelay: "900ms" }}
      />

      <div
        onClick={onSelect}
        onMouseEnter={() => onHover?.("CAD")}
        onMouseLeave={() => onHover?.(null)}
        style={{ animationDelay: "900ms" }}
        className={`group relative bg-white/92 backdrop-blur-md rounded-2xl xl:rounded-3xl p-5 sm:p-6 xl:p-6 border transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(225,29,72,0.13)] hover:-translate-y-1.5 hover:scale-[1.03] animate-card-cad flex flex-col justify-between ${
          isSelected
            ? "border-rose-400 ring-2 ring-rose-200/80 shadow-[0_12px_30px_rgba(225,29,72,0.18)]"
            : "border-slate-200/80 hover:border-rose-300"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <HeartPulse
                className={`w-4 h-4 transition-colors ${
                  hasData ? "text-rose-500 animate-pulse" : "text-slate-400 group-hover:text-rose-500"
                }`}
              />
              <h3 className="text-xs xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                CAD Risk Assessment
              </h3>
            </div>
            {config.badge}
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h4 className="text-base sm:text-lg xl:text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors tracking-tight">
                Coronary Artery Disease
              </h4>
              <p className="text-xs xl:text-sm text-slate-500 mt-0.5">
                {hasData ? "Overall Ischemia Risk" : "No patient analysis yet"}
              </p>
            </div>
            <span
              className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight ml-2 ${config.textColor}`}
            >
              {displayPct}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
              style={{ width: hasData ? `${Math.min(100, Math.max(2, probability * 100))}%` : "0%" }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs xl:text-xs">
          <span className="text-slate-400 font-medium">Model: Random Forest</span>
          {!hasData && onOpenPatientData ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPatientData();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Analyze Patient</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-rose-50 border border-slate-200 group-hover:border-rose-200 text-slate-700 group-hover:text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>{isSelected ? "Reset view" : "Inspect vessel"}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. TOP RIGHT: LAD CARD (Delay 1100ms)
export function LadCard({
  isSelected,
  onSelect,
  onHover,
  onOpenPatientData,
  probability,
  riskLevel,
}: CardProps) {
  const hasData = typeof probability === "number";
  const config = getRiskConfig(riskLevel, hasData);
  const displayPct = hasData ? `${(probability * 100).toFixed(1)}%` : "--";

  return (
    <div
      className="perspective-1000 relative w-full"
      style={{ animationDelay: "1100ms" }}
    >
      {/* Entry Light Flash */}
      <div
        className="absolute -inset-2 rounded-3xl bg-rose-400/25 blur-xl pointer-events-none animate-entry-glow"
        style={{ animationDelay: "1100ms" }}
      />

      <div
        onClick={onSelect}
        onMouseEnter={() => onHover?.("LAD")}
        onMouseLeave={() => onHover?.(null)}
        style={{ animationDelay: "1100ms" }}
        className={`group relative bg-white/92 backdrop-blur-md rounded-2xl xl:rounded-3xl p-5 sm:p-6 xl:p-6 border transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(225,29,72,0.13)] hover:-translate-y-1.5 hover:scale-[1.03] animate-card-lad flex flex-col justify-between ${
          isSelected
            ? "border-rose-400 ring-2 ring-rose-200/80 shadow-[0_12px_30px_rgba(225,29,72,0.18)]"
            : "border-slate-200/80 hover:border-rose-300"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <HeartPulse
                className={`w-4 h-4 transition-colors ${
                  hasData ? "text-rose-500 animate-pulse" : "text-slate-400 group-hover:text-rose-500"
                }`}
              />
              <h3 className="text-xs xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                LAD Artery Analysis
              </h3>
            </div>
            {config.badge}
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h4 className="text-base sm:text-lg xl:text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors tracking-tight">
                Left Anterior Descending
              </h4>
              <p className="text-xs xl:text-sm text-slate-500 mt-0.5">
                {hasData ? "Anterior Wall & Septum" : "Awaiting patient analysis"}
              </p>
            </div>
            <span
              className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight ml-2 ${config.textColor}`}
            >
              {displayPct}
            </span>
          </div>

          {/* Progress indicator */}
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
              style={{ width: hasData ? `${Math.min(100, Math.max(2, probability * 100))}%` : "0%" }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs xl:text-xs">
          <span className="text-slate-400 font-medium">
            {hasData
              ? `Stenosis: ${riskLevel === "HIGH" ? "Probable >50%" : riskLevel === "MODERATE" ? "Intermediate" : "Unlikely >50%"}`
              : "Stenosis: Awaiting data"}
          </span>
          {!hasData && onOpenPatientData ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPatientData();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Analyze Patient</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-rose-50 border border-slate-200 group-hover:border-rose-200 text-slate-700 group-hover:text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>{isSelected ? "Reset view" : "Inspect vessel"}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. BOTTOM LEFT: LCX CARD (Delay 1300ms)
export function LcxCard({
  isSelected,
  onSelect,
  onHover,
  onOpenPatientData,
  probability,
  riskLevel,
}: CardProps) {
  const hasData = typeof probability === "number";
  const config = getRiskConfig(riskLevel, hasData);
  const displayPct = hasData ? `${(probability * 100).toFixed(1)}%` : "--";

  return (
    <div
      className="perspective-1000 relative w-full"
      style={{ animationDelay: "1300ms" }}
    >
      {/* Entry Light Flash */}
      <div
        className="absolute -inset-2 rounded-3xl bg-amber-400/25 blur-xl pointer-events-none animate-entry-glow"
        style={{ animationDelay: "1300ms" }}
      />

      <div
        onClick={onSelect}
        onMouseEnter={() => onHover?.("LCX")}
        onMouseLeave={() => onHover?.(null)}
        style={{ animationDelay: "1300ms" }}
        className={`group relative bg-white/92 backdrop-blur-md rounded-2xl xl:rounded-3xl p-5 sm:p-6 xl:p-6 border transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.13)] hover:-translate-y-1.5 hover:scale-[1.03] animate-card-lcx flex flex-col justify-between ${
          isSelected
            ? "border-amber-400 ring-2 ring-amber-200/80 shadow-[0_12px_30px_rgba(245,158,11,0.18)]"
            : "border-slate-200/80 hover:border-amber-300"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Activity
                className={`w-4 h-4 transition-colors ${
                  hasData ? "text-amber-500" : "text-slate-400 group-hover:text-amber-500"
                }`}
              />
              <h3 className="text-xs xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                LCX Risk Score
              </h3>
            </div>
            {config.badge}
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h4 className="text-base sm:text-lg xl:text-xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors tracking-tight">
                Left Circumflex
              </h4>
              <p className="text-xs xl:text-sm text-slate-500 mt-0.5">
                {hasData ? "Lateral Wall Perfusion" : "Awaiting patient analysis"}
              </p>
            </div>
            <span
              className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight ml-2 ${config.textColor}`}
            >
              {displayPct}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
              style={{ width: hasData ? `${Math.min(100, Math.max(2, probability * 100))}%` : "0%" }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs xl:text-xs">
          <span className="text-slate-400 font-medium">Model: XGBoost Classifier</span>
          {!hasData && onOpenPatientData ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPatientData();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Analyze Patient</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-amber-50 border border-slate-200 group-hover:border-amber-200 text-slate-700 group-hover:text-amber-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>{isSelected ? "Reset view" : "Inspect vessel"}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. BOTTOM RIGHT: RCA CARD (Delay 1500ms)
export function RcaCard({
  isSelected,
  onSelect,
  onHover,
  onOpenPatientData,
  probability,
  riskLevel,
}: CardProps) {
  const hasData = typeof probability === "number";
  const config = getRiskConfig(riskLevel, hasData);
  const displayPct = hasData ? `${(probability * 100).toFixed(1)}%` : "--";

  return (
    <div
      className="perspective-1000 relative w-full"
      style={{ animationDelay: "1500ms" }}
    >
      {/* Entry Light Flash */}
      <div
        className="absolute -inset-2 rounded-3xl bg-rose-400/25 blur-xl pointer-events-none animate-entry-glow"
        style={{ animationDelay: "1500ms" }}
      />

      <div
        onClick={onSelect}
        onMouseEnter={() => onHover?.("RCA")}
        onMouseLeave={() => onHover?.(null)}
        style={{ animationDelay: "1500ms" }}
        className={`group relative bg-white/92 backdrop-blur-md rounded-2xl xl:rounded-3xl p-5 sm:p-6 xl:p-6 border transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(225,29,72,0.13)] hover:-translate-y-1.5 hover:scale-[1.03] animate-card-rca flex flex-col justify-between ${
          isSelected
            ? "border-rose-400 ring-2 ring-rose-200/80 shadow-[0_12px_30px_rgba(225,29,72,0.18)]"
            : "border-slate-200/80 hover:border-rose-300"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <HeartPulse
                className={`w-4 h-4 transition-colors ${
                  hasData ? "text-rose-500 animate-pulse" : "text-slate-400 group-hover:text-rose-500"
                }`}
              />
              <h3 className="text-xs xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                RCA Status
              </h3>
            </div>
            {config.badge}
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <h4 className="text-base sm:text-lg xl:text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors tracking-tight">
                Right Coronary Artery
              </h4>
              <p className="text-xs xl:text-sm text-slate-500 mt-0.5">
                {hasData ? "Inferior Wall & RV Branch" : "Awaiting patient analysis"}
              </p>
            </div>
            <span
              className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight ml-2 ${config.textColor}`}
            >
              {displayPct}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
              style={{ width: hasData ? `${Math.min(100, Math.max(2, probability * 100))}%` : "0%" }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs xl:text-xs">
          <span className="text-slate-400 font-medium">
            {hasData
              ? `Stenosis: ${riskLevel === "HIGH" ? "Probable >50%" : riskLevel === "MODERATE" ? "Intermediate" : "Unlikely >50%"}`
              : "Stenosis: Awaiting data"}
          </span>
          {!hasData && onOpenPatientData ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPatientData();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Analyze Patient</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-rose-50 border border-slate-200 group-hover:border-rose-200 text-slate-700 group-hover:text-rose-700 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>{isSelected ? "Reset view" : "Inspect vessel"}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
