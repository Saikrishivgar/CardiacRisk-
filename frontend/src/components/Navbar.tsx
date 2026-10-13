"use client";

import React from "react";
import Link from "next/link";
import { Activity, Sliders, HelpCircle, BarChart3, Stethoscope, LogOut, GitBranch } from "lucide-react";

interface NavbarProps {
  onOpenOverview?: () => void;
  onOpenAnalysis?: () => void;
  onOpenPatientData?: () => void;
  onOpenExplanations?: () => void;
  onOpenDoctorLogin?: () => void;
  doctorUser?: string | null;
  onSignOut?: () => void;
  activeTab?: string;
}

export default function Navbar({
  onOpenOverview,
  onOpenAnalysis,
  onOpenPatientData,
  onOpenExplanations,
  onOpenDoctorLogin,
  doctorUser = null,
  onSignOut,
  activeTab = "overview",
}: NavbarProps) {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full max-w-[1720px] mx-auto px-[4vw] sm:px-[5vw] h-14 flex items-center justify-between">
        {/* Left: ♥ / AI icon + Cardiac Risk Navigator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
            Cardiac Risk Navigator
          </span>
        </div>

        {/* Right: Overview | Analysis | Patient Data | Explanations | Doctor Login */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
          <button
            onClick={onOpenOverview}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
              activeTab === "overview"
                ? "text-rose-700 bg-rose-50/90 border-rose-200 font-semibold shadow-[0_2px_6px_rgba(244,63,94,0.1)]"
                : "bg-white/80 hover:bg-white border-slate-200/70 hover:text-slate-900"
            }`}
          >
            Overview
          </button>

          <button
            onClick={onOpenAnalysis}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
              activeTab === "analysis"
                ? "text-rose-700 bg-rose-50/90 border-rose-200 font-semibold shadow-[0_2px_6px_rgba(244,63,94,0.1)]"
                : "bg-white/80 hover:bg-white border-slate-200/70 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Analysis</span>
            </span>
          </button>

          <button
            onClick={onOpenPatientData}
            className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Patient Data</span>
            <span className="sm:hidden">Patient</span>
          </button>

          <button
            onClick={onOpenExplanations}
            className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Explanations</span>
            <span className="sm:hidden">SHAP</span>
          </button>

          <Link
            href="/vessel-study"
            className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Vessel Study</span>
            <span className="sm:hidden">3D</span>
          </Link>

          {/* Doctor Login Entry / Doctor User Badge */}
          {doctorUser ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                <Stethoscope className="w-3 h-3 text-rose-600" />
                <span className="max-w-[120px] truncate">{doctorUser}</span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenDoctorLogin}
              className="ml-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50/70 text-rose-700 font-semibold border border-rose-200/80 transition-all duration-150 cursor-pointer shadow-[0_1px_3px_rgba(244,63,94,0.08)] hover:shadow-[0_4px_10px_rgba(244,63,94,0.12)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
              <span>Doctor Login</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
