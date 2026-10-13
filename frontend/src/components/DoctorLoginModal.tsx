"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, Lock, User, X, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { getApiUrl } from "@/config/api";

interface DoctorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (doctorName: string) => void;
}

export default function DoctorLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: DoctorLoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsSigningIn(true);

    try {
      const response = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUser, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage("Invalid username or password");
        } else {
          setErrorMessage(`Authentication failed (HTTP ${response.status}).`);
        }
        setIsSigningIn(false);
        return;
      }

      const data = await response.json();
      const doctorDisplayName = data?.user?.name || `Dr. ${trimmedUser}`;
      setIsSigningIn(false);
      onLoginSuccess(doctorDisplayName);
      onClose();
    } catch {
      setErrorMessage("Unable to connect to authentication service.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/90 ring-1 ring-rose-100/70 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.1),0_12px_28px_-6px_rgba(15,23,42,0.06)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] ring-4 ring-rose-50 mb-3">
            <Activity className="w-7 h-7 animate-heartbeat-soft text-white" />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            Cardiac Risk Navigator
          </h2>

          <p className="text-[11px] font-bold text-rose-600 tracking-wide uppercase mt-1">
            AI-Powered Cardiovascular Risk Intelligence
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>DOCTOR PORTAL</span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Sign in to access your clinical workspace.
          </p>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50/95 border border-rose-200/90 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4" noValidate>
          <div>
            <label htmlFor="modal_username" className="block text-xs font-bold text-slate-700 mb-1.5">
              Clinical Username
            </label>
            <div className="relative group">
              <User
                className="w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="modal_username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all shadow-xs placeholder:text-slate-400"
                placeholder="Enter clinical username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="modal_password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative group">
              <Lock
                className="w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="modal_password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all shadow-xs placeholder:text-slate-400"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 focus:text-rose-600 focus:outline-none transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:via-rose-600 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(225,29,72,0.28)] hover:shadow-[0_8px_24px_rgba(225,29,72,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Prototype Regulatory Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] font-semibold text-slate-500">
            Research &amp; Educational Decision-Support Prototype
          </p>
        </div>
      </div>
    </div>
  );
}
