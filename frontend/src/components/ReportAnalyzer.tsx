"use client";

import React, { useState, useRef } from "react";
import { FileText, X, File as FileIcon, Loader2, Upload, Cpu } from "lucide-react";
import type { ModelColumn } from "@/types/patient";
import { getApiUrl } from "@/config/api";

export interface ExtractionResult {
  extracted_features: Record<string, { value: any, status: string, source_text: string }>;
  missing_features: string[];
  uncertain_features: string[];
  extraction_sources: Record<string, string>;
  warnings: string[];
}

interface ReportAnalyzerProps {
  onExtractionComplete?: (data: ExtractionResult) => void;
}

export default function ReportAnalyzer({ onExtractionComplete }: ReportAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extractingData, setExtractingData] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setExtractedText(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(getApiUrl("/extract-text"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        setError(errData?.detail || `Error extracting text (HTTP ${response.status})`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setExtractedText(data.extracted_text);
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractClinicalData = async () => {
    if (!extractedText) return;
    setExtractingData(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl("/extract-clinical-data"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        setError(errData?.detail || `Error extracting clinical data (HTTP ${response.status})`);
        setExtractingData(false);
        return;
      }

      const data: ExtractionResult = await response.json();
      if (onExtractionComplete) {
        onExtractionComplete(data);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setExtractingData(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            AI Patient Report Analyzer
          </h2>
          <p className="text-xs text-slate-500">
            Upload clinical reports (PDF, DOCX, TXT) to preview text extraction.
          </p>
        </div>
      </div>

      {!file ? (
        <div 
          className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-rose-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Click to upload document</p>
          <p className="text-xs text-slate-400">PDF, DOCX, or TXT (Max 5MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".txt,.pdf,.docx" 
            onChange={handleFileChange} 
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <FileIcon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setExtractedText(null); setError(null); }}
              className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!extractedText && (
            <button
              onClick={handleExtract}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Extracting...</span>
                </>
              ) : (
                <span>Extract Text</span>
              )}
            </button>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          {extractedText && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Extracted Text Preview</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto whitespace-pre-wrap text-xs text-slate-600 font-mono mb-4">
                {extractedText}
              </div>
              
              <button
                onClick={handleExtractClinicalData}
                disabled={extractingData}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                {extractingData ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Clinical Data...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-emerald-200" />
                    <span>Extract Clinical Data</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
