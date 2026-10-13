"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeartCanvas from "@/components/HeartCanvas";
import { CadCard, LadCard, LcxCard, RcaCard } from "@/components/FramingCards";
import StatusCard from "@/components/StatusCard";
import Disclaimer from "@/components/Disclaimer";
import PatientForm from "@/components/PatientForm";
import ShapExplanation from "@/components/ShapExplanation";
import DoctorLoginModal from "@/components/DoctorLoginModal";
import DoctorPortalScreen from "@/components/DoctorPortalScreen";
import ConnectionLines from "@/components/ConnectionLines";
import {
  useSharedPrediction,
  setSharedPrediction,
  useSharedActiveAnalysis,
  setSharedActiveAnalysis,
} from "@/utils/predictionStore";
import { downloadCardiacPdfReport } from "@/utils/generatePdfReport";
import type { VesselRiskMap } from "@/config/coronaryVesselPaths";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorUser, setDoctorUser] = useState<string>("Dr. A. Sharma (Cardiology)");
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"patient" | "shap" | null>(null);
  const [isDoctorLoginOpen, setIsDoctorLoginOpen] = useState<boolean>(false);
  const [cameraDistance, setCameraDistance] = useState<number>(2.12);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfToast, setPdfToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Shared prediction & active analysis state (persisted across tabs & routes)
  const prediction = useSharedPrediction();
  const setPrediction = setSharedPrediction;
  const activeAnalysis = useSharedActiveAnalysis();

  const vesselRisk: VesselRiskMap = useMemo(
    () =>
      prediction
        ? {
            LAD: { probability: prediction.predictions.LAD, riskLevel: prediction.risk_levels.LAD },
            LCX: { probability: prediction.predictions.LCX, riskLevel: prediction.risk_levels.LCX },
            RCA: { probability: prediction.predictions.RCA, riskLevel: prediction.risk_levels.RCA },
          }
        : null,
    [prediction]
  );

  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Restore in-tab session (e.g. returning from the Vessel Study route)
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("cardiac_auth_user");
      if (saved) {
        setDoctorUser(saved);
        setIsAuthenticated(true);
      } else {
        setSharedPrediction(null);
        setSharedActiveAnalysis(null);
      }
    } catch {
      // ignore storage errors
    }
    setAuthChecked(true);
  }, []);

  const handleSelectVessel = (vessel: string) => {
    setSelectedVessel((prev) => (prev === vessel ? null : vessel));
  };

  const handleLoginSuccess = (name: string) => {
    setDoctorUser(name);
    setIsAuthenticated(true);
    try {
      window.sessionStorage.setItem("cardiac_auth_user", name);
    } catch {
      // ignore storage errors
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setSelectedVessel(null);
    setPrediction(null);
    setSharedActiveAnalysis(null);
    setPdfToast(null);
    try {
      window.sessionStorage.removeItem("cardiac_auth_user");
    } catch {
      // ignore storage errors
    }
  };

  const handleGenerateReportFromDashboard = async () => {
    if (isGeneratingPdf) return;
    if (!prediction || !activeAnalysis) {
      setActiveModal("patient");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfToast(null);

    try {
      const res = await downloadCardiacPdfReport({
        features: activeAnalysis.features,
        provided_features: activeAnalysis.provided_features,
        extraction_sources: activeAnalysis.extraction_sources,
        doctor_user: doctorUser,
        predictions: prediction.predictions,
        risk_levels: prediction.risk_levels,
        explanations: prediction.explanations,
        shap_scales: prediction.shap_scales,
      });

      setPdfToast({
        type: "success",
        message: `Clinical Report downloaded: ${res.filename}`,
      });
    } catch (err: any) {
      setPdfToast({
        type: "error",
        message: err?.message || "Failed to generate cardiac PDF report.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  // FIRST SCREEN: Doctor Portal with cinematic 3-step transition
  if (!isAuthenticated) {
    return <DoctorPortalScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // SECOND SCREEN: Full Interactive 3D Cardiac Risk Navigator Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-rose-100 selection:text-rose-900 overflow-x-hidden animate-in fade-in duration-700">
      {/* 1. Minimal Top Navbar - Fades in softly after heart reveal begins */}
      <div className="animate-in fade-in duration-700 delay-500 fill-mode-backwards">
        <Navbar
          onOpenOverview={() => {
            setSelectedVessel(null);
            setActiveModal(null);
          }}
          onOpenAnalysis={() => setActiveModal("shap")}
          onOpenPatientData={() => setActiveModal("patient")}
          onOpenExplanations={() => setActiveModal("shap")}
          onOpenDoctorLogin={() => setIsDoctorLoginOpen(true)}
          doctorUser={doctorUser}
          onSignOut={handleSignOut}
          activeTab={activeModal ? (activeModal === "patient" ? "patient" : "analysis") : "overview"}
        />

        {/* Global Floating PDF Report Notification Toast */}
        {pdfToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              className={`p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${
                pdfToast.type === "success"
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                  : "bg-rose-50/95 border-rose-200 text-rose-900"
              } backdrop-blur-md`}
            >
              <div className="flex items-center gap-2 text-xs">
                {pdfToast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{pdfToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfToast(null)}
                className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Visualization Command Center (Fullscreen Desktop Composition) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-[4vw] sm:px-[5vw] py-1 sm:py-2.5 flex flex-col justify-between relative min-h-[calc(100vh-3.5rem)]">
        {/* Refined Medical HUD Connection Lines with Protected Safe Zone */}
        <ConnectionLines
          hoveredVessel={hoveredVessel}
          selectedVessel={selectedVessel}
          cameraDistance={cameraDistance}
        />

        {/* Central Visualization Layout: Square Box Framed & Overlapped by 4 Cards */}
        <div className="relative w-full flex-1 flex flex-col lg:flex-row items-center justify-center my-auto">
          
          {/* LEFT FRAMING COLUMN: CAD (Top Left) & LCX (Bottom Left) - 20-23vw */}
          <div className="w-full lg:w-[22vw] lg:min-w-[280px] lg:max-w-[340px] flex flex-col sm:flex-row lg:flex-col justify-between gap-4 z-30 lg:-mr-6 xl:-mr-8">
            {/* Top Left: CAD Card */}
            <div className="w-full">
              <CadCard
                isSelected={selectedVessel === "CAD"}
                onSelect={() => handleSelectVessel("CAD")}
                onHover={setHoveredVessel}
                onOpenPatientData={() => setActiveModal("patient")}
                probability={prediction ? prediction.predictions.CAD : null}
                riskLevel={prediction ? prediction.risk_levels.CAD : null}
              />
            </div>

            {/* Bottom Left: LCX Card */}
            <div className="w-full lg:mt-6 xl:mt-8">
              <LcxCard
                isSelected={selectedVessel === "LCX"}
                onSelect={() => handleSelectVessel("LCX")}
                onHover={setHoveredVessel}
                onOpenPatientData={() => setActiveModal("patient")}
                probability={prediction ? prediction.predictions.LCX : null}
                riskLevel={prediction ? prediction.risk_levels.LCX : null}
              />
            </div>
          </div>

          {/* CENTER: SQUARE BEVELED ENCLOSURE WITH 3D HUMAN HEART MODEL - 42-48vw, 65-72vh */}
          <div className="w-full lg:w-[46vw] lg:min-w-[500px] lg:max-w-[780px] 2xl:max-w-[840px] relative flex flex-col items-center justify-center my-2.5 lg:my-0 z-20">
            <HeartCanvas
              selectedVessel={selectedVessel}
              hoveredVessel={hoveredVessel}
              vesselRisk={vesselRisk}
              onSelectVessel={handleSelectVessel}
              onResetVessel={() => {
                setSelectedVessel(null);
                setCameraDistance(2.12);
              }}
              onCameraDistanceChange={setCameraDistance}
            />
          </div>

          {/* RIGHT FRAMING COLUMN: LAD (Top Right) & RCA (Bottom Right) - 20-23vw */}
          <div className="w-full lg:w-[22vw] lg:min-w-[280px] lg:max-w-[340px] flex flex-col sm:flex-row lg:flex-col justify-between gap-4 z-30 lg:-ml-6 xl:-ml-8">
            {/* Top Right: LAD Card */}
            <div className="w-full">
              <LadCard
                isSelected={selectedVessel === "LAD"}
                onSelect={() => handleSelectVessel("LAD")}
                onHover={setHoveredVessel}
                onOpenPatientData={() => setActiveModal("patient")}
                probability={prediction ? prediction.predictions.LAD : null}
                riskLevel={prediction ? prediction.risk_levels.LAD : null}
              />
            </div>

            {/* Bottom Right: RCA Card */}
            <div className="w-full lg:mt-6 xl:mt-8">
              <RcaCard
                isSelected={selectedVessel === "RCA"}
                onSelect={() => handleSelectVessel("RCA")}
                onHover={setHoveredVessel}
                onOpenPatientData={() => setActiveModal("patient")}
                probability={prediction ? prediction.predictions.RCA : null}
                riskLevel={prediction ? prediction.risk_levels.RCA : null}
              />
            </div>
          </div>
        </div>

        {/* 3. Bottom Center Status Card */}
        <div className="w-full mt-2 sm:mt-3 mb-1 z-10 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-[1600ms] fill-mode-backwards">
          <StatusCard
            onOpenPatientData={() => setActiveModal("patient")}
            onOpenExplanations={() => setActiveModal("shap")}
            onGenerateReport={handleGenerateReportFromDashboard}
            isGeneratingReport={isGeneratingPdf}
            predictionAvailable={!!prediction && !!activeAnalysis}
          />
        </div>
      </main>

      {/* 4. Small Minimal Regulatory Footer Disclaimer */}
      <Disclaimer />

      {/* ================================================================= */}
      {/* SECONDARY MODAL PANELS (Patient Data, SHAP, Doctor Login)        */}
      {/* ================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            {activeModal === "patient" && (
              <PatientForm
                onClose={() => setActiveModal(null)}
                onPredictionSuccess={(result) => setPrediction(result)}
              />
            )}
            {activeModal === "shap" && (
              <ShapExplanation 
                onClose={() => setActiveModal(null)} 
                prediction={prediction}
                defaultTarget={selectedVessel as any}
              />
            )}
          </div>
        </div>
      )}

      {/* Doctor Login Modal (available from navbar when in dashboard) */}
      <DoctorLoginModal
        isOpen={isDoctorLoginOpen}
        onClose={() => setIsDoctorLoginOpen(false)}
        onLoginSuccess={(name) => {
          setDoctorUser(name);
        }}
      />
    </div>
  );
}
