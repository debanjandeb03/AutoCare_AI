/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PresetSelector from "./components/PresetSelector";
import { RadialGauge } from "./components/TelemetryGauges";
import EngineModule from "./components/EngineModule";
import BatteryModule from "./components/BatteryModule";
import FaultModule from "./components/FaultModule";
import AIAssistantModule from "./components/AIAssistantModule";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Battery, 
  Activity, 
  Sparkles, 
  Clock, 
  Eye, 
  Wrench,
  Gauge
} from "lucide-react";
import { VehicleTelemetryState, EngineTelemetry, BatteryTelemetry, FaultTelemetry } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activePresetId, setActivePresetId] = useState<string>("normal");
  const [telemetryState, setTelemetryState] = useState<VehicleTelemetryState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize telemetry calculations from server
  const fetchTelemetry = (presetId: string, customData?: {
    customEngine?: Partial<EngineTelemetry>;
    customBattery?: Partial<BatteryTelemetry>;
    customFault?: Partial<FaultTelemetry>;
  }) => {
    fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presetId,
        ...customData
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setTelemetryState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vehicle telemetry state:", err);
        setLoading(false);
      });
  };

 // Extra added upto above useeffect
 const fetchEnginePrediction = async (
  engine: Partial<EngineTelemetry>
) => {

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/engine/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          air_temperature: engine.airTemp,

          process_temperature: engine.processTemp,

          rotational_speed: engine.rotationalSpeed,

          torque: engine.torque,

          tool_wear: engine.toolWear

        })
      }
    );

if (!response.ok) {
    throw new Error("Engine prediction failed");
}

return await response.json();

  } catch (err) {

    console.error(err);

    return null;
  }

};

//Fetch battery function before  useEffect(() => {fetchTelemetry(activePresetId);  },
const fetchBatteryPrediction = async (
  battery: Partial<BatteryTelemetry>
) => {

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/battery/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          voltage: battery.voltage,

          cycles: battery.cycles,

          current_draw: battery.currentDraw,

          temperature: battery.temperature

        })

      }
    );

    return await response.json();

  } catch (err) {

    console.error("Battery Prediction Error:", err);

    return null;

  }

};

const fetchFaultPrediction = async (
  fault: Partial<FaultTelemetry>
) => {

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/fault/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          vibration: fault.vibration,

          rpm: fault.rpm,

          speed: fault.speed

        })

      }
    );

    if (!response.ok) {
    throw new Error("Fault prediction failed");
    }

    return await response.json();

  } catch (err) {

    console.error("Fault Prediction Error:", err);

    return null;

  }

};

  useEffect(() => {
    fetchTelemetry(activePresetId);
  }, [activePresetId]);

  // Handle manual slider override updates from any page
  const handleUpdateEngine = async (
  newEngine: Partial<EngineTelemetry>
) => {

  if (!telemetryState) return;

  // Merge updated slider values with current engine telemetry
  const updatedEngine = {
    ...telemetryState.engine,
    ...newEngine
  };

  // Call FastAPI backend
  const result = await fetchEnginePrediction(updatedEngine);

  if (!result) return;

  setTelemetryState({
    ...telemetryState,

    engine: {

      // Existing telemetry values
      ...updatedEngine,

      // ML Prediction
      score: result.health_score,

      risk:
      result.risk === "Low"
      ? "LOW"
      : result.risk === "Medium"
      ? "MEDIUM"
      : "HIGH",

      recommendation:
        result.prediction === 0
          ? "Engine operating normally."
          : "Potential engine failure detected. Immediate inspection recommended."

    }

  });

};

  const handleUpdateBattery = async (
  newBattery: Partial<BatteryTelemetry>
) => {

  if (!telemetryState) return;

  // Merge updated slider values
  const updatedBattery = {
    ...telemetryState.battery,
    ...newBattery
  };

  // Call FastAPI backend
  const result = await fetchBatteryPrediction(updatedBattery);

  if (!result) return;

  // Update only the battery portion of the state
  setTelemetryState({
    ...telemetryState,

    battery: {

      // Existing telemetry values
      ...updatedBattery,

      // ML Prediction
      score: result.health_score,

      risk:
        result.risk === "Low"
          ? "LOW"
          : result.risk === "Medium"
          ? "MEDIUM"
          : "HIGH",

      recommendation: result.recommendation

    }

  });

};

const handleUpdateFault = async (
  newFault: Partial<FaultTelemetry>
) => {

  if (!telemetryState) return;

  // Merge updated slider values
  const updatedFault = {
    ...telemetryState.fault,
    ...newFault
  };

  // Call FastAPI backend
  const result = await fetchFaultPrediction(updatedFault);

  if (!result) return;

  // Update only the fault portion of the state
  setTelemetryState({
    ...telemetryState,

    fault: {

      // Existing telemetry values
      ...updatedFault,

      // ML Prediction
      faultType: result.fault_type,

      severity: result.severity,

      action: result.action

    }

  });

};

  // Jump to AI Assist and generate report
  const handleAIReportTrigger = () => {
    setActiveTab("ai");
  };

  // Active Alert compiling
  const compileAlerts = () => {
    if (!telemetryState) return [];
    const list = [];

    // Engine alerts
    if (telemetryState.engine.risk === "HIGH") {
      list.push({
        module: "Engine",
        severity: "CRITICAL",
        message: telemetryState.engine.recommendation,
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        color: "border-rose-500/30 bg-rose-500/5 text-rose-300"
      });
    } else if (telemetryState.engine.risk === "MEDIUM") {
      list.push({
        module: "Engine",
        severity: "WARNING",
        message: telemetryState.engine.recommendation,
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        color: "border-amber-500/30 bg-amber-500/5 text-amber-300"
      });
    }

    // Battery alerts
    if (telemetryState.battery.risk === "HIGH") {
      list.push({
        module: "Battery",
        severity: "CRITICAL",
        message: telemetryState.battery.recommendation,
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        color: "border-rose-500/30 bg-rose-500/5 text-rose-300"
      });
    } else if (telemetryState.battery.risk === "MEDIUM") {
      list.push({
        module: "Battery",
        severity: "WARNING",
        message: telemetryState.battery.recommendation,
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        color: "border-amber-500/30 bg-amber-500/5 text-amber-300"
      });
    }

    // Vibration/Fault alerts
    if (telemetryState.fault.severity === "CRITICAL" || telemetryState.fault.severity === "SEVERE") {
      list.push({
        module: "Fault Diagnostics",
        severity: "CRITICAL",
        message: `${telemetryState.fault.faultType}. ${telemetryState.fault.action}`,
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        color: "border-rose-500/30 bg-rose-500/5 text-rose-300"
      });
    } else if (telemetryState.fault.severity === "MODERATE" || telemetryState.fault.severity === "MINOR") {
      list.push({
        module: "Fault Diagnostics",
        severity: "WARNING",
        message: `${telemetryState.fault.faultType}. ${telemetryState.fault.action}`,
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        color: "border-amber-500/30 bg-amber-500/5 text-amber-300"
      });
    }

    return list;
  };

  const activeAlerts = compileAlerts();

  return (
    <div className="flex h-screen bg-[#070708] font-sans text-gray-100 overflow-hidden relative">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activePreset={telemetryState?.activePreset ?? "Normal"} 
      />

      {/* Main workspace */}
      <main className="flex-1 flex flex-col h-full bg-[#070708] overflow-y-auto">
        
        {/* Top telemetry status bar */}
        <header className="h-16 border-b border-white/5 bg-[#0f0f11] px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-mono tracking-widest uppercase text-gray-400">
              {activeTab === "dashboard" ? "Global System Telemetry HUD" : 
               activeTab === "engine" ? "ICE Drivetrain Matrix" :
               activeTab === "battery" ? "EV Power Pack Core" :
               activeTab === "fault" ? "FFT Harmonic Vibration Scope" : "AI Copilot Core"}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>UTC {new Date().toISOString().substring(11, 19)}</span>
            </div>
            <div>
              <span className="text-gray-400">BOARD CODES:</span>{" "}
              <span className="text-cyan-400 font-bold">0x00_NOMINAL</span>
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="p-8 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex-1 flex flex-col gap-4 items-center justify-center text-gray-500 font-mono">
              <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-widest">Compiling OBD telematics...</span>
            </div>
          ) : telemetryState ? (
            <>
              {/* Preset selectors displayed globally on dashboard tab */}
              {activeTab === "dashboard" && (
                <PresetSelector 
                  activePresetId={activePresetId}
                  onSelectPreset={(id) => {
                    setLoading(true);
                    setActivePresetId(id);
                  }}
                />
              )}

              {/* View router */}
              {activeTab === "dashboard" && (
                <div className="flex flex-col gap-8">
                  
                  {/* Gauges Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RadialGauge 
                      value={telemetryState.engine.score}
                      label="Engine Drivetrain Health"
                      sublabel="Rotational & thermal index"
                      unit="PCT"
                      colorType="engine"
                      risk={telemetryState.engine.risk}
                    />
                    <RadialGauge 
                      value={telemetryState.battery.score}
                      label="Battery SOH Status"
                      sublabel="Electrolyte capacity retention"
                      unit="PCT"
                      colorType="battery"
                      risk={telemetryState.battery.risk}
                    />
                    <RadialGauge 
                      value={Math.min(100, Math.round((telemetryState.fault.vibration / 10) * 100))}
                      label="Chassis Harmonic Vibration"
                      sublabel="Structural G-force amplitude"
                      unit="G_RMS"
                      colorType="vibration"
                      risk={telemetryState.fault.severity}
                    />
                  </div>

                  {/* Active Alerts Board */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Live alerts board */}
                    <div className="lg:col-span-2 bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                          <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-cyan-400" />
                            Live Telemetry Flag Log
                          </h3>
                          <span className="font-mono text-[10px] text-gray-400 bg-black/40 border border-white/5 px-2 py-0.5 rounded">
                            {activeAlerts.length} ALERTS ACTIVE
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                          {activeAlerts.length > 0 ? (
                            activeAlerts.map((alert, idx) => (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-3 p-3.5 rounded-xl border font-mono text-xs leading-relaxed ${alert.color}`}
                              >
                                <div className="p-1 rounded bg-[#050505] border border-white/5 shrink-0">
                                  {alert.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold uppercase text-[11px] mb-0.5 flex justify-between">
                                    <span>{alert.module} System Check</span>
                                    <span className="text-[10px] opacity-75">{alert.severity}</span>
                                  </div>
                                  <p className="text-gray-300 text-[11px] leading-relaxed">{alert.message}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col gap-2 items-center justify-center p-8 text-center text-gray-500">
                              <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                              <div className="mt-2">
                                <p className="font-bold text-xs uppercase tracking-wider text-gray-400">All Systems Nominal</p>
                                <p className="text-[11px] text-gray-500 font-mono mt-1">Vehicle thermodynamics, electrical cells, and acoustics are operating normally.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Diagnostic trigger footer */}
                      <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono">OBD FEED RATE: 1200 SAMPLES/SEC</span>
                        <button
                          onClick={handleAIReportTrigger}
                          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          RUN AI DEEP REPORT
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Sidebar */}
                    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <h4 className="text-gray-400 text-xs font-mono tracking-wider uppercase border-b border-white/5 pb-3 mb-4">Core Bus Telematics</h4>
                      
                      <div className="flex flex-col gap-4 font-mono text-xs flex-1 justify-center">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-gray-500 uppercase">Engine Speed</span>
                          <span className="text-white font-bold">{telemetryState.engine.rotationalSpeed} RPM</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-gray-500 uppercase">Peak Torque</span>
                          <span className="text-white font-bold">{telemetryState.engine.torque} Nm</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-gray-500 uppercase">Pack Potential</span>
                          <span className="text-white font-bold">{telemetryState.battery.voltage} V</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-gray-500 uppercase">Sensory Temperature</span>
                          <span className="text-white font-bold">{telemetryState.battery.temperature} °C</span>
                        </div>
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-gray-500 uppercase">Vibration Vector</span>
                          <span className="text-cyan-400 font-bold">{telemetryState.fault.vibration.toFixed(2)} mm/s²</span>
                        </div>
                      </div>

                      <div className="bg-[#050505]/60 p-3 rounded-xl border border-white/5 mt-4 text-[10px] text-gray-500 leading-normal">
                        Active preset <strong className="text-gray-300 font-sans">{telemetryState.activePreset}</strong> maps physical automotive telemetry configurations directly into the diagnostic calculations.
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {activeTab === "engine" && (
                <EngineModule 
                  telemetry={telemetryState.engine} 
                  onUpdateTelemetry={handleUpdateEngine}
                  onAnalyzeWithAI={handleAIReportTrigger}
                />
              )}

              {activeTab === "battery" && (
                <BatteryModule 
                  telemetry={telemetryState.battery} 
                  onUpdateTelemetry={handleUpdateBattery}
                  onAnalyzeWithAI={handleAIReportTrigger}
                />
              )}

              {activeTab === "fault" && (
                <FaultModule 
                  telemetry={telemetryState.fault} 
                  onUpdateTelemetry={handleUpdateFault}
                  onAnalyzeWithAI={handleAIReportTrigger}
                />
              )}

              {activeTab === "ai" && (
                <AIAssistantModule state={telemetryState} />
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col gap-2 items-center justify-center text-zinc-500 font-mono">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              <span>Diagnostic array initialization failure. Contact technical crew.</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
