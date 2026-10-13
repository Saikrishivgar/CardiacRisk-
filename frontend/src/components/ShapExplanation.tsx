"use client";

import React, { useState } from "react";
import { HelpCircle, TrendingUp, TrendingDown, X } from "lucide-react";
import type { PredictionResponse } from "@/types/patient";


interface ShapExplanationProps {
  onClose?: () => void;
  prediction?: PredictionResponse | null;
  defaultTarget?: "CAD" | "LAD" | "LCX" | "RCA" | null;
}

export default function ShapExplanation({ onClose, prediction, defaultTarget }: ShapExplanationProps) {
  const [target, setTarget] = useState<"CAD" | "LAD" | "LCX" | "RCA">(defaultTarget || "CAD");
  const contributions = prediction?.explanations?.[target] || [];
  const maxVal = contributions.length > 0
    ? Math.max(...contributions.map((d) => Math.abs(d.shap_value)))
    : 1;
  const scale = prediction?.shap_scales?.[target] || "probability";

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Why this prediction?
            </h2>
            <p className="text-xs text-slate-500">
              SHAP (SHapley Additive exPlanations) clinical feature attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-6 leading-relaxed">
        Key clinical drivers influencing multi-vessel stenosis risk.
        Values are calculated in real time by tree-based SHAP explainers on the backend.
      </p>

      {prediction && (
        <div className="flex items-center gap-2 mb-6">
          {(["CAD", "LAD", "LCX", "RCA"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                target === t
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Feature contribution list */}
      <div className="space-y-3.5">
        {!prediction ? (
          <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            No patient analysis available yet. Analyze a patient first to see real-time SHAP explanations.
          </div>
        ) : contributions.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            No significant features found for {target}.
          </div>
        ) : (
          contributions.map((item, idx) => {
            const isPositive = item.shap_value >= 0;
            const absVal = Math.abs(item.shap_value);
            const barWidth = Math.min(100, Math.round((absVal / maxVal) * 100));

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.feature}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center text-xs font-bold gap-1 ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3 text-rose-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
                      {isPositive ? '+' : '-'}{absVal.toFixed(4)} {scale === "log_odds" ? "log-odds" : "pts"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({isPositive ? 'Elevates' : 'Reduces'} {target} Risk)
                    </span>
                  </div>
                </div>

                {/* Contribution bar */}
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mb-1.5 flex flex-col justify-center">
                  <div className="w-full h-full relative">
                    {/* Background line for zero point if we wanted to get fancy, but we'll stick to a simple bar for absolute magnitude */}
                    <div
                      className={`absolute left-0 h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-gradient-to-r from-rose-400 via-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
