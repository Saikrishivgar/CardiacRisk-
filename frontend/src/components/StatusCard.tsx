"use client";

import React from "react";
import { Sliders, HelpCircle, HeartPulse, FileDown, Loader2 } from "lucide-react";

interface StatusCardProps {
  onOpenPatientData: () => void;
  onOpenExplanations: () => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  predictionAvailable?: boolean;
}

export default function StatusCard({
  onOpenPatientData,
  onOpenExplanations,
  onGenerateReport,
  isGeneratingReport = false,
  predictionAvailable = false,
}: StatusCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white/92 backdrop-blur-md rounded-2xl px-6 py-3 border border-slate-200/90 shadow-[0_6px_20px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3.5 text-center sm:text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs shrink-0">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Cardiac Risk Navigator
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                3D AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-assisted multi-vessel anatomical cardiac risk visualization
            </p>
          </div>
        </div>

        {/* 3D Action Navigation Buttons */}
        <div className="flex items-center flex-wrap justify-center gap-2">
          {predictionAvailable && onGenerateReport && (
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-[0_2px_8px_rgba(225,29,72,0.25)] hover:shadow-[0_4px_14px_rgba(225,29,72,0.35)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="Download comprehensive PDF clinical analysis report"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenPatientData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200/90 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-xs transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Patient Data</span>
          </button>

          <button
            onClick={onOpenExplanations}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/70 text-rose-700 font-bold text-xs border border-rose-200 shadow-[0_2px_6px_rgba(244,63,94,0.08)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.15)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Explanations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
