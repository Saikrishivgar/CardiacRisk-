/**
 * Utility to generate and download the clinical PDF analysis report from the backend.
 * Captures the 3D heart model screenshot from the active canvas if available,
 * validates prediction data availability, and triggers a clean browser download.
 */

import type { PredictionResponse } from "@/types/patient";
import { getApiUrl } from "@/config/api";

export interface GeneratePdfParams {
  features: Record<string, string | number>;
  provided_features?: string[];
  extraction_sources?: Record<string, string>;
  patient_identifier?: string;
  doctor_user?: string;
  predictions?: PredictionResponse["predictions"];
  risk_levels?: PredictionResponse["risk_levels"];
  explanations?: PredictionResponse["explanations"];
  shap_scales?: PredictionResponse["shap_scales"];
  vessel_image_base64?: string | null;
}

export interface GeneratePdfResult {
  filename: string;
  size: number;
}

/**
 * Attempts to capture a crisp base64 snapshot from the active Three.js WebGL canvas.
 * Returns null if canvas is not mounted or cannot be exported.
 */
export function captureHeartCanvasScreenshot(): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  try {
    const canvas = document.querySelector("canvas");
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return canvas.toDataURL("image/png");
    }
  } catch (err) {
    console.warn("Could not capture 3D canvas snapshot:", err);
  }
  return null;
}

/**
 * Sends a POST request to /generate-report, downloads the PDF file to the user's browser,
 * and returns the generated filename and byte size.
 */
export async function downloadCardiacPdfReport(
  params: GeneratePdfParams
): Promise<GeneratePdfResult> {
  // Capture 3D canvas screenshot if not explicitly provided
  const screenshot = params.vessel_image_base64 ?? captureHeartCanvasScreenshot();

  const payload = {
    features: params.features,
    provided_features: params.provided_features,
    extraction_sources: params.extraction_sources,
    patient_identifier: params.patient_identifier,
    doctor_user: params.doctor_user,
    predictions: params.predictions,
    risk_levels: params.risk_levels,
    explanations: params.explanations,
    shap_scales: params.shap_scales,
    vessel_image_base64: screenshot,
  };

  const response = await fetch(getApiUrl("/generate-report"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `PDF generation failed (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorDetail);
  }

  // Extract filename from Content-Disposition header if present
  let filename = `Cardiac_Risk_Report_${Date.now()}.pdf`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
    if (match?.[1]) {
      filename = match[1].trim();
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  // Trigger browser download
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Clean up object URL after a brief delay
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);

  return {
    filename,
    size: blob.size,
  };
}
