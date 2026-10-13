"use client";

import { useSyncExternalStore } from "react";
import type { PredictionResponse } from "@/types/patient";

/**
 * Single shared source of truth for the latest backend prediction and active patient analysis.
 * Persisted in sessionStorage so page reloads or tab navigation keep the current analysis.
 */
const PREDICTION_STORAGE_KEY = "cardiac_latest_prediction";
const ANALYSIS_STORAGE_KEY = "cardiac_latest_analysis_data";

export interface ActiveAnalysisData {
  prediction: PredictionResponse;
  features: Record<string, string | number>;
  provided_features?: string[];
  extraction_sources?: Record<string, string>;
  patient_identifier?: string;
  doctor_user?: string;
  timestamp: string;
}

let currentPrediction: PredictionResponse | null = null;
let currentAnalysis: ActiveAnalysisData | null = null;
let hydrated = false;

const predictionListeners = new Set<() => void>();
const analysisListeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const rawPred = window.sessionStorage.getItem(PREDICTION_STORAGE_KEY);
    if (rawPred) currentPrediction = JSON.parse(rawPred) as PredictionResponse;
  } catch {
    currentPrediction = null;
  }

  try {
    const rawAnalysis = window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (rawAnalysis) currentAnalysis = JSON.parse(rawAnalysis) as ActiveAnalysisData;
  } catch {
    currentAnalysis = null;
  }
}

export function setSharedPrediction(next: PredictionResponse | null) {
  hydrated = true;
  currentPrediction = next;
  try {
    if (next) window.sessionStorage.setItem(PREDICTION_STORAGE_KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(PREDICTION_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  predictionListeners.forEach((l) => l());
}

export function setSharedActiveAnalysis(next: ActiveAnalysisData | null) {
  hydrated = true;
  currentAnalysis = next;
  try {
    if (next) {
      window.sessionStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(next));
      setSharedPrediction(next.prediction);
    } else {
      window.sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
      setSharedPrediction(null);
    }
  } catch {
    // ignore storage errors
  }
  analysisListeners.forEach((l) => l());
}

export function getSharedActiveAnalysis(): ActiveAnalysisData | null {
  hydrate();
  return currentAnalysis;
}

function subscribePrediction(cb: () => void) {
  predictionListeners.add(cb);
  return () => {
    predictionListeners.delete(cb);
  };
}

function subscribeAnalysis(cb: () => void) {
  analysisListeners.add(cb);
  return () => {
    analysisListeners.delete(cb);
  };
}

function getPredictionSnapshot(): PredictionResponse | null {
  hydrate();
  return currentPrediction;
}

function getAnalysisSnapshot(): ActiveAnalysisData | null {
  hydrate();
  return currentAnalysis;
}

export function useSharedPrediction(): PredictionResponse | null {
  return useSyncExternalStore(subscribePrediction, getPredictionSnapshot, () => null);
}

export function useSharedActiveAnalysis(): ActiveAnalysisData | null {
  return useSyncExternalStore(subscribeAnalysis, getAnalysisSnapshot, () => null);
}
