/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Telemetry Types
import {
  EngineTelemetry,
  EngineDiagnostic,
  BatteryTelemetry,
  BatteryDiagnostic,
  FaultTelemetry,
  FaultDiagnostic,
  VehicleTelemetryState
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI Client to prevent startup crash if API key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// ----------------------------------------------------
// Telemetry Diagnostics Logic (Physics-based Rule Engine)
// ----------------------------------------------------

function diagnoseEngine(inputs: Partial<EngineTelemetry>): EngineTelemetry & EngineDiagnostic {
  const airTemp = Number(inputs.airTemp ?? 25);
  const processTemp = Number(inputs.processTemp ?? 88);
  const rotationalSpeed = Number(inputs.rotationalSpeed ?? 2800);
  const torque = Number(inputs.torque ?? 180);
  const toolWear = Number(inputs.toolWear ?? 45);

  let score = 100;
  const recs: string[] = [];

  // 1. Coolant/Overheat check
  const tempDelta = processTemp - airTemp;
  if (tempDelta > 75) {
    score -= 30;
    recs.push("Critical engine cooling degradation. Immediate stop required to avoid cylinder head warping.");
  } else if (tempDelta > 55) {
    score -= 15;
    recs.push("Elevated engine operating temperatures. Inspect coolant fluid pressure and auxiliary fan.");
  }

  // 2. Overrevving (Redlining)
  if (rotationalSpeed > 6200) {
    score -= 20;
    recs.push("Critical valvetrain stress. Engine speed exceeded peak load threshold. Valve-float risk.");
  } else if (rotationalSpeed > 5200) {
    score -= 8;
    recs.push("High engine revs sustained. Accelerated mechanical frictional friction.");
  }

  // 3. Torque spike
  if (torque > 400) {
    score -= 15;
    recs.push("Extreme torque loading detected on gearbox shaft. Downshift recommended to reduce load.");
  }

  // 4. Physical mechanical wear index (simulated as "toolWear" or cylinder wall stress)
  if (toolWear > 180) {
    score -= 25;
    recs.push("Timing belt or cylinder lining physical wear exceeded safe margins. Schedule immediate overhaul.");
  } else if (toolWear > 100) {
    score -= 10;
    recs.push("Moderate mechanical wear. Standard interval maintenance recommended soon.");
  }

  score = Math.max(10, Math.min(100, Math.round(score)));
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score < 55) {
    risk = 'HIGH';
  } else if (score < 80) {
    risk = 'MEDIUM';
  }

  if (recs.length === 0) {
    recs.push("Engine functioning in prime thermal and rotational equilibrium.");
  }

  return {
    airTemp,
    processTemp,
    rotationalSpeed,
    torque,
    toolWear,
    score,
    risk,
    recommendation: recs.join(" "),
  };
}

function diagnoseBattery(inputs: Partial<BatteryTelemetry>): BatteryTelemetry & BatteryDiagnostic {
  const voltage = Number(inputs.voltage ?? 380);
  const cycles = Number(inputs.cycles ?? 150);
  const currentDraw = Number(inputs.currentDraw ?? 22);
  const temperature = Number(inputs.temperature ?? 33);

  let score = 100;
  const recs: string[] = [];

  // EV Battery Voltage (Nominal 380V pack, safe 330V - 420V)
  if (voltage < 335) {
    score -= 25;
    recs.push("Deep pack discharge. Chemical stress detected in cells. Charge immediately to avoid cell reversal.");
  } else if (voltage > 425) {
    score -= 20;
    recs.push("Over-voltage risk. BMS may lock output to protect from cell bloating.");
  }

  // Cell temperatures
  if (temperature > 55) {
    score -= 30;
    recs.push("CRITICAL BATTERY OVERHEAT. Cooling pump failed or high thermal runway danger. Park vehicle safely.");
  } else if (temperature > 43) {
    score -= 15;
    recs.push("High cell temperature. Rapid DC fast charging will be throttled.");
  } else if (temperature < 0) {
    score -= 12;
    recs.push("Sub-zero battery temperature. Lithium plating threat restricts high regeneration rates.");
  }

  // Current draw
  if (currentDraw > 250) {
    score -= 15;
    recs.push("High discharge load on pack cells. Restrict full throttle demands.");
  }

  // State of wear (Cycles)
  if (cycles > 1200) {
    score -= 20;
    recs.push("Severe pack capacity degradation due to high cycle life. Cell imbalance possible.");
  } else if (cycles > 650) {
    score -= 8;
    recs.push("Moderate battery age wear. Active range is expected to drop ~10-15%.");
  }

  score = Math.max(10, Math.min(100, Math.round(score)));
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score < 55) {
    risk = 'HIGH';
  } else if (score < 80) {
    risk = 'MEDIUM';
  }

  if (recs.length === 0) {
    recs.push("High-voltage EV cells operating at optimal chemical potential.");
  }

  return {
    voltage,
    cycles,
    currentDraw,
    temperature,
    score,
    risk,
    recommendation: recs.join(" "),
  };
}

function diagnoseFault(inputs: Partial<FaultTelemetry>): FaultTelemetry & FaultDiagnostic {
  const vibration = Number(inputs.vibration ?? 1.2);
  const rpm = Number(inputs.rpm ?? 2800);
  const speed = Number(inputs.speed ?? 85);

  let faultType = "None (System Nominal)";
  let severity: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' = 'NONE';
  let action = "No mechanical corrections needed. System operating under nominal frequency bands.";

  // High Vibration checks (vibration amplitude in mm/s²)
  if (vibration >= 6.8) {
    if (rpm > 4200) {
      faultType = "Structural Crankshaft or Bearing Failure";
      severity = "CRITICAL";
      action = "Shut down engine immediately. Severe risk of connecting rod throwing or engine block destruction.";
    } else {
      faultType = "Axle / Wheel Hub Structural Fracture";
      severity = "SEVERE";
      action = "Pull over immediately. Restrict steering maneuvers and arrange professional flatbed extraction.";
    }
  } else if (vibration >= 4.2) {
    if (speed > 100) {
      faultType = "High-speed Wheel Unbalance / Rotor Distortion";
      severity = "MODERATE";
      action = "Check braking disc warping. Schedule tire rebalancing. Maintain speeds under 80 km/h.";
    } else {
      faultType = "Engine Misfire / Coil Pack Breakdown";
      severity = "MODERATE";
      action = "Inspect ignition coils and spark plug gap wear. Scan OBD-II for cylinder misfire codes.";
    }
  } else if (vibration >= 2.2) {
    faultType = "Drive Belt Wear or Loose Engine Cowl";
    severity = "MINOR";
    action = "Check tensioner pulley alignment and check structural sound insulation plastic pins.";
  }

  return {
    vibration,
    rpm,
    speed,
    faultType,
    severity,
    action,
  };
}

// Predefined Scenarios / Presets
const VEHICLE_PRESETS: Record<string, { name: string; description: string; engine: Partial<EngineTelemetry>; battery: Partial<BatteryTelemetry>; fault: Partial<FaultTelemetry> }> = {
  normal: {
    name: "Standard Commute",
    description: "Optimal city/highway operation with balanced temperatures, speed, and clean vibration signals.",
    engine: { airTemp: 22, processTemp: 82, rotationalSpeed: 2100, torque: 140, toolWear: 45 },
    battery: { voltage: 382, cycles: 140, currentDraw: 18, temperature: 30 },
    fault: { vibration: 0.8, rpm: 2100, speed: 65 }
  },
  track: {
    name: "F1 Telemetry Session",
    description: "Vehicle running under peak load at a racing circuit. High heat, max rotational speed, and heavy discharge.",
    engine: { airTemp: 32, processTemp: 104, rotationalSpeed: 6400, torque: 380, toolWear: 120 },
    battery: { voltage: 365, cycles: 280, currentDraw: 190, temperature: 44 },
    fault: { vibration: 2.8, rpm: 6400, speed: 210 }
  },
  overheat: {
    name: "Engine Thermal Warning",
    description: "Engine heat dissipation system failure. Air vs process temperature difference reaches unstable margins.",
    engine: { airTemp: 35, processTemp: 114, rotationalSpeed: 4200, torque: 290, toolWear: 60 },
    battery: { voltage: 375, cycles: 150, currentDraw: 45, temperature: 38 },
    fault: { vibration: 3.1, rpm: 4200, speed: 110 }
  },
  battery_fault: {
    name: "Battery Critical Cell",
    description: "EV cell degradation simulator. Battery pack temperature is critical, causing a dramatic performance drop.",
    engine: { airTemp: 20, processTemp: 78, rotationalSpeed: 1800, torque: 110, toolWear: 30 },
    battery: { voltage: 325, cycles: 1250, currentDraw: 260, temperature: 58 },
    fault: { vibration: 1.1, rpm: 1800, speed: 50 }
  },
  severe_vibration: {
    name: "Structural Fracture Spike",
    description: "Extreme vibrational spikes in drivetrain indicating high severity physical components displacement.",
    engine: { airTemp: 18, processTemp: 84, rotationalSpeed: 3800, torque: 220, toolWear: 50 },
    battery: { voltage: 378, cycles: 320, currentDraw: 40, temperature: 31 },
    fault: { vibration: 7.2, rpm: 3800, speed: 120 }
  }
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// GET presets list
app.get("/api/presets", (req: Request, res: Response) => {
  const result = Object.entries(VEHICLE_PRESETS).map(([id, val]) => ({
    id,
    name: val.name,
    description: val.description
  }));
  res.json(result);
});

// GET custom diagnostics compiled based on inputs or preset ID
app.post("/api/diagnose", (req: Request, res: Response) => {
  const { presetId, customEngine, customBattery, customFault } = req.body;

  let engineInputs: Partial<EngineTelemetry> = {};
  let batteryInputs: Partial<BatteryTelemetry> = {};
  let faultInputs: Partial<FaultTelemetry> = {};
  let activePresetName = "Custom Telemetry";

  if (presetId && VEHICLE_PRESETS[presetId]) {
    const p = VEHICLE_PRESETS[presetId];
    engineInputs = p.engine;
    batteryInputs = p.battery;
    faultInputs = p.fault;
    activePresetName = p.name;
  }

  // Allow manual override for sliders/forms
  engineInputs = { ...engineInputs, ...customEngine };
  batteryInputs = { ...batteryInputs, ...customBattery };
  faultInputs = { ...faultInputs, ...customFault };

  const engineDiag = diagnoseEngine(engineInputs);
  const batteryDiag = diagnoseBattery(batteryInputs);
  const faultDiag = diagnoseFault(faultInputs);

  const fullState: VehicleTelemetryState = {
    engine: engineDiag,
    battery: batteryDiag,
    fault: faultDiag,
    activePreset: activePresetName,
    timestamp: new Date().toISOString()
  };

  res.json(fullState);
});

// POST to Gemini: AI Diagnostic Report Explanation
app.post("/api/explain", async (req: Request, res: Response) => {
  const { state }: { state: VehicleTelemetryState } = req.body;
  if (!state) {
    return res.status(400).json({ error: "Missing telemetry state to generate diagnostic report." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: false,
      explanation: `**AI Assistant Sandbox Mode** (API Key Not Configured)

### Telemetry Summary
- **Engine Score**: ${state.engine.score}/100 (${state.engine.risk} Risk)
- **Battery Score**: ${state.battery.score}/100 (${state.battery.risk} Risk)
- **Fault Type**: ${state.fault.faultType} (Severity: ${state.fault.severity})

### Heuristic Assessment
1. **Engine**: ${state.engine.recommendation}
2. **Battery**: ${state.battery.recommendation}
3. **Fault Response**: ${state.fault.action}

*To activate full Gemini-powered telemetry generation, please configure your \`GEMINI_API_KEY\` in the **Settings > Secrets** panel.*`
    });
  }

  try {
    const prompt = `
You are AutoCare AI, an ultra-advanced automotive diagnostics and mechanical telemetry AI expert, trusted by top Formula 1 racing engineers and EV design team leads.
Analyze this raw vehicle health telemetry state and generate a highly professional, comprehensive telemetry diagnostic assessment in rich Markdown formatting:

\`\`\`json
${JSON.stringify(state, null, 2)}
\`\`\`

Structure your response beautifully with:
1. **EXE-SUMMARY**: High-level telemetry brief. Highlight any urgent risks in a clean bullet list.
2. **ENGINE ANALYSIS**: Explain the relation between Air Temp (${state.engine.airTemp}°C), Process Temp (${state.engine.processTemp}°C), RPM (${state.engine.rotationalSpeed}), and Torque (${state.engine.torque} Nm). Mention the Cylinder Wear Factor (${state.engine.toolWear} mins index).
3. **EV PACK HEALTH**: Explain what its current Voltage (${state.battery.voltage}V), Cycle Life (${state.battery.cycles} cycles), Current Draw (${state.battery.currentDraw}A), and pack cell Temperature (${state.battery.temperature}°C) indicates.
4. **HARMONIC VIBRATION REPORT**: Diagnose the G-force vibration amplitude (${state.fault.vibration} mm/s²), speed (${state.fault.speed} km/h), and correlate it to mechanical faults.
5. **AI REMEDIATION PLAN**: Actionable, step-by-step technical procedures to restore full vehicle structural stability.

Keep your tone authoritative, precise, futuristic, and highly technical yet clear.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the premium AutoCare AI copilot system, a master of vehicle thermodynamics, EV battery cell chemistry, and vibration analysis telemetry.",
        temperature: 0.3,
      }
    });

    res.json({
      success: true,
      explanation: response.text
    });
  } catch (error: any) {
    console.error("Gemini Explanation Error:", error);
    res.status(500).json({ error: "Failed to generate AI explanation. Please confirm API key structure." });
  }
});

// POST to Gemini: Chatbot Q&A Interface
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, state }: { messages: Array<{ role: 'user' | 'assistant'; text: string }>; state: VehicleTelemetryState } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing message stream." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant simulation if API Key is missing
    const lastUserMsg = messages[messages.length - 1].text.toLowerCase();
    let reply = "";

    if (lastUserMsg.includes("battery") || lastUserMsg.includes("voltage") || lastUserMsg.includes("ev")) {
      reply = `Based on the active telemetry profile, your high-voltage pack cells are running at **${state?.battery?.voltage ?? 380}V** with a battery health score of **${state?.battery?.score ?? 100}%**. If you're experiencing fast charge throttling, cells might be warming above 42°C. Keep sustained charging current low to maintain cell efficiency.`;
    } else if (lastUserMsg.includes("engine") || lastUserMsg.includes("rpm") || lastUserMsg.includes("overheat")) {
      reply = `Analyzing the active ICE drivetrain data: current RPM is **${state?.engine?.rotationalSpeed ?? 2800}**, and engine heat is logged at **${state?.engine?.processTemp ?? 85}°C**. The thermal delta suggests the radiator fluid cycle is working within expected limits. Avoid high throttle if process temp rises past 105°C.`;
    } else if (lastUserMsg.includes("vibrate") || lastUserMsg.includes("shak") || lastUserMsg.includes("fault")) {
      reply = `Our mechanical vibration sensors logged an amplitude of **${state?.fault?.vibration ?? 1.2} mm/s²** at **${state?.fault?.speed ?? 85} km/h**. Since the status reports \`${state?.fault?.faultType ?? "Normal"}\`, structural component alignments are stable. Let me know if you would like me to detail spark-misfire vibrational profiles!`;
    } else {
      reply = `Hello! I am your onboard AutoCare AI copilot. I am currently running in **Simulation Mode** because your \`GEMINI_API_KEY\` is not configured yet. 

Once configured in **Settings > Secrets**, I can offer deep real-time Formula 1 diagnostic breakdown, EV thermodynamics advice, and respond to fully customizable automotive questions. How else can I assist with your telemetry state right now?`;
    }

    return res.json({
      success: false,
      reply
    });
  }

  try {
    // Construct rich chat history prompt
    const stateBrief = `
CURRENT VEHICLE REAL-TIME STATE:
- Active Profile: ${state.activePreset}
- Engine Score: ${state.engine.score}/100 (Risk: ${state.engine.risk}, Temperature: ${state.engine.processTemp}°C, RPM: ${state.engine.rotationalSpeed}, Torque: ${state.engine.torque}Nm, Valve Wear: ${state.engine.toolWear}m)
- Battery Score: ${state.battery.score}/100 (Risk: ${state.battery.risk}, Voltage: ${state.battery.voltage}V, Temp: ${state.battery.temperature}°C, Cycles: ${state.battery.cycles}, Current Draw: ${state.battery.currentDraw}A)
- Vibration Status: Vibration Amplitude ${state.fault.vibration} mm/s², RPM ${state.fault.rpm}, Speed ${state.fault.speed} km/h. Diagnostics: ${state.fault.faultType} (Severity: ${state.fault.severity})
`;

    const chatHistory = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // To use chat session elegantly, we create a chat with initial context
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are AutoCare AI, the premium virtual telemetry copilot for high-performance automotive platforms. 
You are embedded directly in the dashboard UI of the vehicle. 
Always answer mechanical, battery, thermodynamics, and diagnostic questions using the real-time vehicle state provided below.
Current State:
${stateBrief}

Maintain a helpful, crisp, elite-level automotive engineer persona. Do not invent details not supported by engineering science. Keep formatting clear and utilize rich Markdown.`,
      }
    });

    // Send history context
    // We send messages except the last one to load history, then send the last one
    // But a simple alternative to avoid multiple API roundtrips is to send the last message directly, as we initialized systemInstructions with state context!
    // To ensure full conversation flow, we can play the chat sequence or send the last user message.
    const lastUserMessage = messages[messages.length - 1].text;
    const chatResponse = await chat.sendMessage({
      message: lastUserMessage
    });

    res.json({
      success: true,
      reply: chatResponse.text
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: "Failed to fetch response from vehicle AI processor." });
  }
});

// ----------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoCare AI Full-Stack Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
