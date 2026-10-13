"use client";

import React, { useMemo, useState } from "react";
import {
  User,
  Activity,
  Droplet,
  Sparkles,
  CheckCircle2,
  Sliders,
  X,
  ChevronDown,
  AlertTriangle,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Waves,
  FlaskConical,
  Lock,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldAlert,
  FileDown,
} from "lucide-react";
import {
  BBB_OPTIONS,
  FIELD_SPECS,
  FORM_SECTIONS,
  SEX_OPTIONS,
  VHD_OPTIONS,
  type FieldSpec,
} from "@/config/patientSchema";
import ReportAnalyzer, { type ExtractionResult } from "./ReportAnalyzer";
import {
  buildModelPayload,
  createEmptyPatient,
  createSamplePatient,
  parseNumericDraft,
  validatePatient,
} from "@/utils/buildModelPayload";
import { downloadCardiacPdfReport } from "@/utils/generatePdfReport";
import { setSharedActiveAnalysis } from "@/utils/predictionStore";
import {
  MODEL_COLUMNS,
  type BBBUiValue,
  type ContinuousColumn,
  type FieldIssue,
  type ModelColumn,
  type NumericDrafts,
  type PatientInput,
  type PredictionResponse,
  type RiskLevel,
  type SexValue,
  type VHDUiValue,
  type YesNo,
} from "@/types/patient";

interface PatientFormProps {
  onClose?: () => void;
  onPredictionSuccess?: (res: PredictionResponse) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  demographics: <User className="w-4 h-4" />,
  history: <ClipboardList className="w-4 h-4" />,
  vitals: <Stethoscope className="w-4 h-4" />,
  symptoms: <HeartPulse className="w-4 h-4" />,
  ecg: <Activity className="w-4 h-4" />,
  laboratory: <FlaskConical className="w-4 h-4" />,
  echo: <Waves className="w-4 h-4" />,
};

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition";

const fieldId = (col: ModelColumn) => `pf_${col.replace(/\W+/g, "_")}`;

function formatBound(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  groupLabel,
}: {
  options: readonly T[];
  value: T | "";
  onChange: (v: T) => void;
  groupLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={groupLabel} className="grid grid-flow-col auto-cols-fr gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`py-1.5 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
            value === option
              ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function getRiskBadge(level: RiskLevel) {
  switch (level) {
    case "HIGH":
      return {
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        bar: "from-rose-500 to-red-600",
        label: "HIGH RISK",
      };
    case "MODERATE":
      return {
        bg: "bg-amber-100 text-amber-800 border-amber-200",
        bar: "from-amber-400 to-orange-500",
        label: "MODERATE RISK",
      };
    case "LOW":
      return {
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        bar: "from-emerald-400 to-teal-500",
        label: "LOW RISK",
      };
  }
}

const VESSEL_LABELS: Record<string, { title: string; subtitle: string }> = {
  CAD: {
    title: "CAD Overall",
    subtitle: "Predicted positive-class probability",
  },
  LAD: {
    title: "LAD Artery",
    subtitle: "Predicted stenosis probability",
  },
  LCX: {
    title: "LCX Artery",
    subtitle: "Predicted stenosis probability",
  },
  RCA: {
    title: "RCA Artery",
    subtitle: "Predicted stenosis probability",
  },
};

export default function PatientForm({ onClose, onPredictionSuccess }: PatientFormProps) {
  const [form, setForm] = useState<PatientInput>(() => createEmptyPatient());
  const [drafts, setDrafts] = useState<NumericDrafts>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[] | null>(null);
  const [extractionData, setExtractionData] = useState<ExtractionResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FORM_SECTIONS.map((s) => [s.id, true]))
  );

  const issues = useMemo(() => validatePatient(form, drafts), [form, drafts]);
  const issueByColumn = useMemo(() => {
    const map = new Map<ModelColumn, FieldIssue>();
    issues.forEach((i) => map.set(i.column, i));
    return map;
  }, [issues]);

  const blocking = issues.filter((i) => i.severity === "required" || i.severity === "invalid");
  const warnings = issues.filter((i) => i.severity === "range");
  const filledCount = 55 - blocking.length;

  const resetStatus = () => {
    setApiError(null);
    setFieldErrors(null);
    setPdfError(null);
  };

  const setValue = <K extends ModelColumn>(col: K, value: PatientInput[K]) => {
    setForm((prev) => ({ ...prev, [col]: value }));
    resetStatus();
  };

  const handleNumberChange = (col: ContinuousColumn, text: string) => {
    setDrafts((prev) => ({ ...prev, [col]: text }));
    setForm((prev) => ({ ...prev, [col]: parseNumericDraft(text) }));
    resetStatus();
  };

  const handleReset = () => {
    setForm(createEmptyPatient());
    setDrafts({});
    setSubmitted(false);
    setPredictionResult(null);
    setSharedActiveAnalysis(null);
    setPdfSuccess(null);
    setPdfError(null);
    resetStatus();
  };

  const handleLoadSample = () => {
    const { patient, drafts: sampleDrafts } = createSamplePatient();
    setForm(patient);
    setDrafts(sampleDrafts);
    setSubmitted(false);
    setPredictionResult(null);
    setExtractionData(null);
    setSharedActiveAnalysis(null);
    setPdfSuccess(null);
    setPdfError(null);
    resetStatus();
  };

  const handleExtractionComplete = (data: ExtractionResult) => {
    setExtractionData(data);
    const newForm = { ...form };
    const newDrafts = { ...drafts };
    
    // Auto-expand sections that have extracted data
    setAllSections(true);

    for (const [key, item] of Object.entries(data.extracted_features)) {
      if (key in newForm) {
        (newForm as any)[key] = item.value;
        if (typeof item.value === "number" || !isNaN(Number(item.value))) {
          (newDrafts as any)[key] = String(item.value);
        }
      }
    }
    
    setForm(newForm);
    setDrafts(newDrafts);
  };

  const handleGeneratePdf = async () => {
    if (!predictionResult || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfError(null);
    setPdfSuccess(null);

    try {
      let payload: Record<string, string | number>;
      try {
        payload = buildModelPayload(form);
      } catch (err: any) {
        setPdfError(err?.message || "Incomplete patient data for PDF report.");
        setIsGeneratingPdf(false);
        return;
      }

      const providedFeatures: string[] = [];
      for (const col of MODEL_COLUMNS) {
        if (extractionData && extractionData.extracted_features[col]) {
          providedFeatures.push(col);
        } else if ((form as any)[col] !== null && (form as any)[col] !== "") {
          providedFeatures.push(col);
        }
      }

      const doctorUser =
        (typeof window !== "undefined" && window.sessionStorage.getItem("cardiac_auth_user")) ||
        "Dr. Saikrish (Cardiology)";

      const res = await downloadCardiacPdfReport({
        features: payload,
        provided_features: providedFeatures,
        extraction_sources: extractionData?.extraction_sources,
        doctor_user: doctorUser,
        predictions: predictionResult.predictions,
        risk_levels: predictionResult.risk_levels,
        explanations: predictionResult.explanations,
        shap_scales: predictionResult.shap_scales,
      });

      setPdfSuccess(res.filename);
    } catch (err: any) {
      setPdfError(err?.message || "Failed to generate cardiac PDF report.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);
    resetStatus();

    if (blocking.length > 0) return;

    let payload: Record<string, string | number>;
    try {
      payload = buildModelPayload(form);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to construct model payload.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: payload }),
      });

      if (!response.ok) {
        if (response.status === 422) {
          const data = await response.json().catch(() => null);
          const errList: string[] = Array.isArray(data?.detail?.errors)
            ? data.detail.errors
            : [data?.detail?.message || "Input validation failed on server."];
          setFieldErrors(errList);
          setApiError("Backend validation rejected input.");
        } else if (response.status >= 500) {
          setApiError("Prediction service encountered an error.");
        } else {
          setApiError(`Prediction request failed (HTTP ${response.status}).`);
        }
        return;
      }

      const result: PredictionResponse = await response.json();
      setPredictionResult(result);

      // Save active analysis for cross-component report generation
      const providedFeatures: string[] = [];
      for (const col of MODEL_COLUMNS) {
        if (extractionData && extractionData.extracted_features[col]) {
          providedFeatures.push(col);
        } else if ((form as any)[col] !== null && (form as any)[col] !== "") {
          providedFeatures.push(col);
        }
      }

      const doctorUser =
        (typeof window !== "undefined" && window.sessionStorage.getItem("cardiac_auth_user")) ||
        "Dr. Saikrish (Cardiology)";

      setSharedActiveAnalysis({
        prediction: result,
        features: payload,
        provided_features: providedFeatures,
        extraction_sources: extractionData?.extraction_sources,
        doctor_user: doctorUser,
        timestamp: new Date().toISOString(),
      });

      if (onPredictionSuccess) {
        onPredictionSuccess(result);
      }
    } catch {
      setApiError("Unable to connect to prediction service.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const setAllSections = (open: boolean) =>
    setOpenSections(Object.fromEntries(FORM_SECTIONS.map((s) => [s.id, open])));

  const renderControl = (col: ModelColumn, spec: FieldSpec) => {
    const id = fieldId(col);
    const values = form as unknown as Record<ModelColumn, number | string | null>;
    const value = values[col];

    switch (spec.kind) {
      case "number":
        return (
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={(drafts as Partial<Record<string, string>>)[col] ?? ""}
            onChange={(e) => handleNumberChange(col as ContinuousColumn, e.target.value)}
            placeholder={`${formatBound(spec.range[0])}–${formatBound(spec.range[1])}`}
            className={inputClass}
          />
        );
      case "code":
        return (
          <select
            id={id}
            value={value === null ? "" : String(value)}
            onChange={(e) =>
              setValue(col as "Function Class", e.target.value === "" ? null : Number(e.target.value))
            }
            className={inputClass}
          >
            <option value="">Select code…</option>
            {spec.codes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        );
      case "yesno":
        return (
          <SegmentedChoice<"Yes" | "No">
            groupLabel={spec.label}
            options={["Yes", "No"]}
            value={(value as YesNo) === "" ? "" : (value as "Yes" | "No")}
            onChange={(v) => setValue(col as "DM", v)}
          />
        );
      case "sex":
        return (
          <SegmentedChoice<"Male" | "Female">
            groupLabel="Sex"
            options={SEX_OPTIONS}
            value={value as SexValue as "Male" | "Female" | ""}
            onChange={(v) => setValue("Sex", v)}
          />
        );
      case "bbb":
        return (
          <select
            id={id}
            value={value as BBBUiValue}
            onChange={(e) => setValue("BBB", e.target.value as BBBUiValue)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {BBB_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "vhd":
        return (
          <select
            id={id}
            value={value as VHDUiValue}
            onChange={(e) => setValue("VHD", e.target.value as VHDUiValue)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {VHD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "constantNo":
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/70 text-xs sm:text-sm text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>No</span>
          </div>
        );
    }
  };

  const renderField = (col: ModelColumn) => {
    const spec = FIELD_SPECS[col];
    const issue = issueByColumn.get(col);
    const showIssue =
      issue && (issue.severity === "range" || issue.severity === "invalid" || submitted);
    const isWide = spec.kind === "constantNo";
    
    const isExtracted = extractionData?.extracted_features?.[col];
    const isUncertain = extractionData?.uncertain_features?.includes(col);
    const isMissing = extractionData?.missing_features?.includes(col);

    return (
      <div 
        key={col} 
        className={`${isWide ? "sm:col-span-2" : ""} ${isUncertain ? "p-3 bg-amber-50 rounded-xl border border-amber-200" : ""}`} 
        data-model-column={col}
      >
        <label htmlFor={fieldId(col)} className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>
            {spec.label}
            {spec.kind === "number" && spec.hint && (
              <span className="text-slate-400 font-normal"> · {spec.hint.replace("Model column: ", "")}</span>
            )}
          </span>
          {isExtracted && !isUncertain && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold tracking-wider uppercase">Extracted</span>
          )}
          {isUncertain && (
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Review
            </span>
          )}
          {isMissing && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold tracking-wider uppercase">Missing</span>
          )}
        </label>
        {renderControl(col, spec)}
        {spec.kind === "constantNo" && (
          <p className="mt-1 text-[11px] text-slate-400">{spec.note}</p>
        )}
        {isExtracted && isExtracted.source_text && (
          <p className="mt-1.5 text-[10px] text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-100 italic truncate" title={isExtracted.source_text}>
            "{isExtracted.source_text}"
          </p>
        )}
        {showIssue && issue && (
          <p
            className={`mt-1 text-[11px] leading-snug flex items-start gap-1 ${
              issue.severity === "range" ? "text-amber-600" : "text-rose-600"
            }`}
          >
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{issue.message}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Patient Clinical Information
            </h2>
            <p className="text-xs text-slate-500">
              55 model input features for multi-vessel CAD risk stratification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            Load sample patient
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
          >
            Clear form
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              aria-label="Close patient form"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Patient Report Analyzer Workflow (Stage 1 & 2) */}
      <ReportAnalyzer onExtractionComplete={handleExtractionComplete} />
      
      {extractionData && (
        <div className="mb-6 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-indigo-900">Extraction Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 border border-indigo-50 text-center">
              <p className="text-2xl font-black text-emerald-600">{Object.keys(extractionData.extracted_features).length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Extracted</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-50 text-center">
              <p className="text-2xl font-black text-amber-500">{extractionData.uncertain_features.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Need Review</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-50 text-center">
              <p className="text-2xl font-black text-slate-400">{extractionData.missing_features.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Missing</p>
            </div>
          </div>
          {extractionData.warnings.length > 0 && (
            <div className="mt-3 p-2 bg-amber-100/50 rounded-lg text-xs text-amber-800 flex flex-col gap-1">
              {extractionData.warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress + expand controls */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>
              {filledCount} / 55 fields complete
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-300"
              style={{ width: `${(filledCount / 55) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <button type="button" onClick={() => setAllSections(true)} className="hover:text-rose-600 cursor-pointer">
            Expand all
          </button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={() => setAllSections(false)} className="hover:text-rose-600 cursor-pointer">
            Collapse all
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3">
          {FORM_SECTIONS.map((section) => {
            const isOpen = openSections[section.id];
            const missingInSection = section.columns.filter((c) => {
              const i = issueByColumn.get(c);
              return i && (i.severity === "required" || i.severity === "invalid");
            }).length;
            const done = section.columns.length - missingInSection;

            return (
              <section
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 hover:bg-rose-50/40 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                      {SECTION_ICONS[section.id] ?? <Droplet className="w-4 h-4" />}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">{section.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        done === section.columns.length
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-500 border-slate-200"
                      }`}
                    >
                      {done}/{section.columns.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    {section.columns.map((col) => renderField(col))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Out-of-range summary */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {warnings.length} value{warnings.length > 1 ? "s are" : " is"} outside the training-data
              range. Values are preserved as entered; predictions may be less reliable.
            </span>
          </div>
        )}

        {/* Submit action */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Submits 55 validated patient features to FastAPI machine learning inference service.
            </span>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing patient...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>Analyze Cardiac Risk</span>
              </>
            )}
          </button>
        </div>

        {/* Form validation error prompt */}
        {submitted && blocking.length > 0 && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              {blocking.length} field{blocking.length > 1 ? "s need" : " needs"} attention before analysis:{" "}
              <span className="font-mono text-rose-800">{blocking.map((b) => b.column).join(", ")}</span>
            </span>
          </div>
        )}

        {/* API connection / validation errors */}
        {apiError && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{apiError}</p>
              {fieldErrors && fieldErrors.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-rose-700 font-mono space-y-0.5">
                  {fieldErrors.map((fe, idx) => (
                    <li key={idx}>{fe}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* REAL PREDICTION RESULT CARD */}
        {predictionResult && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Model Prediction Results &amp; Explanations
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Inference Complete
                </span>
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 transition-all cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5 text-white" />
                      <span>Generate PDF Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Success notification banner */}
            {pdfSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Clinical Report Downloaded:</strong> {pdfSuccess}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfSuccess(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] cursor-pointer ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Error notification banner */}
            {pdfError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Report Generation Notice:</strong> {pdfError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfError(null)}
                  className="text-rose-700 hover:text-rose-900 font-semibold text-[11px] cursor-pointer ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 4 Multi-vessel Prediction Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["CAD", "LAD", "LCX", "RCA"] as const).map((target) => {
                const prob = predictionResult.predictions[target];
                const risk = predictionResult.risk_levels[target];
                const badge = getRiskBadge(risk);
                const info = VESSEL_LABELS[target];
                const pct = (prob * 100).toFixed(1);
                const topFeatures = predictionResult.explanations[target] ?? [];

                return (
                  <div
                    key={target}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Vessel Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-900">{info.title}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">{info.subtitle}</p>

                      {/* Probability metric */}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          {pct}%
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({prob.toFixed(4)})
                        </span>
                      </div>

                      {/* Probability bar */}
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                        <div
                          className={`h-full bg-gradient-to-r ${badge.bar} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(2, prob * 100))}%` }}
                        />
                      </div>

                      {/* Top SHAP Contributors */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>Top Contributors</span>
                          <span className="text-[9px] font-normal text-slate-400">
                            {predictionResult.shap_scales?.[target] === "log_odds"
                              ? "log-odds"
                              : "probability scale"}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {topFeatures.slice(0, 4).map((f, fIdx) => {
                            const isPositive = f.shap_value >= 0;
                            return (
                              <li
                                key={fIdx}
                                className="flex items-center justify-between text-xs py-0.5"
                              >
                                <span className="text-slate-700 truncate pr-1 text-[11px]" title={f.feature}>
                                  {f.feature}
                                </span>
                                <span
                                  className={`flex items-center font-mono font-semibold text-[11px] shrink-0 ${
                                    isPositive ? "text-rose-600" : "text-emerald-600"
                                  }`}
                                >
                                  {isPositive ? (
                                    <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                                  )}
                                  {isPositive ? `+${f.shap_value.toFixed(4)}` : f.shap_value.toFixed(4)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note & Disclaimers */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="italic">
                {predictionResult.note}
              </p>
              <p className="text-slate-400 text-[10px]">
                Visualization tiers: LOW (&lt;0.45) · MODERATE (0.45–0.75) · HIGH (≥0.75). Not physical blockage percentages.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
