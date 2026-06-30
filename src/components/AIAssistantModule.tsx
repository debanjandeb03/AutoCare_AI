/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Terminal, 
  Sparkles, 
  HelpCircle, 
  FileText, 
  AlertTriangle,
  Flame,
  Wrench,
  Loader2
} from "lucide-react";
import { VehicleTelemetryState, ChatMessage } from "../types";

// Reliable custom light markdown-to-HTML formatter to display Gemini's diagnostic logs beautifully
function renderDiagnosticReport(markdown: string) {
  if (!markdown) return null;
  
  const lines = markdown.split("\n");
  let inList = false;
  let inCode = false;

  return lines.map((line, idx) => {
    // Check code blocks
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      return null;
    }

    if (inCode) {
      return (
        <pre key={idx} className="bg-[#050505] p-3 rounded-lg border border-white/5 font-mono text-[11px] text-cyan-400 overflow-x-auto my-2">
          <code>{line}</code>
        </pre>
      );
    }

    // Headers
    if (line.startsWith("### ")) {
      return <h4 key={idx} className="text-sm font-bold text-white font-sans mt-4 mb-2 uppercase tracking-wide border-b border-white/5 pb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {line.replace("### ", "")}</h4>;
    }
    if (line.startsWith("## ")) {
      return <h3 key={idx} className="text-base font-extrabold text-cyan-400 font-sans mt-5 mb-2 uppercase tracking-wider flex items-center gap-2"><Bot className="w-4 h-4" /> {line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={idx} className="text-lg font-black text-white font-sans mt-6 mb-3 uppercase tracking-widest border-l-4 border-cyan-400 pl-3">{line.replace("# ", "")}</h2>;
    }

    // Bold replacement
    let processedText: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    // Fast inline styling for bold words
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        processedText.push(line.substring(lastIndex, match.index));
      }
      processedText.push(
        <strong key={match.index} className="text-white font-bold font-sans">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      processedText.push(line.substring(lastIndex));
    }

    // Render lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const cleanLine = line.trim().substring(2);
      return (
        <li key={idx} className="ml-5 list-disc text-gray-300 font-mono text-xs leading-relaxed my-1">
          {processedText.length > 0 ? processedText : cleanLine}
        </li>
      );
    }

    // Empty lines
    if (line.trim() === "") {
      return <div key={idx} className="h-2" />;
    }

    // Standard paragraphs
    return (
      <p key={idx} className="text-gray-300 font-mono text-xs leading-relaxed my-1.5">
        {processedText.length > 0 ? processedText : line}
      </p>
    );
  });
}

interface AIAssistantModuleProps {
  state: VehicleTelemetryState;
}

export default function AIAssistantModule({ state }: AIAssistantModuleProps) {
  const [report, setReport] = useState<string>("");
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Onboard diagnostic core synchronized. I have loaded your real-time vehicle telemetry vectors. Ask me any thermodynamic, battery performance, or physical structural vibration questions regarding your vehicle status.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle generating full AI Diagnostic Report
  const handleGenerateReport = () => {
    setGeneratingReport(true);
    setReport("");
    
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    })
      .then((res) => res.json())
      .then((data) => {
        setReport(data.explanation || "Failed to compile AI Diagnostic Log.");
        setGeneratingReport(false);
      })
      .catch((err) => {
        console.error("Error compiling diagnostic report:", err);
        setReport("Fault on telemetry route. Verify server status.");
        setGeneratingReport(false);
      });
  };

  // Handle sending chat message
  const handleSendMessage = (textToSend?: string) => {
    const msgText = textToSend ?? inputMessage;
    if (!msgText.trim() || sendingMessage) return;

    if (!textToSend) setInputMessage("");

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: msgText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSendingMessage(true);

    // Call chat API
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
        state
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          text: data.reply || "Diagnostic core offline. Retrying link...",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setSendingMessage(false);
      })
      .catch((err) => {
        console.error("Error sending AI query:", err);
        const errMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          text: "Sync failure. Connection link interrupted.",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setSendingMessage(false);
      });
  };

  const sampleQuestions = [
    "Explain current engine thermodynamic status",
    "How does sub-zero temp affect my EV cells?",
    "Why are cylinder wall wear minutes logged?",
    "Is my current vibrational frequency safe?"
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full select-text">
      
      {/* Left panel: Executive AI report generator */}
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[650px] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/5 pb-3 mb-4">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Onboard AI diagnostic Log
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Compiled telemetry thermal-dynamic stress analysis</span>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-[#050505] disabled:text-gray-600 text-black font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
          >
            {generatingReport ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ANALYZING PACK...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                GENERATE ASSESSMENT
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Output Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#050505] border border-white/5 rounded-xl p-5 font-mono text-gray-300 relative select-text scrollbar-thin">
          {generatingReport ? (
            <div className="flex flex-col gap-3 items-center justify-center h-full text-gray-500">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">Initializing Cognitive Diagnostics</span>
                <span className="text-[10px] text-gray-600 mt-1">Interrogating thermal channels & vibration FFT...</span>
              </div>
            </div>
          ) : report ? (
            <div className="report-content select-text">
              {renderDiagnosticReport(report)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center p-6 select-none">
              <Terminal className="w-10 h-10 text-gray-700 mb-3" />
              <p className="font-bold text-xs uppercase tracking-wider text-gray-400">Diagnostic Board Idle</p>
              <p className="text-[11px] leading-relaxed mt-1.5 max-w-sm text-gray-500">
                Click **Generate Assessment** to prompt Gemini to compile a professional Formula 1 style telemetry briefing.
              </p>
            </div>
          )}
        </div>

        {/* Status ticker */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-3 border-t border-white/5 pt-3 select-none">
          <span>COMPILER: gemini-2.5-flash</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI LINK STABLE
          </span>
        </div>
      </div>

      {/* Right panel: Engineering copilot Q&A */}
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[650px] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3 mb-4 select-none">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-sans">Engineering Copilot Desk</h3>
            <span className="text-[10px] text-gray-500 font-mono">Talk to your onboard mechanical thermodynamicist</span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto bg-[#050505]/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 scrollbar-thin mb-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
              >
                <div className={`p-3 rounded-xl border font-mono text-xs leading-relaxed ${
                  isUser 
                    ? "bg-white/5 border-white/5 text-white rounded-br-none" 
                    : "bg-[#050505] border-white/5 text-gray-300 rounded-bl-none shadow-md shadow-black/10"
                }`}>
                  {/* Inline rich text inside message bubbles */}
                  {isUser ? msg.text : renderDiagnosticReport(msg.text)}
                </div>
                <span className="text-[9px] text-gray-650 font-mono mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}
          
          {sendingMessage && (
            <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] bg-[#050505] border border-white/5 px-3 py-2 rounded-lg self-start">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              Copilot is calculating diagnostic vector...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mb-3 select-none">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-[10px] text-gray-400 bg-[#050505]/60 hover:bg-[#050505] border border-white/5 hover:border-white/10 px-2.5 py-1.5 rounded-md font-mono transition-colors text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Interrogate powertrain, cooling index, or EV pack chemistry..."
            className="flex-1 bg-[#050505] border border-white/5 focus:border-white/10 outline-none text-xs font-mono rounded-lg px-4 text-white placeholder-gray-600"
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors shadow-[0_0_15px_rgba(34,211,238,0.15)] cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>

      </div>

    </div>
  );
}
