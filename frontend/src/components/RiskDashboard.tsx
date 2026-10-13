"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface RiskMetric {
  id: string;
  name: string;
  fullName: string;
  description: string;
  probability: number | null;
  riskLevel: "High" | "Moderate" | "Low" | "Awaiting Analysis";
}

// Default placeholder state awaiting patient analysis
export const DEMO_RISK_METRICS: RiskMetric[] = [
  {
    id: "cad",
    name: "CAD",
    fullName: "Coronary Artery Disease",
    description: "Overall significant ischemic heart disease probability",
    probability: null,
    riskLevel: "Awaiting Analysis",
  },
  {
    id: "lad",
    name: "LAD",
    fullName: "Left Anterior Descending",
    description: "Anterior wall & septal perfusion vessel stenosis",
    probability: null,
    riskLevel: "Awaiting Analysis",
  },
  {
    id: "lcx",
    name: "LCX",
    fullName: "Left Circumflex Artery",
    description: "Lateral & posterior myocardial perfusion stenosis",
    probability: null,
    riskLevel: "Awaiting Analysis",
  },
  {
    id: "rca",
    name: "RCA",
    fullName: "Right Coronary Artery",
    description: "Inferior wall & right ventricular perfusion stenosis",
    probability: null,
    riskLevel: "Awaiting Analysis",
  },
];

interface RiskDashboardProps {
  metrics?: RiskMetric[];
}

export default function RiskDashboard({
  metrics = DEMO_RISK_METRICS,
}: RiskDashboardProps) {
  return (
    <div id="risk-dashboard" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Target Vessel & Condition Risk Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Multi-model diagnostic risk predictions across the main coronary tree
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>UI Demo Baseline Values</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item) => {
          const isHigh = item.probability !== null && item.probability >= 70;
          const isModerate = item.probability !== null && item.probability >= 50 && item.probability < 70;

          return (
            <div
              key={item.id}
              className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Subtle top indicator bar */}
              <div
                className={`absolute top-0 left-6 right-6 h-0.5 rounded-full ${
                  isHigh
                    ? "bg-rose-500"
                    : isModerate
                    ? "bg-amber-500"
                    : item.probability !== null
                    ? "bg-emerald-500"
                    : "bg-slate-300"
                }`}
              />

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600">
                      {item.fullName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      isHigh
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : isModerate
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : item.probability !== null
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isHigh ? (
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                    ) : item.probability !== null ? (
                      <CheckCircle2 className="w-3 h-3 text-amber-500" />
                    ) : null}
                    {item.riskLevel}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    Estimated Probability
                  </span>
                  <span
                    className={`text-2xl font-extrabold tracking-tight ${
                      isHigh
                        ? "text-rose-600"
                        : isModerate
                        ? "text-amber-600"
                        : item.probability !== null
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {item.probability !== null ? `${item.probability}%` : "--"}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh
                        ? "bg-gradient-to-r from-rose-500 to-red-600"
                        : isModerate
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : item.probability !== null
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-slate-200"
                    }`}
                    style={{ width: `${item.probability ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
