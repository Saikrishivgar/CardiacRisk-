"use client";

import React from "react";

interface ConnectionLinesProps {
  hoveredVessel: string | null;
  selectedVessel: string | null;
  cameraDistance?: number;
}

export default function ConnectionLines({
  hoveredVessel,
  selectedVessel,
  cameraDistance = 2.12,
}: ConnectionLinesProps) {
  // Helpers for dynamic opacity & glow on card hover/selection
  const getLineStyle = (id: string) => {
    const isSelected = selectedVessel === id;
    const isHovered = hoveredVessel === id;
    const hasFocus = selectedVessel !== null || hoveredVessel !== null;

    let opacity = 0.38; // Clean visible baseline
    let strokeWidth = 1.5;

    if (isSelected) {
      opacity = 0.85;
      strokeWidth = 2.1;
    } else if (isHovered) {
      opacity = 0.65;
      strokeWidth = 1.9;
    } else if (hasFocus) {
      opacity = 0.18; // Subtle dimming for non-focused vessels
    }

    return { opacity, strokeWidth, isHighlighted: isSelected || isHovered };
  };

  const cad = getLineStyle("CAD");
  const lad = getLineStyle("LAD");
  const lcx = getLineStyle("LCX");
  const rca = getLineStyle("RCA");

  // =========================================================================
  // DYNAMIC PROTECTED SAFE ZONE CALCULATION
  // =========================================================================
  // Default camera distance is 2.12; minimum distance (max zoom) is 1.60.
  // Normalized zoom factor: 0.0 at default -> 1.0 at maximum zoom.
  const dist = cameraDistance ?? 2.12;
  const zoomFactor = Math.max(0, Math.min(1.25, (2.12 - dist) / (2.12 - 1.60)));

  // Safe zone radii around the 3D heart with generous protective padding.
  // As the user zooms in, the protected region expands so the paths retract outward.
  const safeRx = 14.5 + zoomFactor * 4.5;
  const safeRy = 20.0 + zoomFactor * 5.0;

  // Path endpoints: strictly terminate at the perimeter of the protected safe zone
  const cadEnd = {
    x: Number((50 - safeRx - 1.5).toFixed(1)),
    y: Number((50 - safeRy * 0.65).toFixed(1)),
  };
  const ladEnd = {
    x: Number((50 + safeRx + 1.5).toFixed(1)),
    y: Number((50 - safeRy * 0.65).toFixed(1)),
  };
  const lcxEnd = {
    x: Number((50 - safeRx - 1.5).toFixed(1)),
    y: Number((50 + safeRy * 0.65).toFixed(1)),
  };
  const rcaEnd = {
    x: Number((50 + safeRx + 1.5).toFixed(1)),
    y: Number((50 + safeRy * 0.65).toFixed(1)),
  };

  // Gracefully curved outer framing paths (from card anchors to safe zone perimeter)
  const cadPath = `M 22 27 C 26 27, 29 32, ${cadEnd.x} ${cadEnd.y}`;
  const ladPath = `M 78 27 C 74 27, 71 32, ${ladEnd.x} ${ladEnd.y}`;
  const lcxPath = `M 22 73 C 26 73, 29 68, ${lcxEnd.x} ${lcxEnd.y}`;
  const rcaPath = `M 78 73 C 74 73, 71 68, ${rcaEnd.x} ${rcaEnd.y}`;

  return (
    <div className="hidden lg:block absolute inset-0 pointer-events-none z-25">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft Medical HUD Line Glow Filter */}
          <filter id="hudLineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* DYNAMIC PROTECTED SAFE ZONE MASK:
              Black ellipse completely blocks out the entire central 3D heart zone,
              dynamically expanding with zoom so NO line or particle can ever enter */}
          <mask id="heartProtectedSafeZone">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <ellipse cx="50" cy="50" rx={safeRx} ry={safeRy} fill="black" />
          </mask>

          {/* Linear Gradients along each connecting path */}
          {/* CAD: Thin translucent pink/red */}
          <linearGradient id="cadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#fb7185" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.30" />
          </linearGradient>

          {/* LAD: Thin translucent pink/red */}
          <linearGradient id="ladGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#fb7185" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.30" />
          </linearGradient>

          {/* LCX: Soft amber/gold for moderate risk */}
          <linearGradient id="lcxGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.80" />
            <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0.35" />
          </linearGradient>

          {/* RCA: Thin translucent pink/red */}
          <linearGradient id="rcaGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#fb7185" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.30" />
          </linearGradient>
        </defs>

        {/* Outer Group with Protected Safe Zone Mask */}
        <g mask="url(#heartProtectedSafeZone)">
          {/* =============================================================== */}
          {/* 1. CAD -> HEART SAFE BOUNDARY (Top-Left Outer Frame)             */}
          {/* =============================================================== */}
          {/* Soft background glow line */}
          <path
            d={cadPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={cad.strokeWidth + 2.2}
            opacity={cad.opacity * 0.35}
            strokeLinecap="round"
            filter="url(#hudLineGlow)"
            className="transition-all duration-300"
          />
          {/* Crisp segmented line */}
          <path
            id="cadPath"
            d={cadPath}
            fill="none"
            stroke="url(#cadGrad)"
            strokeWidth={cad.strokeWidth}
            opacity={cad.opacity}
            strokeLinecap="round"
            strokeDasharray={cad.isHighlighted ? "none" : "4 3"}
            className="transition-all duration-300"
          />
          {/* Origin dot on card edge */}
          <circle cx="22" cy="27" r="1.3" fill="#f43f5e" opacity={cad.opacity * 1.4} />

          {/* =============================================================== */}
          {/* 2. LAD -> HEART SAFE BOUNDARY (Top-Right Outer Frame)            */}
          {/* =============================================================== */}
          <path
            d={ladPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={lad.strokeWidth + 2.2}
            opacity={lad.opacity * 0.35}
            strokeLinecap="round"
            filter="url(#hudLineGlow)"
            className="transition-all duration-300"
          />
          <path
            id="ladPath"
            d={ladPath}
            fill="none"
            stroke="url(#ladGrad)"
            strokeWidth={lad.strokeWidth}
            opacity={lad.opacity}
            strokeLinecap="round"
            strokeDasharray={lad.isHighlighted ? "none" : "4 3"}
            className="transition-all duration-300"
          />
          {/* Origin dot on card edge */}
          <circle cx="78" cy="27" r="1.3" fill="#f43f5e" opacity={lad.opacity * 1.4} />

          {/* =============================================================== */}
          {/* 3. LCX -> HEART SAFE BOUNDARY (Bottom-Left Outer Frame, Amber)   */}
          {/* =============================================================== */}
          <path
            d={lcxPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={lcx.strokeWidth + 2.2}
            opacity={lcx.opacity * 0.35}
            strokeLinecap="round"
            filter="url(#hudLineGlow)"
            className="transition-all duration-300"
          />
          <path
            id="lcxPath"
            d={lcxPath}
            fill="none"
            stroke="url(#lcxGrad)"
            strokeWidth={lcx.strokeWidth}
            opacity={lcx.opacity}
            strokeLinecap="round"
            strokeDasharray={lcx.isHighlighted ? "none" : "4 3"}
            className="transition-all duration-300"
          />
          {/* Origin dot on card edge */}
          <circle cx="22" cy="73" r="1.3" fill="#f59e0b" opacity={lcx.opacity * 1.4} />

          {/* =============================================================== */}
          {/* 4. RCA -> HEART SAFE BOUNDARY (Bottom-Right Outer Frame)          */}
          {/* =============================================================== */}
          <path
            d={rcaPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={rca.strokeWidth + 2.2}
            opacity={rca.opacity * 0.35}
            strokeLinecap="round"
            filter="url(#hudLineGlow)"
            className="transition-all duration-300"
          />
          <path
            id="rcaPath"
            d={rcaPath}
            fill="none"
            stroke="url(#rcaGrad)"
            strokeWidth={rca.strokeWidth}
            opacity={rca.opacity}
            strokeLinecap="round"
            strokeDasharray={rca.isHighlighted ? "none" : "4 3"}
            className="transition-all duration-300"
          />
          {/* Origin dot on card edge */}
          <circle cx="78" cy="73" r="1.3" fill="#f43f5e" opacity={rca.opacity * 1.4} />
        </g>
      </svg>
    </div>
  );
}
