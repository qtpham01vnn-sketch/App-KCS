"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPage() {
  const { settings, saveSettings, isLoaded } = useSettings();
  const [showGemini, setShowGemini] = useState(false);
  const [showEleven, setShowEleven] = useState(false);
  const [showLucy, setShowLucy] = useState(false);

  // local state for form so we can discard
  const [localGemini, setLocalGemini] = useState("");
  const [localEleven, setLocalEleven] = useState("");

  // Sync when loaded
  useEffect(() => {
    if (isLoaded) {
      setLocalGemini(settings.geminiKey);
      setLocalEleven(settings.elevenLabsKey);
    }
  }, [isLoaded]);

  const handleSave = () => {
    saveSettings({
      geminiKey: localGemini,
      elevenLabsKey: localEleven,
    });
    alert("Settings saved to local storage!");
  };

  const handleDiscard = () => {
    setLocalGemini(settings.geminiKey);
    setLocalEleven(settings.elevenLabsKey);
  };

  if (!isLoaded) return <div className="p-4 text-[#a1a1aa]">Loading settings...</div>;

  return (
    <div className="flex-1 w-full p-2 md:p-4 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#e5e1e4]">Local Settings</h1>
            <div className="flex items-center gap-2 mt-1 text-[#ffb4ab]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <p className="text-xs">Keys are stored locally in your browser's encrypted storage.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDiscard} className="bg-[#2a2a2c] text-[#e5e1e4] px-6 py-2 rounded text-[11px] font-semibold uppercase tracking-[0.05em] hover:bg-[#353437] transition-all">
              Discard
            </button>
            <button onClick={handleSave} className="bg-[#4edea3] text-[#003824] px-6 py-2 rounded text-[11px] font-bold uppercase tracking-[0.05em] hover:brightness-110 active:scale-95 transition-all">
              Save Configuration
            </button>
          </div>
        </header>

        {/* Bento Grid Settings Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* AI Foundation Section */}
          <section className="md:col-span-8 glass-panel rounded-xl ai-border overflow-hidden bg-zinc-900/40">
            <div className="p-3 bg-[#1c1b1d]/50 border-b border-[#3c4a42] flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <svg className="w-5 h-5 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24"><path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4]">LLM Configuration</span>
              </div>
              <span className="text-[12px] font-medium font-mono text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded">PRO ENGINE</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">Gemini API Key</label>
                <div className="relative">
                  <input
                    type={showGemini ? "text" : "password"}
                    value={localGemini}
                    onChange={(e) => setLocalGemini(e.target.value)}
                    className="w-full bg-[#0e0e10] border border-[#3c4a42] rounded p-3 font-mono focus:ring-0 focus:outline-none glow-cyan transition-all text-[#e5e1e4]"
                    placeholder="Enter your Gemini Pro API key..."
                  />
                  <button
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#e5e1e4]"
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-[#a1a1aa]">Used for script generation and scene descriptions.</p>
                  <button className="text-[#4cd7f6] text-[11px] font-semibold uppercase tracking-[0.05em] hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Test Connection
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#3c4a42]">
                <div className="p-4 bg-[#201f22] rounded border border-[#3c4a42]/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4]">Auto-Save Sessions</span>
                    <div className="w-8 h-4 bg-[#4edea3] rounded-full relative cursor-pointer" onClick={() => saveSettings({ autoSave: !settings.autoSave })}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${settings.autoSave ? "bg-[#003824] right-0.5" : "bg-zinc-500 left-0.5"}`}></div>
                    </div>
                  </div>
                  <p className="text-xs text-[#a1a1aa]">Persists AI chat context across studio sessions.</p>
                </div>
                <div className="p-4 bg-[#201f22] rounded border border-[#3c4a42]/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4]">Safety Filters</span>
                    <div className="w-8 h-4 rounded-full relative cursor-pointer transition-all bg-[#353437]" onClick={() => saveSettings({ safetyFilters: !settings.safetyFilters })}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${settings.safetyFilters ? "bg-[#003824] right-0.5" : "bg-[#a1a1aa] left-0.5"}`}></div>
                    </div>
                  </div>
                  <p className="text-xs text-[#a1a1aa]">Bypasses strict content filters for creative freedom.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Engine Section */}
          <section className="md:col-span-4 glass-panel rounded-xl overflow-hidden flex flex-col bg-zinc-900/40">
            <div className="p-3 bg-[#1c1b1d]/50 border-b border-[#3c4a42]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#4cd7f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4]">Voice Generation</span>
              </div>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">ElevenLabs Key</label>
                <div className="relative">
                  <input
                    type={showEleven ? "text" : "password"}
                    value={localEleven}
                    onChange={(e) => setLocalEleven(e.target.value)}
                    className="w-full bg-[#0e0e10] border border-[#3c4a42] rounded p-3 font-mono focus:ring-0 focus:outline-none glow-cyan text-[#e5e1e4]"
                    placeholder="Enter your ElevenLabs API key..."
                  />
                  <button
                    onClick={() => setShowEleven(!showEleven)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#e5e1e4]"
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">LucyLab Engine</label>
                <div className="relative">
                  <input
                    type={showLucy ? "text" : "password"}
                    className="w-full bg-[#0e0e10] border border-[#3c4a42] rounded p-3 font-mono focus:ring-0 focus:outline-none glow-cyan text-[#e5e1e4]"
                    placeholder="LucyLab Access Key"
                  />
                  <button
                    onClick={() => setShowLucy(!showLucy)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#e5e1e4]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="mt-auto pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Status:</span>
                  <span className="text-[#4edea3] flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span> Connected
                  </span>
                </div>
                <button className="w-full py-2 bg-[#353437] text-[#e5e1e4] rounded text-[11px] font-semibold uppercase tracking-[0.05em] border border-[#3c4a42] hover:bg-[#39393b] transition-all">
                  Test Voice Feed
                </button>
              </div>
            </div>
          </section>

          {/* Visual Provider Toggles */}
          <section className="md:col-span-12 glass-panel rounded-xl overflow-hidden bg-zinc-900/40">
            <div className="p-3 bg-[#1c1b1d]/50 border-b border-[#3c4a42]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#d0bcff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4]">Image Providers</span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Imagen */}
              <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0e0e10] border border-[#3c4a42] hover:border-[#4edea3]/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#e5e1e4]">Imagen</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded">Connected</span>
                </div>
                <p className="text-xs text-[#a1a1aa]">Google's high-fidelity text-to-image model for cinematic textures.</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#a1a1aa]">Enabled</span>
                  <div className="w-10 h-5 bg-[#4edea3] rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-[#003824] rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* DALL-E */}
              <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0e0e10] border border-[#3c4a42] hover:border-[#ffb4ab]/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#e5e1e4]">DALL-E 3</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-0.5 rounded">Missing Key</span>
                </div>
                <p className="text-xs text-[#a1a1aa]">OpenAI's benchmark image generator for complex prompts.</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#a1a1aa]">Enabled</span>
                  <div className="w-10 h-5 bg-[#353437] rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-[#a1a1aa] rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Flux */}
              <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0e0e10] border border-[#3c4a42] hover:border-[#4cd7f6]/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#e5e1e4]">Flux.1</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded">Connected</span>
                </div>
                <p className="text-xs text-[#a1a1aa]">State-of-the-art open weights model for realistic human figures.</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#a1a1aa]">Enabled</span>
                  <div className="w-10 h-5 bg-[#4edea3] rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-[#003824] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
