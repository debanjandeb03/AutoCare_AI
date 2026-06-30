/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Gauge, Radio, Flame, Sparkles, Activity, Compass, AlertTriangle } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  description: string;
}

interface PresetSelectorProps {
  activePresetId: string;
  onSelectPreset: (id: string) => void;
}

export default function PresetSelector({ activePresetId, onSelectPreset }: PresetSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available presets from the Express API
    fetch("/api/presets")
      .then((res) => res.json())
      .then((data) => {
        setPresets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching telemetry presets:", err);
        setLoading(false);
      });
  }, []);

  // Preset custom icons
  const getPresetIcon = (id: string) => {
    switch (id) {
      case "normal":
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case "track":
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case "overheat":
        return <Flame className="w-5 h-5 text-orange-400 animate-pulse" />;
      case "battery_fault":
        return <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />;
      case "severe_vibration":
        return <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <Radio className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPresetBorderColor = (id: string, active: boolean) => {
    if (!active) return "border-white/5 hover:border-white/10 bg-[#0f0f11]/60";
    switch (id) {
      case "normal":
        return "border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_15px_rgba(34,211,238,0.08)]";
      case "track":
        return "border-indigo-500/30 bg-indigo-950/10 shadow-[0_0_15px_rgba(99,102,241,0.08)]";
      case "overheat":
        return "border-orange-500/30 bg-orange-950/10 shadow-[0_0_15px_rgba(249,115,22,0.08)]";
      case "battery_fault":
        return "border-rose-500/30 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.08)]";
      case "severe_vibration":
        return "border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_15px_rgba(234,179,8,0.08)]";
      default:
        return "border-white/10 bg-[#0f0f11]";
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 items-center justify-center p-4">
        <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Syncing vehicle presets...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-[#0f0f11] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      {/* Visual background lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05),transparent)] pointer-events-none" />
      
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div>
          <h3 className="text-white font-extrabold text-base uppercase font-sans tracking-wide">OBD-II Telemetry Simulator</h3>
          <span className="text-xs text-gray-500 font-mono">Select a physical scenario block to inject dynamic data arrays</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono border border-white/5 bg-white/5 px-2 py-0.5 rounded uppercase">
          Feed: ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${getPresetBorderColor(preset.id, isActive)}`}
              id={`preset-btn-${preset.id}`}
            >
              {/* Highlight bar top */}
              {isActive && (
                <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-b ${
                  preset.id === "normal" ? "bg-cyan-400" :
                  preset.id === "track" ? "bg-indigo-500" :
                  preset.id === "overheat" ? "bg-orange-500" :
                  preset.id === "battery_fault" ? "bg-rose-500" : "bg-yellow-500"
                }`} />
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#050505]/80 border border-white/5">
                  {getPresetIcon(preset.id)}
                </div>
                <span className="font-bold text-sm text-[#e0e0e0] group-hover:text-white font-sans truncate">
                  {preset.name}
                </span>
              </div>
              
              <p className="text-gray-400 text-[11px] font-mono leading-relaxed mt-1 line-clamp-3">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
