import * as THREE from "three";

export type VesselName = "LAD" | "LCX" | "RCA";

export type VesselVisualState = "normal" | "selected" | "highlighted" | "dimmed" | "hidden";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

/** Real backend prediction for one vessel (vessel-level stenosis probability 0..1). */
export interface VesselRiskInfo {
  probability: number;
  riskLevel: RiskLevel;
}

/** null = no patient analyzed yet (neutral appearance). */
export type VesselRiskMap = Record<VesselName, VesselRiskInfo> | null;

/**
 * Expected backend ML model prediction payload from FastAPI (future integration).
 * Probability values represent the predicted probability of the positive stenosis class (0.0 to 1.0).
 * IMPORTANT: These represent statistical model probabilities, NOT percentage physical blockage.
 */
export interface BackendVesselPrediction {
  vessel: VesselName;
  probability: number; // e.g. 0.8937 -> "89% predicted stenosis risk"
}

export interface CoronaryVesselConfig {
  name: VesselName;
  fullName: string;
  anatomicalDescription: string;
  perfusionTerritory: string;
  defaultColor: string;
  selectedColor: string;
  dimmedColor: string;
  tubeRadius: number;
  // 3D control points sampled by raycasting onto the GLB surface along the visible coronary vessels (GLB-normalized scene space, same group/transform as the heart; anterior face of the heart looks toward -Z)
  controlPoints: [number, number, number][];
  // Optimal camera framing for clinical inspection of this specific vessel
  cameraFocus: {
    target: [number, number, number];
    position: [number, number, number];
  };
}

/**
 * Anatomically positioned vessel-level visualization paths.
 * Aligned with the coronary sulci of the 3D digital coronary model.
 * Note: These are vessel-level visualization approximations, not exact physical lesion locations.
 */
export const CORONARY_VESSEL_CONFIGS: Record<VesselName, CoronaryVesselConfig> = {
  LAD: {
    name: "LAD",
    fullName: "Left Anterior Descending Artery",
    anatomicalDescription: "Originates from Left Main coronary artery; traverses anterior interventricular groove to the apex.",
    perfusionTerritory: "Anterior left ventricular wall, anterior 2/3 of interventricular septum, cardiac apex.",
    defaultColor: "#f43f5e",   // Rose / Crimson
    selectedColor: "#ff1744",  // Vivid Medical Red-Pink
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.009,
    controlPoints: [
      [-0.13, 0.022, -0.374],
      [-0.219, -0.064, -0.512],
      [-0.258, -0.125, -0.593],
      [-0.261, -0.195, -0.656],
      [-0.238, -0.316, -0.671],
      [-0.198, -0.419, -0.777],
      [-0.167, -0.556, -0.787],
      [-0.154, -0.686, -0.734],
      [-0.201, -0.847, -0.588],
    ],
    cameraFocus: {
      target: [-0.20, -0.30, -0.62],
      position: [-0.55, -0.25, -2.25], // Anterior close-up of LAD
    },
  },

  LCX: {
    name: "LCX",
    fullName: "Left Circumflex Artery",
    anatomicalDescription: "Branches from Left Main coronary artery; runs in left atrioventricular groove around the lateral heart margin.",
    perfusionTerritory: "Lateral and posterolateral walls of the left ventricle.",
    defaultColor: "#f97316",   // Amber / Orange
    selectedColor: "#ff6d00",  // Vivid Amber Glow
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.009,
    controlPoints: [
      [-0.099, 0.024, -0.298],
      [-0.277, -0.006, -0.168],
      [-0.336, -0.069, -0.082],
      [-0.37, -0.19, -0.022],
      [-0.309, -0.333, 0.014],
      [-0.177, -0.667, -0.002],
      [0.062, -0.833, -0.102],
      [0.164, -0.854, -0.109],
    ],
    cameraFocus: {
      target: [-0.28, -0.30, -0.05],
      position: [-2.25, -0.15, 0.25], // Left lateral view of LCX
    },
  },

  RCA: {
    name: "RCA",
    fullName: "Right Coronary Artery",
    anatomicalDescription: "Arises from right aortic sinus; descends down the right atrioventricular groove to the diaphragmatic surface.",
    perfusionTerritory: "Right ventricle, inferior wall of left ventricle, posterior 1/3 of interventricular septum, SA/AV nodes.",
    defaultColor: "#ef4444",   // Red
    selectedColor: "#ff2d55",  // Vivid Arterial Red
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.009,
    controlPoints: [
      [0.293, -0.141, -0.376],
      [0.333, -0.24, -0.425],
      [0.398, -0.345, -0.434],
      [0.427, -0.427, -0.505],
      [0.43, -0.537, -0.432],
      [0.366, -0.814, -0.334],
      [0.279, -0.828, -0.22],
    ],
    cameraFocus: {
      target: [0.38, -0.45, -0.40],
      position: [1.75, -0.35, -1.85], // Right anterior oblique view of RCA
    },
  },
};

/**
 * Anatomically positioned vessel-level visualization paths for the Overview 3D Heart.
 * Calibrated directly on the visible coronary arteries in local object space.
 */
export const OVERVIEW_CORONARY_VESSEL_CONFIGS: Record<VesselName, CoronaryVesselConfig> = {
  LAD: {
    name: "LAD",
    fullName: "Left Anterior Descending Artery",
    anatomicalDescription: "Originates from Left Main coronary artery; courses down the anterior interventricular groove towards the cardiac apex.",
    perfusionTerritory: "Anterior wall, interventricular septum, cardiac apex.",
    defaultColor: "#f43f5e",   // Rose / Crimson
    selectedColor: "#ff1744",  // Vivid Medical Red-Pink
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.0028,
    controlPoints: [
      [0.0480, 0.4608, 0.2698],
      [0.0375, 0.4396, 0.2767],
      [0.0208, 0.4243, 0.2842],
      [0.0026, 0.4112, 0.2862],
      [-0.0182, 0.3944, 0.2798],
      [-0.0294, 0.3783, 0.2842],
      [-0.0242, 0.3594, 0.2879],
      [0.0054, 0.3320, 0.2890],
      [0.0152, 0.3118, 0.2907],
      [0.0176, 0.2937, 0.2887],
      [0.0258, 0.2783, 0.2883],
      [0.0338, 0.2592, 0.2872],
      [0.0474, 0.2439, 0.2807],
      [0.0588, 0.2248, 0.2718],
      [0.0474, 0.2007, 0.2602],
      [0.0143, 0.1858, 0.2579],
      [0.0383, 0.1676, 0.2490],
      [0.0623, 0.1504, 0.2353],
      [0.0662, 0.1313, 0.2191],
      [0.0540, 0.1121, 0.2033],
      [0.0482, 0.0927, 0.1747],
      [0.0661, 0.0723, 0.1438],
    ],
    cameraFocus: {
      target: [0.03, 0.28, 0.26],
      position: [0.2, 0.1, 1.8],
    },
  },

  LCX: {
    name: "LCX",
    fullName: "Left Circumflex Artery",
    anatomicalDescription: "Branches from Left Main; courses in the left atrioventricular groove along the lateral cardiac margin.",
    perfusionTerritory: "Lateral and posterolateral walls of the left ventricle.",
    defaultColor: "#f97316",   // Amber / Orange
    selectedColor: "#ff6d00",  // Vivid Amber Glow
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.0028,
    controlPoints: [
      [0.0480, 0.4608, 0.2698],
      [0.0665, 0.4552, 0.2438],
      [0.0953, 0.4526, 0.2389],
      [0.1320, 0.4459, 0.2374],
      [0.1642, 0.4309, 0.2197],
      [0.1991, 0.4140, 0.1926],
      [0.2122, 0.3913, 0.1837],
      [0.2164, 0.3647, 0.1820],
      [0.2282, 0.3332, 0.1783],
      [0.2209, 0.3002, 0.1754],
      [0.2371, 0.2653, 0.1484],
      [0.2367, 0.2290, 0.1378],
      [0.2561, 0.1923, 0.0959],
      [0.2601, 0.1585, 0.0885],
    ],
    cameraFocus: {
      target: [0.20, 0.35, 0.18],
      position: [-1.2, 0.3, 1.4],
    },
  },

  RCA: {
    name: "RCA",
    fullName: "Right Coronary Artery",
    anatomicalDescription: "Arises from right aortic sinus; descends down the right atrioventricular groove towards the acute margin and diaphragmatic surface.",
    perfusionTerritory: "Right ventricle, inferior cardiac wall.",
    defaultColor: "#ef4444",   // Red
    selectedColor: "#ff2d55",  // Vivid Arterial Red
    dimmedColor: "#475569",    // Translucent Slate
    tubeRadius: 0.0028,
    controlPoints: [
      [-0.1042, 0.3245, 0.2583],
      [-0.0837, 0.3168, 0.2655],
      [-0.0564, 0.3032, 0.2716],
      [-0.0391, 0.2902, 0.2832],
      [-0.0346, 0.2724, 0.2824],
      [-0.0233, 0.2551, 0.2796],
      [-0.0208, 0.2379, 0.2777],
      [-0.0155, 0.2198, 0.2714],
      [-0.0384, 0.2052, 0.2571],
      [-0.0483, 0.1888, 0.2424],
      [-0.0529, 0.1723, 0.2278],
      [-0.0270, 0.1565, 0.2232],
      [-0.0181, 0.1373, 0.2142],
      [-0.0294, 0.1231, 0.1865],
      [-0.0212, 0.1031, 0.1658],
      [-0.0196, 0.0852, 0.1332],
    ],
    cameraFocus: {
      target: [-0.04, 0.22, 0.24],
      position: [1.2, 0.2, 1.4],
    },
  },
};

/**
 * Standard default camera framing for full coronary tree overview
 */
export const DEFAULT_CAMERA_FRAMING = {
  target: [0, 0, 0] as [number, number, number],
  position: [0, 0, -3.2] as [number, number, number],
};

/**
 * Converts continuous predicted probability into a standardized clinical risk tier.
 * Note: Represents statistical positive-class classification probability from ML models.
 */
export function getVesselRiskLevel(probability: number): RiskLevel {
  if (probability < 0.45) return "LOW";
  if (probability < 0.75) return "MODERATE";
  return "HIGH";
}
