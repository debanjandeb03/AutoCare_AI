/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Gauge, 
  Cpu, 
  BatteryCharging, 
  Activity, 
  MessageSquareCode, 
  Wifi, 
  AlertTriangle 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activePreset: string;
}

export default function Sidebar({ activeTab, setActiveTab, activePreset }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Telemetry HUD", icon: Gauge, desc: "Global vehicle status" },
    { id: "engine", label: "ICE Drivetrain", icon: Cpu, desc: "Thermodynamics & power" },
    { id: "battery", label: "EV Power Pack", icon: BatteryCharging, desc: "Chemical & thermal cells" },
    { id: "fault", label: "Vibrational FFT", icon: Activity, desc: "Harmonic sensor wave" },
    { id: "ai", label: "AI Copilot Engineering", icon: MessageSquareCode, desc: "Telemetry analysis" },
  ];

  return (
    <aside className="w-80 bg-[#0f0f11] border-r border-white/10 flex flex-col justify-between h-screen text-[#e0e0e0] font-sans shrink-0 select-none relative overflow-hidden">
      {/* Sleek top glowing line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-transparent" />

      {/* Top Section */}
      <div className="p-6 flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-sans text-lg font-black shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              AC
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-zinc-950 animate-ping" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-zinc-950" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-lg uppercase text-white font-sans flex items-center gap-1">
              AUTOCARE <span className="text-cyan-400 font-bold">AI</span>
            </div>
            <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Formula 1 / EV Telemetry</div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              OBD-II WIRELESS
            </span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="h-[1px] bg-white/5" />
          <div className="text-xs text-gray-500 font-mono">
            <span className="text-gray-400">PROFILE:</span>{" "}
            <span className="text-white font-medium uppercase font-sans tracking-wide bg-white/5 px-1.5 py-0.5 rounded border border-white/5 inline-block text-[11px]">
              {activePreset}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-300 relative group border ${
                  isActive
                    ? "bg-white/5 border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/5"
                }`}
                id={`nav-btn-${item.id}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-cyan-400 rounded-r-md shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                )}

                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"
                }`} />

                <div>
                  <div className="font-medium text-sm tracking-wide">{item.label}</div>
                  <div className="text-[10px] text-gray-500 group-hover:text-gray-400 font-mono leading-tight mt-0.5">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-4 mt-auto border-t border-white/5 bg-[#0f0f11]/40 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 rounded-2xl p-4">
          <p className="text-[10px] text-cyan-300 font-bold uppercase mb-1">Vehicle Status</p>
          <p className="text-xs text-white font-medium">Online & Encrypted</p>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2">
            <div className="bg-cyan-400 w-full h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
          </div>
        </div>

        <div className="font-mono flex flex-col gap-1.5 text-[10px] text-gray-500">
          <div className="flex items-center justify-between">
            <span>COGNITIVE CORE</span>
            <span className="text-gray-400">v3.5-FLASH</span>
          </div>
          <div className="flex items-center justify-between">
            <span>SAMPLING RATE</span>
            <span className="text-cyan-400 font-semibold">1200 Hz</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
