"use client";

import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Heart,
  Sparkles,
} from "lucide-react";

interface DoctorPortalScreenProps {
  onLoginSuccess: (doctorName: string) => void;
}

/**
 * Smooth, truly infinite physiological Lead II ECG waveform background.
 * Uses 6 seamless repeating 1000px blocks (6000px total width) translating by exactly -1000px,
 * ensuring no edge cuts or gaps even on ultra-wide screens up to 4K resolution.
 */
function EcgWaveformBackground() {
  // A single 200px physiological cardiac cycle (P wave, PR interval, QRS spike, ST segment, T wave)
  const singleCycle = (offset: number) => `
    L ${offset + 30} 40
    C ${offset + 38} 31, ${offset + 46} 31, ${offset + 54} 40
    L ${offset + 66} 40
    L ${offset + 72} 48
    L ${offset + 80} 8
    L ${offset + 88} 72
    L ${offset + 96} 40
    L ${offset + 118} 40
    C ${offset + 130} 24, ${offset + 148} 24, ${offset + 160} 40
    L ${offset + 200} 40
  `;

  // 5 full cardiac cycles = exactly 1000px block
  const blockPath = `
    M 0 40
    ${singleCycle(0)}
    ${singleCycle(200)}
    ${singleCycle(400)}
    ${singleCycle(600)}
    ${singleCycle(800)}
  `;

  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none opacity-45 sm:opacity-50 overflow-hidden select-none z-0"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <style>{`
        @keyframes ecgContinuousScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-1000px, 0, 0);
          }
        }
        .ecg-scroll-track {
          display: flex;
          width: 6000px;
          animation: ecgContinuousScroll 5.4s linear infinite !important;
          will-change: transform;
        }
      `}</style>

      <div className="ecg-scroll-track text-rose-500">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            viewBox="0 0 1000 80"
            className="w-[1000px] h-20 sm:h-24 shrink-0 drop-shadow-[0_0_4px_rgba(244,63,94,0.45)]"
            fill="none"
          >
            <path
              d={blockPath}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

export default function DoctorPortalScreen({ onLoginSuccess }: DoctorPortalScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUser,
          password: password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage("Invalid username or password");
        } else {
          setErrorMessage(`Authentication failed (HTTP ${response.status}).`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const doctorDisplayName = data?.user?.name || `Dr. ${trimmedUser}`;
      triggerTransition(doctorDisplayName);
    } catch {
      setErrorMessage("Unable to connect to authentication service. Ensure the backend is running on port 8000.");
      setIsLoading(false);
    }
  };

  const triggerTransition = (name: string) => {
    setIsTransitioning(true);
    // Smooth cinematic launch into the 3D application
    setTimeout(() => {
      onLoginSuccess(name);
    }, 700);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-700 p-4 sm:p-6 lg:p-8 relative overflow-x-hidden ${
        isTransitioning ? "bg-white" : "bg-[#FFF8F9]"
      }`}
    >
      {/* 1. Subtle Medical Precision Dot Grid Background Pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(225, 29, 72, 0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* 2. Soft Ambient Radial Pink Lighting Gradients */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-left ambient rose glow */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-rose-200/40 via-pink-100/25 to-transparent blur-3xl animate-ambient-glow" />

        {/* Bottom-right warm pink glow */}
        <div
          className="absolute -bottom-36 -right-36 w-[620px] h-[620px] rounded-full bg-gradient-to-tl from-pink-200/35 via-rose-100/20 to-transparent blur-3xl animate-ambient-glow"
          style={{ animationDelay: "3.5s" }}
        />

        {/* Central ambient glow softly focused behind the login card */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`rounded-[48px] transition-all duration-700 bg-gradient-to-tr from-rose-200/35 via-pink-100/30 to-rose-50/15 blur-3xl ${
              isTransitioning
                ? "w-[850px] h-[850px] opacity-100 scale-125"
                : "w-[540px] h-[560px] opacity-80 scale-100 animate-ambient-glow"
            }`}
          />
        </div>
      </div>

      {/* 3. Faint Horizontal ECG Waveform Across Background */}
      <EcgWaveformBackground />

      {/* 4. Small Floating Medical Particles / Glowing Points */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Particle 1: Top-left floating pulse node */}
        <div className="absolute top-[18%] left-[12%] w-2 h-2 rounded-full bg-rose-400/40 blur-[1px] animate-float-particle-1" />
        {/* Particle 2: Bottom-left floating glow */}
        <div className="absolute top-[74%] left-[16%] w-2.5 h-2.5 rounded-full bg-pink-300/45 blur-[1.5px] animate-float-particle-2" />
        {/* Particle 3: Top-right floating node */}
        <div className="absolute top-[22%] right-[14%] w-3 h-3 rounded-full bg-rose-300/35 blur-[1px] animate-float-particle-3" />
        {/* Particle 4: Bottom-right node */}
        <div className="absolute top-[78%] right-[20%] w-2 h-2 rounded-full bg-rose-400/30 blur-[1px] animate-float-particle-1" />
        {/* Particle 5: Subtle far-left micro node */}
        <div className="hidden sm:block absolute top-[48%] left-[6%] w-1.5 h-1.5 rounded-full bg-pink-400/35 blur-[0.5px] animate-float-particle-2" />
        {/* Particle 6: Subtle far-right micro node */}
        <div className="hidden sm:block absolute top-[52%] right-[7%] w-2 h-2 rounded-full bg-rose-300/35 blur-[1px] animate-float-particle-3" />
      </div>

      {/* Expanding Ripple Transition (on successful sign-in) */}
      {isTransitioning && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-40"
        >
          <div className="w-80 h-80 rounded-full border-2 border-rose-300/70 bg-rose-100/30 animate-portal-ripple" />
        </div>
      )}

      {/* 5. Minimal Top Brand & Security Header */}
      <header
        className={`max-w-6xl w-full mx-auto flex items-center justify-between z-10 py-1 sm:py-2 transition-opacity duration-400 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(225,29,72,0.25)]">
            <Activity className="w-4 h-4 animate-heartbeat-soft" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base leading-tight">
              Cardiac Risk Navigator
            </span>
            <span className="text-[10px] font-semibold text-rose-600/80 tracking-wide uppercase">
              Clinical Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Secure Clinical Portal</span>
            <span className="sm:hidden">Secure Portal</span>
          </div>
        </div>
      </header>

      {/* 6. Main Centered Premium Login Card */}
      <main className="max-w-[430px] w-full mx-auto my-auto z-10 py-4">
        <div
          className={`relative p-7 sm:p-9 rounded-[32px] sm:rounded-[36px] bg-white/85 sm:bg-white/90 backdrop-blur-xl sm:backdrop-blur-2xl border border-white/90 ring-1 ring-rose-100/70 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.08),0_12px_28px_-6px_rgba(15,23,42,0.04),inset_0_1.5px_2px_rgba(255,255,255,0.95)] transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-3 ${
            isTransitioning ? "scale-90 opacity-0 translate-y-3" : "scale-100 opacity-100 translate-y-0"
          }`}
        >
          {/* Card Top: Logo with Realistic Medical Heartbeat Animation */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] ring-4 ring-rose-50/90 mb-3.5 relative">
              <Activity className="w-7 h-7 sm:w-8 sm:h-8 animate-heartbeat-soft text-white" />
              {/* Subtle ambient aura ring behind heart */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-rose-400/25 blur-md pointer-events-none"
              />
            </div>

            {/* Exact Required Title & Subtitle Hierarchy */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Cardiac Risk Navigator
            </h1>

            <p className="text-[11px] sm:text-xs font-bold text-rose-600 tracking-wide uppercase mt-1">
              AI-Powered Cardiovascular Risk Intelligence
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs mt-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>DOCTOR PORTAL</span>
            </div>

            <p className="text-xs text-slate-500 mt-2 font-normal">
              Sign in to access your clinical workspace.
            </p>
          </div>

          {/* Tasteful Subtle Cardiac Visual: Physiological Lead II Telemetry Strip */}
          <div
            aria-label="Cardiac telemetry status: Normal Sinus Rhythm at 72 beats per minute"
            className="w-full mb-5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-50/60 via-pink-50/40 to-rose-50/60 border border-rose-100/70 flex items-center justify-between text-[11px] shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
              </span>
              <span className="font-semibold text-slate-700">Telemetry Active</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-rose-700">
              <Heart className="w-3.5 h-3.5 animate-heartbeat-soft text-rose-600 fill-rose-100" />
              <span>72 BPM • Sinus Rhythm</span>
            </div>
          </div>

          {/* Accessible Error Message Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-50/95 border border-rose-200/90 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-950">Authentication Notice</span>
                <span className="font-medium text-rose-800">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username Input */}
            <div>
              <label
                htmlFor="portal_username"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Clinical Username
              </label>
              <div className="relative group">
                <User
                  className="w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="portal_username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200/90 bg-white/75 hover:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all shadow-xs"
                  placeholder="Enter clinical username"
                  disabled={isLoading || isTransitioning}
                  required
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="portal_password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <Lock
                  className="w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="portal_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-slate-200/90 bg-white/75 hover:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all shadow-xs"
                  placeholder="Enter password"
                  disabled={isLoading || isTransitioning}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading || isTransitioning}
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

            {/* Sign-In Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isTransitioning}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:via-rose-600 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(225,29,72,0.28)] hover:shadow-[0_8px_24px_rgba(225,29,72,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : isTransitioning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Launching 3D Navigator...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Prototype Notice & Disclaimers */}
          <div className="mt-6 pt-4 border-t border-slate-100/90 text-center">
            <p className="text-[11px] font-semibold text-slate-600">
              Research &amp; Educational Decision-Support Prototype
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Investigational AI • For Authorized Clinical Staff Only
            </p>
          </div>
        </div>
      </main>

      {/* 7. Polished Restrained Regulatory Footer */}
      <footer
        className={`max-w-5xl w-full mx-auto text-center z-10 py-2 sm:py-3 px-4 transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[11px] text-slate-400 font-medium">
          <span>Cardiac Risk Navigator</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Research &amp; Educational Decision-Support Prototype</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-slate-400">Explainable Multi-Vessel CAD AI</span>
        </div>
      </footer>
    </div>
  );
}
