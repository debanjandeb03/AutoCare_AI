/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertCircle, ShieldAlert, Cpu, Battery } from "lucide-react";

interface RadialGaugeProps {
  value: number;
  label: string;
  sublabel: string;
  unit?: string;
  colorType: "engine" | "battery" | "vibration";
  risk?: "LOW" | "MEDIUM" | "HIGH" | "NONE" | "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
}

export function RadialGauge({ value, label, sublabel, unit = "", colorType, risk }: RadialGaugeProps) {
  // SVG Gauge calculations
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let strokeColor = "stroke-cyan-400";
  let glowColor = "shadow-cyan-400/20";
  let textColor = "text-cyan-400";
  let badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

  // Color matching
  if (colorType === "engine") {
    if (value < 55) {
      strokeColor = "stroke-rose-500";
      textColor = "text-rose-400";
      badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    } else if (value < 80) {
      strokeColor = "stroke-amber-500";
      textColor = "text-amber-400";
      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      strokeColor = "stroke-cyan-400";
      textColor = "text-cyan-400";
      badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
  } else if (colorType === "battery") {
    if (value < 55) {
      strokeColor = "stroke-rose-500";
      textColor = "text-rose-400";
      badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    } else if (value < 80) {
      strokeColor = "stroke-amber-400";
      textColor = "text-amber-400";
      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      strokeColor = "stroke-blue-400";
      textColor = "text-blue-400";
      badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  } else if (colorType === "vibration") {
    // Vibration score is reversed (higher value = worse)
    const severity = risk ?? "NONE";
    if (severity === "SEVERE" || severity === "CRITICAL") {
      strokeColor = "stroke-rose-500";
      textColor = "text-rose-400";
      badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    } else if (severity === "MODERATE" || severity === "MINOR") {
      strokeColor = "stroke-amber-500";
      textColor = "text-amber-400";
      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      strokeColor = "stroke-cyan-400";
      textColor = "text-cyan-400";
      badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
  }

  return (
    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-between shadow-lg relative group overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50" />
      
      {/* Label and Status */}
      <div className="w-full flex justify-between items-start mb-4">
        <div>
          <h4 className="text-gray-400 text-xs font-mono tracking-wider uppercase">{label}</h4>
          <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{sublabel}</span>
        </div>
        {risk && (
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider ${badgeColor}`}>
            {risk}
          </span>
        )}
      </div>

      {/* SVG Circular Dial */}
      <div className="relative flex items-center justify-center my-3">
        <svg className="w-36 h-36 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-zinc-800 fill-transparent"
            strokeWidth={strokeWidth}
          />
          {/* Foreground progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className={`fill-transparent transition-all duration-1000 ease-out ${strokeColor}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold font-mono tracking-tight leading-none ${textColor}`}>
            {value}
          </span>
          <span className="text-gray-500 text-[10px] font-mono mt-1 tracking-wider uppercase">{unit}</span>
        </div>
      </div>

      {/* Mini-Graph Track background bar decoration */}
      <div className="w-full h-[3px] bg-zinc-850 rounded-full mt-3 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${strokeColor.replace("stroke-", "bg-")}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface CellGridProps {
  temp: number;
}

export function BatteryCellGrid({ temp }: CellGridProps) {
  // Renders a mock EV battery module layout with cell color temperatures
  const gridCells = Array.from({ length: 18 });

  return (
    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <h4 className="text-gray-400 text-xs font-mono tracking-wider uppercase">Cell Matrix Core</h4>
          <span className="text-[10px] text-gray-500 font-mono">Real-time modular heat signature</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-gray-400">18 CELL NODES</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 my-2">
        {gridCells.map((_, i) => {
          // Add some cell-by-cell temperature variance based on overall pack temp
          const variance = Math.sin(i * 1.5) * 4;
          const cellTemp = temp + variance;

          let bgCell = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
          if (cellTemp > 52) {
            bgCell = "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse";
          } else if (cellTemp > 41) {
            bgCell = "bg-amber-500/20 border-amber-500/40 text-amber-400";
          } else if (cellTemp < 5) {
            bgCell = "bg-blue-500/20 border-blue-500/40 text-blue-400";
          }

          return (
            <div 
              key={i} 
              className={`border rounded py-1.5 flex flex-col items-center justify-center font-mono transition-colors duration-500 ${bgCell}`}
              id={`battery-cell-${i}`}
            >
              <span className="text-[8px] text-gray-500 font-medium">C{(i+1).toString().padStart(2, "0")}</span>
              <span className="text-[10px] font-bold mt-0.5">{cellTemp.toFixed(0)}°</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500/40 rounded inline-block" />
          Cold (Regen limit)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded inline-block" />
          Nominal (30-38°C)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-rose-500/20 border border-rose-500/40 rounded inline-block" />
          Overheat (&gt;52°C)
        </span>
      </div>
    </div>
  );
}
