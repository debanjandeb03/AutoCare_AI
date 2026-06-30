/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RadialGauge } from "./TelemetryGauges";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Sliders, HelpCircle, Activity, Play } from "lucide-react";
import { EngineTelemetry, EngineDiagnostic } from "../types";

interface EngineModuleProps {
  telemetry: EngineTelemetry & EngineDiagnostic;
  onUpdateTelemetry: (data: Partial<EngineTelemetry>) => void;
  onAnalyzeWithAI: () => void;
}

export default function EngineModule({ telemetry, onUpdateTelemetry, onAnalyzeWithAI }: EngineModuleProps) {
  
  const handleSliderChange = (key: keyof EngineTelemetry, value: number) => {
    onUpdateTelemetry({ [key]: value });
  };

  // Generate data points for the power curve chart (Torque/RPM relation based on actual math)
  const powerCurveData = Array.from({ length: 12 }, (_, i) => {
    const rpm = 1000 + i * 500;
    // Standard engine power curve approximation: Torque drops at very high RPM, peaks in middle
    const baseTorque = telemetry.torque;
    const peakRpm = 4500;
    const factor = 1 - Math.pow((rpm - peakRpm) / 4500, 2);
    const simulatedTorque = Math.max(20, Math.round(baseTorque * Math.max(0.3, factor)));
    const horsepower = Math.round((simulatedTorque * rpm) / 5252);

    return {
      rpm: `${rpm}`,
      torque: simulatedTorque,
      power: horsepower,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gauge Card */}
        <div className="lg:col-span-1">
          <RadialGauge 
            value={telemetry.score}
            label="Engine Core Score"
            sublabel="Combined structural & thermal diagnostic"
            unit="PCT"
            colorType="engine"
            risk={telemetry.risk}
          />
        </div>

        {/* Diagnostic readout */}
        <div className="lg:col-span-2 bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs font-mono tracking-wider uppercase">ECU Status Report</h3>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full animate-pulse ${
                telemetry.risk === "LOW" ? "bg-cyan-400" :
                telemetry.risk === "MEDIUM" ? "bg-amber-500" : "bg-rose-500"
              }`} />
              <span className="text-white font-bold text-lg font-sans">
                {telemetry.risk === "LOW" ? "Drivetrain Nominal" :
                 telemetry.risk === "MEDIUM" ? "Maintenance Advised" : "CRITICAL WARNING"}
              </span>
            </div>
            
            <p className="text-gray-300 font-mono text-xs leading-relaxed mt-1 bg-[#050505]/60 p-4 rounded-xl border border-white/5">
              {telemetry.recommendation}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between border-t border-white/5 pt-4 mt-4">
            <div className="flex gap-4 text-xs font-mono text-gray-500">
              <div>
                <span className="text-gray-400 block">TEMP DELTA</span>
                <span className="text-white font-bold text-sm">{(telemetry.processTemp - telemetry.airTemp).toFixed(1)} °C</span>
              </div>
              <div>
                <span className="text-gray-400 block">WEAR INDEX</span>
                <span className={`font-bold text-sm ${telemetry.toolWear > 150 ? "text-rose-400" : "text-gray-300"}`}>{telemetry.toolWear} min</span>
              </div>
              <div>
                <span className="text-gray-400 block">POWER INDEX</span>
                <span className="text-white font-bold text-sm">{Math.round((telemetry.torque * telemetry.rotationalSpeed) / 5252)} HP</span>
              </div>
            </div>

            <button
              onClick={onAnalyzeWithAI}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              RUN AI COPILOT REPORT
            </button>
          </div>
        </div>
      </div>

      {/* Inputs vs Output Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Telemetry Sliders Cockpit */}
        <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">Drivetrain Sensor Emulation</h3>
          </div>

          <div className="flex flex-col gap-5">
            {/* Air Temp */}
            <div className="flex flex-col gap-1.5" id="slider-air-temp">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Intake Air Temp (T_air)</span>
                <span className="text-white font-bold">{telemetry.airTemp} °C</span>
              </div>
              <input 
                type="range" 
                min="-10" 
                max="50" 
                value={telemetry.airTemp}
                onChange={(e) => handleSliderChange("airTemp", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>-10°C (Arctic)</span>
                <span>25°C (Ambient)</span>
                <span>50°C (Desert)</span>
              </div>
            </div>

            {/* Process Temp */}
            <div className="flex flex-col gap-1.5" id="slider-process-temp">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Block Cylinder Temp (T_proc)</span>
                <span className={`font-bold ${telemetry.processTemp > 100 ? "text-rose-400" : "text-white"}`}>
                  {telemetry.processTemp} °C
                </span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="130" 
                value={telemetry.processTemp}
                onChange={(e) => handleSliderChange("processTemp", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>40°C (Warmup)</span>
                <span>90°C (Optimal)</span>
                <span>130°C (Meltdown)</span>
              </div>
            </div>

            {/* Rotational Speed */}
            <div className="flex flex-col gap-1.5" id="slider-rotational-speed">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Rotational Speed (RPM)</span>
                <span className={`font-bold ${telemetry.rotationalSpeed > 6000 ? "text-rose-400" : "text-white"}`}>
                  {telemetry.rotationalSpeed} RPM
                </span>
              </div>
              <input 
                type="range" 
                min="800" 
                max="7500" 
                value={telemetry.rotationalSpeed}
                onChange={(e) => handleSliderChange("rotationalSpeed", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>800 RPM (Idle)</span>
                <span>4000 RPM (Cruise)</span>
                <span>7500 RPM (Redline)</span>
              </div>
            </div>

            {/* Torque */}
            <div className="flex flex-col gap-1.5" id="slider-torque">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Drivetrain Load Torque (Nm)</span>
                <span className="text-white font-bold">{telemetry.torque} Nm</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="500" 
                value={telemetry.torque}
                onChange={(e) => handleSliderChange("torque", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>30 Nm</span>
                <span>250 Nm (Towing)</span>
                <span>500 Nm (Max Performance)</span>
              </div>
            </div>

            {/* Tool Wear (Mechanical Wear Minutes Index) */}
            <div className="flex flex-col gap-1.5" id="slider-tool-wear">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Mechanical Component Lifespan Wear Index</span>
                <span className={`font-bold ${telemetry.toolWear > 160 ? "text-rose-400" : "text-white"}`}>
                  {telemetry.toolWear} mins
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="250" 
                value={telemetry.toolWear}
                onChange={(e) => handleSliderChange("toolWear", Number(e.target.value))}
                className="w-full accent-cyan-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0 min (Fresh Part)</span>
                <span>120 min (Standard Interval)</span>
                <span>250 min (Critical Wearout)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Recharts Chart */}
        <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-5">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">Simulated Power & Torque curves</h3>
            </div>
            
            <div className="h-[230px] w-full text-gray-300 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerCurveData}>
                  <defs>
                    <linearGradient id="colorTorque" cx="0" cy="0" r="1" fx="0" fy="0" tz="0" gradientUnits="userSpaceOnUse">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPower" cx="0" cy="0" r="1" fx="0" fy="0" tz="0" gradientUnits="userSpaceOnUse">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="rpm" stroke="#71717a" fontSize={10} label={{ value: "RPM", position: "insideBottom", offset: -5, fill: "#71717a" }} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#050505", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelClassName="text-white font-bold font-sans"
                  />
                  <Area name="Torque (Nm)" type="monotone" dataKey="torque" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTorque)" strokeWidth={2} />
                  <Area name="Horsepower (HP)" type="monotone" dataKey="power" stroke="#6366f1" fillOpacity={1} fill="url(#colorPower)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#050505]/60 p-3.5 rounded-xl border border-white/5 text-[11px] text-gray-500 font-mono mt-3">
            <span className="text-gray-300 font-bold block uppercase mb-1">Drivetrain Physics Note</span>
            Dataline simulates real thermodynamic torque-loss curves. Peak torque ({telemetry.torque} Nm) occurs around 4500 RPM, translating into an operational power envelope of {Math.round((telemetry.torque * telemetry.rotationalSpeed) / 5252)} Horsepower.
          </div>
        </div>

      </div>
    </div>
  );
}
