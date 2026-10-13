"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export default function Disclaimer() {
  return (
    <footer className="w-full py-3 border-t border-slate-200/70 bg-white/60 backdrop-blur-xs text-center">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          <strong className="font-semibold text-slate-600">Notice: </strong>
          For research and educational use only. Model predictions support risk assessment and are not a substitute for professional medical evaluation.
        </span>
      </div>
    </footer>
  );
}
