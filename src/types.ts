/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EngineTelemetry {
  airTemp: number;         // °C
  processTemp: number;     // °C
  rotationalSpeed: number; // RPM
  torque: number;          // Nm
  toolWear: number;        // minutes (valvetrain / cylinder wear factor)
}

export interface EngineDiagnostic {
  score: number;           // 0 - 100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface BatteryTelemetry {
  voltage: number;         // V
  cycles: number;          // cycle count
  currentDraw: number;     // A
  temperature: number;     // °C
}

export interface BatteryDiagnostic {
  score: number;           // 0 - 100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface FaultTelemetry {
  vibration: number;       // mm/s² (amplitude)
  rpm: number;             // engine RPM
  speed: number;           // km/h
}

export interface FaultDiagnostic {
  faultType: string;
  severity: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  action: string;
}

export interface VehicleTelemetryState {
  engine: EngineTelemetry & EngineDiagnostic;
  battery: BatteryTelemetry & BatteryDiagnostic;
  fault: FaultTelemetry & FaultDiagnostic;
  activePreset: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface TelemetryPreset {
  id: string;
  name: string;
  description: string;
  engine: EngineTelemetry;
  battery: BatteryTelemetry;
  fault: FaultTelemetry;
}
