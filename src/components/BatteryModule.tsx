/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RadialGauge, BatteryCellGrid } from "./TelemetryGauges";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Sliders, Zap, Award, Play } from "lucide-react";
import { BatteryTelemetry, BatteryDiagnostic } from "../types";

interface BatteryModuleProps {
  telemetry: BatteryTelemetry & BatteryDiagnostic;
  onUpdateTelemetry: (data: Partial<BatteryTelemetry>) => void;
  onAnalyzeWithAI: () => void;
}

export default function BatteryModule({ telemetry, onUpdateTelemetry, onAnalyzeWithAI }: BatteryModuleProps) {
  
  const handleSliderChange = (key: keyof BatteryTelemetry, value: number) => {
    onUpdateTelemetry({ [key]: value });
  };

  // Generate capacity degradation chart data (retention percentage vs cycles)
  const degradationData = Array.from({ length: 11 }, (_, i) => {
    const cyclesCount = i * 150;
    // Capacity fades gradually, drops more rapidly after 1000 cycles
    let retention = 100;
    if (cyclesCount <= 500) {
      retention = 100 - (cyclesCount * 0.015);
    } else if (cyclesCount <= 1000) {
      retention = 92.5 - ((cyclesCount - 500) * 0.025);
    } else {
      retention = 80 - ((cyclesCount - 1000) * 0.06);
    }
    retention = Math.max(30, Math.round(retention));

    // Highlight current cycle point on the line chart
    const isCurrentRange = cyclesCount <= telemetry.cycles && telemetry.cycles < (cyclesCount + 150);

    return {
      cycles: cyclesCount,
      capacity: retention,
      current: isCurrentRange ? retention : null,
    };
  });

  // Calculate failure probability based on score
  const failureProbability = Math.max(1, 100 - telemetry.score);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radial gauge */}
        <div>
          <RadialGauge 
            value={telemetry.score}
            label="EV Battery State of Health"
            sublabel="Capacity & internal resistance gauge"
            unit="PCT"
            colorType="battery"
            risk={telemetry.risk}
          />
        </div>

        {/* Diagnostic Status */}
        <div className="lg:col-span-2 bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs font-mono tracking-wider uppercase">BMS System Log</h3>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full animate-pulse ${
                telemetry.risk === "LOW" ? "bg-cyan-400" :
                telemetry.risk === "MEDIUM" ? "bg-amber-400" : "bg-rose-500"
              }`} />
              <span className="text-white font-bold text-lg font-sans">
                {telemetry.risk === "LOW" ? "Li-Ion Pack Balanced" :
                 telemetry.risk === "MEDIUM" ? "Degradation Flag Active" : "HIGH THERMAL ALERT"}
              </span>
            </div>
            
            <p className="text-gray-300 font-mono text-xs leading-relaxed mt-1 bg-[#050505]/60 p-4 rounded-xl border border-white/5">
              {telemetry.recommendation}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between border-t border-white/5 pt-4 mt-4">
            <div className="flex gap-4 text-xs font-mono text-gray-500">
              <div>
                <span className="text-gray-400 block">FAILURE PROBABILITY</span>
                <span className={`font-bold text-sm ${failureProbability > 40 ? "text-rose-400" : "text-gray-300"}`}>
                  {failureProbability}%
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">CURRENT DRAW</span>
                <span className="text-white font-bold text-sm">{telemetry.currentDraw} A</span>
              </div>
              <div>
                <span className="text-gray-400 block">NOMINAL POWER</span>
                <span className="text-white font-bold text-sm">{(telemetry.voltage * telemetry.currentDraw / 1000).toFixed(1)} kW</span>
              </div>
            </div>

            <button
              onClick={onAnalyzeWithAI}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(59,130,246,0.25)] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              ANALYZE BATTERY CHEMISTRY
            </button>
          </div>
        </div>

      </div>

      {/* Inputs vs Map & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Sliders Control Panel */}
        <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-5">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">BMS Sensor Emulation</h3>
          </div>

          <div className="flex flex-col gap-5">
            {/* Voltage */}
            <div className="flex flex-col gap-1.5" id="slider-voltage">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Pack Voltage (V)</span>
                <span className="text-white font-bold">{telemetry.voltage} V</span>
              </div>
              <input 
                type="range" 
                min="300" 
                max="450" 
                value={telemetry.voltage}
                onChange={(e) => handleSliderChange("voltage", Number(e.target.value))}
                className="w-full accent-blue-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>300V (Discharged)</span>
                <span>380V (Nominal)</span>
                <span>450V (Peak Charge)</span>
              </div>
            </div>

            {/* Cycles */}
            <div className="flex flex-col gap-1.5" id="slider-cycles">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Total Charge Cycles</span>
                <span className="text-white font-bold">{telemetry.cycles} cycles</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1500" 
                value={telemetry.cycles}
                onChange={(e) => handleSliderChange("cycles", Number(e.target.value))}
                className="w-full accent-blue-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0 cycles (Brand New)</span>
                <span>600 cycles (Mid-Life)</span>
                <span>1500 cycles (End-of-Life)</span>
              </div>
            </div>

            {/* Current Draw */}
            <div className="flex flex-col gap-1.5" id="slider-current-draw">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Active Current Draw (Amps)</span>
                <span className="text-white font-bold">{telemetry.currentDraw} A</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="300" 
                value={telemetry.currentDraw}
                onChange={(e) => handleSliderChange("currentDraw", Number(e.target.value))}
                className="w-full accent-blue-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0 A (Regen/Coast)</span>
                <span>100 A (Highway acceleration)</span>
                <span>300 A (Ludicrous Launch)</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex flex-col gap-1.5" id="slider-battery-temp">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-gray-400">Pack Core Temperature (°C)</span>
                <span className={`font-bold ${telemetry.temperature > 48 ? "text-rose-400" : "text-white"}`}>
                  {telemetry.temperature} °C
                </span>
              </div>
              <input 
                type="range" 
                min="-15" 
                max="65" 
                value={telemetry.temperature}
                onChange={(e) => handleSliderChange("temperature", Number(e.target.value))}
                className="w-full accent-blue-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>-15°C (Freezing)</span>
                <span>32°C (Optimal)</span>
                <span>65°C (Thermal Runway Alert)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Cell Grid Matrix and Capacity Fading graph */}
        <div className="flex flex-col gap-6">
          
          {/* Active heat grid cells map */}
          <BatteryCellGrid temp={telemetry.temperature} />

          {/* Aging Curve Chart */}
          <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-5">
            <h4 className="text-gray-400 text-xs font-mono tracking-wider uppercase mb-3">Capacity Retention fade curve</h4>
            <div className="h-[120px] w-full text-gray-300 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={degradationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="cycles" stroke="#71717a" fontSize={9} />
                  <YAxis domain={[40, 100]} stroke="#71717a" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#050505", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelClassName="text-white font-bold text-xs"
                  />
                  <Line name="SOH (%)" type="monotone" dataKey="capacity" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line name="Current" type="monotone" dataKey="current" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-2 flex justify-between">
              <span>Current SOH Position: {telemetry.score}%</span>
              <span>Total capacity limit: {Math.max(50, telemetry.score * 0.95).toFixed(0)}Ah</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
