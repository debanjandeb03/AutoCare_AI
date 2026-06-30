/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RadialGauge } from "./TelemetryGauges";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Sliders, Activity, Hammer, Zap, Play } from "lucide-react";
import { FaultTelemetry, FaultDiagnostic } from "../types";

interface FaultModuleProps {
  telemetry: FaultTelemetry & FaultDiagnostic;
  onUpdateTelemetry: (data: Partial<FaultTelemetry>) => void;
  onAnalyzeWithAI: () => void;
}

export default function FaultModule({ telemetry, onUpdateTelemetry, onAnalyzeWithAI }: FaultModuleProps) {
  
  const handleSliderChange = (key: keyof FaultTelemetry, value: number) => {
    onUpdateTelemetry({ [key]: value });
  };

  // Generate dynamic wave nodes for vibrational FFT / oscilloscope graph
  const generateOscilloscopeData = () => {
    const pointsCount = 40;
    const amplitude = telemetry.vibration; // 0 to 10 scale
    const rpm = telemetry.rpm;

    // Morph the wave: standard clean sine wave + noise/harmonics depending on raw amplitude
    return Array.from({ length: pointsCount }, (_, i) => {
      const angle1 = (i / pointsCount) * Math.PI * 6; // base frequency
      const angle2 = (i / pointsCount) * Math.PI * 18; // 3rd harmonic
      const angle3 = (i / pointsCount) * Math.PI * 32; // high noise harmonic

      // Low vibration = pure smooth low sine wave
      // High vibration = multi-frequency overlapping high peaks
      const baseWave = Math.sin(angle1) * (amplitude * 0.7);
      const harmonicNoise = amplitude > 2.0 ? Math.sin(angle2) * (amplitude * 0.25) : 0;
      const criticalDistortion = amplitude > 5.0 ? Math.cos(angle3) * (amplitude * 0.15) : 0;

      const rawReading = baseWave + harmonicNoise + criticalDistortion;
      
      return {
        sample: i,
        vibe: Number(rawReading.toFixed(2)),
        // Upper limits
        threshold: 4.5,
        critical: 6.5,
      };
    });
  };

  const waveData = generateOscilloscopeData();

  // Color mapping based on severity
  const getSeverityColors = (sev: string) => {
    switch (sev) {
      case "NONE":
        return { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-400" };
      case "MINOR":
        return { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", dot: "bg-cyan-400" };
      case "MODERATE":
        return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" };
      case "SEVERE":
        return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-500" };
      case "CRITICAL":
        return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500 animate-pulse" };
      default:
        return { bg: "bg-[#0f0f11]", border: "border-white/10", text: "text-gray-400", dot: "bg-gray-500" };
    }
  };

  const severityStyle = getSeverityColors(telemetry.severity);

  // Convert raw amplitude to percent for gauge
  const displayGaugeValue = Math.min(100, Math.round((telemetry.vibration / 10) * 100));

  return (
    <div className="flex flex-col gap-6">
      
      {/* Overview Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gauge Card */}
        <div className="lg:col-span-1">
          <RadialGauge 
            value={displayGaugeValue}
            label="Drivetrain Harmonic Energy"
            sublabel="Vibrational G-force amplitude"
            unit="G_RMS"
            colorType="vibration"
            risk={telemetry.severity}
          />
        </div>

        {/* Diagnostic Status */}
        <div className="lg:col-span-2 bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs font-mono tracking-wider uppercase">OBD FFT Analyzer</h3>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${severityStyle.dot}`} />
              <span className={`font-bold text-lg font-sans ${severityStyle.text}`}>
                {telemetry.faultType}
              </span>
            </div>
            
            <p className="text-gray-300 font-mono text-xs leading-relaxed mt-1 bg-[#050505]/60 p-4 rounded-xl border border-white/5">
              <span className="text-gray-400 font-bold block uppercase mb-1">CORRECTIVE MAINTENANCE DIRECTIVE:</span>
              {telemetry.action}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between border-t border-white/5 pt-4 mt-4">
            <div className="flex gap-4 text-xs font-mono text-gray-500">
              <div>
                <span className="text-gray-400 block">VIBE VELOCITY</span>
                <span className="text-white font-bold text-sm">{telemetry.vibration.toFixed(2)} mm/s²</span>
              </div>
              <div>
                <span className="text-gray-400 block">FREQUENCY SPEED</span>
                <span className="text-white font-bold text-sm">{(telemetry.rpm / 60).toFixed(1)} Hz</span>
              </div>
              <div>
                <span className="text-gray-400 block">CRITICAL THRESHOLD</span>
                <span className="text-rose-400 font-bold text-sm">6.50 mm/s²</span>
              </div>
            </div>

            <button
              onClick={onAnalyzeWithAI}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
            >
              <Hammer className="w-3.5 h-3.5" />
              HARMONIC STRESS DIAGNOSTIC
            </button>
          </div>
        </div>

      </div>

      {/* Inputs vs Map & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Sliders Control Panel */}
        <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">Vibration & Chassis Emulator</h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Vibration */}
            <div className="flex flex-col gap-1.5" id="slider-vibration">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Accelerometer Peak G (Vibration Amplitude)</span>
                <span className={`font-bold ${telemetry.vibration > 6.0 ? "text-rose-400" : "text-white"}`}>
                  {telemetry.vibration.toFixed(1)} mm/s²
                </span>
              </div>
              <input 
                type="range" 
                min="0.2" 
                max="10.0" 
                step="0.1"
                value={telemetry.vibration}
                onChange={(e) => handleSliderChange("vibration", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0.2 (Electric Flatline)</span>
                <span>2.0 (Standard Road NVH)</span>
                <span>10.0 (Severe Chassis Misfire)</span>
              </div>
            </div>

            {/* RPM */}
            <div className="flex flex-col gap-1.5" id="slider-fault-rpm">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Rotational Freq Core (RPM)</span>
                <span className="text-white font-bold">{telemetry.rpm} RPM</span>
              </div>
              <input 
                type="range" 
                min="800" 
                max="7500" 
                value={telemetry.rpm}
                onChange={(e) => handleSliderChange("rpm", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>800 RPM (13.3 Hz)</span>
                <span>3500 RPM (58.3 Hz)</span>
                <span>7500 RPM (125.0 Hz)</span>
              </div>
            </div>

            {/* Speed */}
            <div className="flex flex-col gap-1.5" id="slider-speed">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Vehicle Velocity (Speed)</span>
                <span className="text-white font-bold">{telemetry.speed} km/h</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="250" 
                value={telemetry.speed}
                onChange={(e) => handleSliderChange("speed", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0 km/h (Stationary)</span>
                <span>100 km/h (Cruising)</span>
                <span>250 km/h (Track Top-Speed)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Real-time Oscilloscope Grid */}
        <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">Active Vibrational Wave Scope</h3>
            </div>
            
            <div className="h-[180px] w-full text-gray-300 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={waveData}>
                  <defs>
                    <linearGradient id="vibeWave" cx="0" cy="0" r="1" fx="0" fy="0" tz="0" gradientUnits="userSpaceOnUse">
                      <stop offset="5%" stopColor={telemetry.vibration > 6.0 ? "#f43f5e" : telemetry.vibration > 3.0 ? "#f59e0b" : "#22d3ee"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={telemetry.vibration > 6.0 ? "#f43f5e" : telemetry.vibration > 3.0 ? "#f59e0b" : "#22d3ee"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="sample" hide />
                  <YAxis domain={[-10, 10]} stroke="#71717a" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#050505", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelClassName="text-white font-bold text-xs"
                  />
                  <Area 
                    name="Resonance Amplitude" 
                    type="monotone" 
                    dataKey="vibe" 
                    stroke={telemetry.vibration > 6.0 ? "#f43f5e" : telemetry.vibration > 3.0 ? "#f59e0b" : "#22d3ee"} 
                    fillOpacity={1} 
                    fill="url(#vibeWave)" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#050505]/60 p-3.5 rounded-xl border border-white/5 text-[11px] text-gray-500 font-mono mt-3">
            <span className="text-gray-300 font-bold block uppercase mb-1">Harmonic Vibration Analysis</span>
            The wave visualizes structural acceleration forces (G_RMS). Pure sine waveforms represent balanced tire-drivetrain vectors, whereas overlapping multi-node jagged peaks represent physical misalignments, misfires, or crankshaft fractures.
          </div>
        </div>

      </div>

    </div>
  );
}
