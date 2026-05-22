"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";

export default function CreateProjectPage() {
  const router = useRouter();
  const { settings, isLoaded } = useSettings();
  const [mode, setMode] = useState<"url" | "script">("url");
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("Analyzing Content...");
  const [progress, setProgress] = useState(0);

  const startGeneration = async () => {
    if (!isLoaded || !settings.geminiKey) {
      alert("Please configure your Gemini API Key in Settings first.");
      router.push("/settings");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setStatusText("Connecting to Gemini AI...");

    try {
      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.geminiKey}`
        },
        body: JSON.stringify({ mode, inputText })
      });

      setProgress(60);
      setStatusText("Generating Storyboard Scenes...");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate storyboard");
      }

      setProgress(90);
      setStatusText("Finalizing Workspace...");

      // Save storyboard to local storage for the workspace to pick up
      localStorage.setItem("tuanpham_current_storyboard", JSON.stringify(data.storyboard));
      
      setProgress(100);
      
      // Navigate to Workspace
      setTimeout(() => {
        router.push("/");
      }, 500);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during generation");
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center relative bg-background">
      {/* Glowing Background Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#4edea3]/5 rounded-full blur-[100px] animate-pulse-glow"></div>
      </div>

      {/* Centralized Input Area */}
      <div className="relative z-10 w-full max-w-3xl px-6">
        <div className="glass-panel p-8 rounded-xl shadow-2xl space-y-6 bg-zinc-900/40">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#e5e1e4]">Create New Project</h1>
            <p className="text-[#a1a1aa] text-sm">Transform your ideas into cinematic storyboards using our AI engine.</p>
          </div>

          {/* Mode Selector */}
          <div className="flex p-1 bg-[#0e0e10] border border-[#3c4a42] rounded-lg w-fit mx-auto">
            <button
              onClick={() => setMode("url")}
              className={`px-6 py-2 rounded text-[11px] font-semibold uppercase tracking-[0.05em] transition-all ${
                mode === "url"
                  ? "text-[#4edea3] bg-[#353437] border border-[#4edea3]/20"
                  : "text-[#a1a1aa] hover:text-[#e5e1e4]"
              }`}
            >
              URL
            </button>
            <button
              onClick={() => setMode("script")}
              className={`px-6 py-2 rounded text-[11px] font-semibold uppercase tracking-[0.05em] transition-all ${
                mode === "script"
                  ? "text-[#4edea3] bg-[#353437] border border-[#4edea3]/20"
                  : "text-[#a1a1aa] hover:text-[#e5e1e4]"
              }`}
            >
              Script
            </button>
          </div>

          {/* Input Area */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4edea3]/20 to-[#4cd7f6]/20 rounded-lg blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-48 bg-[#0e0e10] border border-[#3c4a42] rounded-lg p-4 font-mono text-[#e5e1e4] placeholder:text-[#a1a1aa]/50 focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]/30 transition-all resize-none text-sm"
                placeholder={mode === "url" ? "Paste article URL or video link here..." : "Paste your video script or transcript here..."}
              />
              {/* Input Meta */}
              <div className="absolute bottom-3 right-3 flex items-center gap-4 text-[#a1a1aa]">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span className="font-mono text-[10px]">AUTO-DETECT</span>
                </div>
                <span className="font-mono text-[10px]">{inputText.length} CHARS</span>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={startGeneration}
              disabled={isGenerating || inputText.length === 0}
              className={`group relative px-10 py-4 bg-[#4edea3] text-[#003824] rounded-lg text-lg font-semibold flex items-center gap-3 transition-all ${
                isGenerating || inputText.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#10b981] active:scale-95 neon-glow"
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
              {isGenerating ? "Processing..." : "Generate Storyboard"}
              {!isGenerating && inputText.length > 0 && (
                 <div className="absolute -inset-1 bg-[#4edea3]/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              )}
            </button>

            {/* AI Pulse Preview */}
            {isGenerating && (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#a1a1aa]">
                  <span>{statusText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1 bg-[#353437] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 gap-2 h-16">
                  <div className="bg-[#2a2a2c] animate-pulse rounded border border-[#3c4a42]"></div>
                  <div className="bg-[#2a2a2c] animate-pulse rounded border border-[#3c4a42]" style={{ animationDelay: "150ms" }}></div>
                  <div className="bg-[#2a2a2c] animate-pulse rounded border border-[#3c4a42]" style={{ animationDelay: "300ms" }}></div>
                  <div className="bg-[#2a2a2c] animate-pulse rounded border border-[#3c4a42]" style={{ animationDelay: "450ms" }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
