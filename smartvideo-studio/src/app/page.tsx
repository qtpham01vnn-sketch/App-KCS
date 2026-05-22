"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function WorkspacePage() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [storyboard, setStoryboard] = useState<any[]>([]);

  const { settings, isLoaded } = useSettings();
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [audioProvider, setAudioProvider] = useState("google-tts");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const ffmpegRef = useRef<any>(null);

  // Render State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");

  // Fetch ElevenLabs voices when settings are loaded
  useEffect(() => {
    if (isLoaded && settings.elevenLabsKey) {
      fetch("/api/elevenlabs/voices", {
        headers: { "Authorization": `Bearer ${settings.elevenLabsKey}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVoices(data.voices);
          if (data.voices.length > 0) setSelectedVoiceId(data.voices[0].voice_id);
        } else {
          alert("Lỗi tải Voices ElevenLabs: " + (data.error || "Unknown error"));
          setVoices([{ voice_id: "error", name: "Error Loading Voices" }]);
        }
      })
      .catch(e => {
        console.error(e);
        alert("Lỗi kết nối API ElevenLabs nội bộ");
      });
    }
  }, [isLoaded, settings.elevenLabsKey]);

  useEffect(() => {
    const stored = localStorage.getItem("tuanpham_current_storyboard");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStoryboard(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGenerateAudio = async () => {
    if (audioProvider === "elevenlabs" && (!settings.elevenLabsKey || !selectedVoiceId)) {
      alert("Please configure your ElevenLabs API Key in Settings first.");
      return;
    }
    const currentScene = storyboard[activeSlide];
    if (!currentScene?.narration) return;

    setIsGeneratingAudio(true);
    try {
      let endpoint = "/api/elevenlabs/generate";
      let bodyData: any = { text: currentScene.narration };
      let headers: any = { "Content-Type": "application/json" };

      if (audioProvider === "elevenlabs") {
        headers["Authorization"] = `Bearer ${settings.elevenLabsKey}`;
        bodyData.voice_id = selectedVoiceId;
      } else {
        endpoint = "/api/google-tts";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success && data.audio_base64) {
        const newStoryboard = [...storyboard];
        newStoryboard[activeSlide].audio_url = data.audio_base64;
        setStoryboard(newStoryboard);
        localStorage.setItem("tuanpham_current_storyboard", JSON.stringify(newStoryboard));
      } else {
        alert(data.error || "Failed to generate audio.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during audio generation.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateImage = () => {
    const currentScene = storyboard[activeSlide];
    if (!currentScene?.visual_prompt) return;

    setIsGeneratingImage(true);
    
    const seed = Math.floor(Math.random() * 1000000);
    // Sử dụng Proxy nội bộ để tránh bị Extension / Cloudflare chặn trên trình duyệt
    const url = `/api/pollinations?prompt=${encodeURIComponent(currentScene.visual_prompt)}&seed=${seed}`;
    
    const img = new window.Image();
    img.onload = () => {
      const newStoryboard = [...storyboard];
      newStoryboard[activeSlide].image_url = url;
      setStoryboard(newStoryboard);
      localStorage.setItem("tuanpham_current_storyboard", JSON.stringify(newStoryboard));
      setIsGeneratingImage(false);
    };
    img.onerror = () => {
      console.error("Failed to load image from Proxy API");
      alert("Lỗi mạng khi tải ảnh. Vui lòng thử lại!");
      setIsGeneratingImage(false);
    };
    img.src = url;
  };

  const handleRenderMP4 = async () => {
    const currentScene = storyboard[activeSlide];
    if (!currentScene?.image_url || !currentScene?.audio_url) {
      alert("Vui lòng tạo Hình ảnh và Âm thanh cho phân cảnh này trước khi Render!");
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus("Khởi động FFmpeg Core...");

    try {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('progress', ({ progress }) => {
        setRenderProgress(Math.round(progress * 100));
        setRenderStatus("Đang Render MP4 (Có thể mất 1-2 phút)...");
      });

      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: "/ffmpeg/ffmpeg-core.js",
          wasmURL: "/ffmpeg/ffmpeg-core.wasm"
        });
      }

      setRenderStatus("Đang tải dữ liệu Asset...");
      
      // Fetch image through proxy
      const imgRes = await fetch(`/api/proxy-asset?url=${encodeURIComponent(currentScene.image_url)}`);
      const imgBuffer = await imgRes.arrayBuffer();
      await ffmpeg.writeFile('image.jpg', new Uint8Array(imgBuffer));

      // Audio is already base64 data URL, fetchFile handles it directly!
      await ffmpeg.writeFile('audio.mp3', await fetchFile(currentScene.audio_url));

      setRenderStatus("Đang xử lý Video (Stitching)...");
      
      await ffmpeg.exec([
        '-loop', '1', 
        '-framerate', '30',
        '-i', 'image.jpg', 
        '-i', 'audio.mp3', 
        '-c:v', 'libx264', 
        '-preset', 'ultrafast',
        '-tune', 'stillimage', 
        '-vf', 'scale=720:-2',
        '-c:a', 'aac', 
        '-b:a', '128k', 
        '-pix_fmt', 'yuv420p', 
        '-shortest', 
        'out.mp4'
      ]);

      setRenderStatus("Hoàn tất!");
      const data = await ffmpeg.readFile('out.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Auto download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tuấn-Phạm-Studio-Scene-${activeSlide + 1}.mp4`;
      a.click();

      setTimeout(() => {
        setIsRendering(false);
      }, 1500);
    } catch(e) {
      console.error(e);
      alert("Quá trình Render thất bại. Vui lòng kiểm tra Console log.");
      setIsRendering(false);
    }
  };

  useEffect(() => {
    const handleTrigger = () => handleRenderMP4();
    window.addEventListener("trigger_render_mp4", handleTrigger);
    return () => window.removeEventListener("trigger_render_mp4", handleTrigger);
  }, [storyboard, activeSlide]);

  if (storyboard.length === 0) {
    return (
      <div className="flex-1 w-full flex items-center justify-center relative bg-background flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#e5e1e4]">No Project Loaded</h2>
        <button 
          onClick={() => router.push("/create")}
          className="px-6 py-2 bg-[#4edea3] text-[#003824] font-bold rounded-lg uppercase tracking-wide hover:opacity-90"
        >
          Create New Project
        </button>
      </div>
    );
  }

  const currentScene = storyboard[activeSlide] || storyboard[0];

  return (
    <>
      {/* LEFT PANEL: Storyboard List */}
      <section className="w-80 h-full bg-[#1c1b1d] border-r border-[#3c4a42] flex flex-col shrink-0">
        <div className="p-3 flex items-center justify-between border-b border-[#3c4a42]">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Storyboard</h2>
          <button className="w-8 h-8 rounded bg-[#4edea3]/10 text-[#4edea3] flex items-center justify-center hover:bg-[#4edea3]/20 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14m-7-7h14"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {storyboard.map((scene, index) => (
            <div
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`p-2 rounded-lg relative group cursor-pointer transition-all ${
                activeSlide === index
                  ? "bg-[#353437] border border-[#4edea3]/50"
                  : "bg-[#201f22] border border-transparent hover:border-[#3c4a42]"
              }`}
            >
              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-[#a1a1aa] cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
              <div className="ml-4">
                <div className="aspect-video w-full rounded overflow-hidden relative mb-2 bg-zinc-800 flex items-center justify-center">
                   {/* Thumbnail Image */}
                  <div className="absolute inset-0 z-0">
                    {scene.image_url ? (
                      <img src={scene.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#3c4a42] text-xs font-medium bg-black/40">
                        Image Pending
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{scene.duration_seconds}s</div>
                  {activeSlide === index && (
                    <div className="absolute top-1 right-1 bg-[#4edea3] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#003824] font-bold">ACTIVE</div>
                  )}
                </div>
                <h3 className={`text-[11px] font-semibold uppercase tracking-[0.05em] truncate ${activeSlide === index ? "text-[#4edea3]" : "text-[#bbcabf]"}`}>
                  Scene 0{scene.scene_number}
                </h3>
                <p className="text-[10px] text-[#a1a1aa] line-clamp-1 italic">
                  "{scene.narration}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CENTER PANEL: Video Preview & Controls */}
      <section className="flex-1 flex flex-col bg-[#131315] overflow-hidden relative min-w-0">
        {/* Preview Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden">
          {/* High-quality Portrait Preview */}
          <div className="aspect-[9/16] h-full max-h-[700px] bg-zinc-900 shadow-2xl relative border border-[#3c4a42]/30 rounded-sm overflow-hidden group flex items-center justify-center">
            {currentScene.image_url ? (
              <img src={currentScene.image_url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-600 font-mono text-sm">Image Preview</span>
            )}
            {/* Subtitle Overlay */}
            <div className="absolute bottom-16 left-0 w-full px-6 text-center">
              <p className="text-lg font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4 py-2 glass-panel rounded-lg inline-block">
                {currentScene.narration}
              </p>
            </div>
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 cursor-pointer">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z" fill="currentColor"/></svg>
            </div>
          </div>
        </div>

        {/* Preview Controls Bar */}
        <div className="h-24 bg-[#1c1b1d] border-t border-[#3c4a42] flex flex-col px-3 justify-center gap-2">
          {/* Seek Bar */}
          <div className="relative w-full h-1 bg-[#353437] rounded-full cursor-pointer mt-1">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-[#4edea3] rounded-full relative">
              <div className="absolute -right-1.5 -top-1.5 w-4 h-4 bg-[#4edea3] border-2 border-white rounded-full shadow-lg"></div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-mono text-[#a1a1aa] uppercase">
              <span>0:00:00:00</span>
              <span>0:00:30:00</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 text-[#a1a1aa] hover:text-[#e5e1e4] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                 <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="m5 3 14 9-14 9V3z"/></svg>
              </button>
              <button className="p-2 text-[#a1a1aa] hover:text-[#e5e1e4] transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-6 py-2 rounded bg-[#353437] border border-[#3c4a42] text-[#e5e1e4] text-[11px] font-semibold uppercase tracking-[0.05em] hover:bg-[#39393b] transition-all">
                Save Project
              </button>
              <button 
                onClick={handleRenderMP4}
                className="px-6 py-2 rounded bg-[#4edea3] text-[#003824] text-[11px] font-bold uppercase tracking-[0.05em] neon-glow hover:opacity-90 active:scale-95 transition-all"
              >
                Render MP4
              </button>
            </div>
          </div>
        </div>

      {/* Render Modal */}
      {isRendering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e0e10] border border-[#3c4a42] rounded-xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
            {renderStatus === "Done" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#4edea3]/20 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#4edea3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Render Complete!</h3>
                <p className="text-sm text-zinc-400 text-center mb-6">Your video has been successfully generated.</p>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setIsRendering(false)}
                    className="flex-1 py-2.5 rounded bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      alert("Tính năng tải MP4 thật sẽ được tích hợp ở bản Pro!");
                      setIsRendering(false);
                    }}
                    className="flex-1 py-2.5 rounded bg-[#4edea3] text-[#003824] font-bold text-sm hover:bg-[#3bc78f] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download MP4
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-20 h-20 mb-6">
                  <svg className="animate-spin w-full h-full text-zinc-800" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75 text-[#4edea3]" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                    {renderProgress > 0 ? `${renderProgress}%` : '...'}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-wide">Rendering Video...</h3>
                <p className="text-xs text-[#4edea3] uppercase tracking-widest animate-pulse">{renderStatus}</p>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="h-full bg-[#4edea3] transition-all duration-500 ease-out"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>

      {/* RIGHT PANEL: Editor */}
      <section className="w-96 h-full bg-[#201f22] border-l border-[#3c4a42] flex flex-col overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-3 border-b border-[#3c4a42] bg-[#2a2a2c]/50 sticky top-0 z-10">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Editor - Scene 0{currentScene.scene_number}</h2>
        </div>

        {/* Content Section */}
        <details className="group border-b border-[#3c4a42]" open>
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2a2a2c] transition-colors list-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa] group-open:text-[#4edea3]">
              Content
            </span>
            <svg className="w-5 h-5 text-[#a1a1aa] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div className="p-4 space-y-4 pt-0">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                Narration Text
              </label>
              <textarea
                className="w-full h-24 bg-black border border-[#3f3f46] rounded-lg p-3 text-xs text-[#e5e1e4] focus:border-[#4cd7f6] transition-all outline-none resize-none glow-cyan"
                value={currentScene.narration}
                onChange={() => {}}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                Subtitle Text
              </label>
              <textarea
                className="w-full h-16 bg-black border border-[#3f3f46] rounded-lg p-3 text-xs text-[#e5e1e4] focus:border-[#4cd7f6] transition-all outline-none resize-none glow-cyan"
                value={currentScene.narration}
                onChange={() => {}}
              />
            </div>
          </div>
        </details>

        {/* Image Section (AI) */}
        <details className="group border-b border-[#3c4a42]" open>
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2a2a2c] transition-colors border-t-2 border-[#8b5cf6] list-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa] group-open:text-[#8b5cf6]">
              Image Generation
            </span>
            <svg className="w-5 h-5 text-[#a1a1aa] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div className="p-4 space-y-4 pt-0">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                Visual Prompt
              </label>
              <textarea 
                className="w-full h-24 bg-[#0e0e10] border border-[#3f3f46] rounded p-2 text-xs text-[#e5e1e4] focus:outline-none focus:border-[#d0bcff] transition-colors resize-none"
                value={currentScene.visual_prompt || ""}
                onChange={(e) => {
                  const newStoryboard = [...storyboard];
                  newStoryboard[activeSlide].visual_prompt = e.target.value;
                  setStoryboard(newStoryboard);
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                  Provider
                </label>
                <select className="w-full bg-black border border-[#3f3f46] rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4] outline-none appearance-none">
                  <option>Flux.1 (Pollinations Free)</option>
                  <option disabled>DALL-E 3 (Requires Key)</option>
                </select>
              </div>
              <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="mt-auto h-[34px] px-3 bg-[#8b5cf6] text-white rounded flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.05em]">Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.05em]">Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </details>

        {/* Voice Section */}
        <details className="group border-b border-[#3c4a42]" open>
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2a2a2c] transition-colors list-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa] group-open:text-[#4cd7f6]">
              Voice & Audio
            </span>
             <svg className="w-5 h-5 text-[#a1a1aa] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div className="p-4 space-y-4 pt-0">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                Voice Engine
              </label>
              <select 
                className="w-full bg-black border border-[#3f3f46] rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4] outline-none appearance-none"
                value={audioProvider}
                onChange={(e) => setAudioProvider(e.target.value)}
              >
                <option value="google-tts">Google Tiếng Việt (FREE)</option>
                <option value="elevenlabs">ElevenLabs Premium</option>
              </select>
            </div>
            
            {audioProvider === "elevenlabs" && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#a1a1aa]">
                  Character (ElevenLabs)
                </label>
                <select 
                  className="w-full bg-black border border-[#3f3f46] rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#e5e1e4] outline-none appearance-none"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                >
                  {voices.length === 0 ? (
                    <option disabled value="">{settings.elevenLabsKey ? "Loading voices..." : "Missing API Key"}</option>
                  ) : (
                    voices.map((v: any) => (
                      <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}
            
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio || (audioProvider === "elevenlabs" && (!settings.elevenLabsKey || voices.length === 0))}
                className="w-full py-2 bg-[#4cd7f6] text-[#00333d] rounded text-[11px] font-bold uppercase tracking-[0.05em] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingAudio ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#00333d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    Generate Audio
                  </>
                )}
              </button>

              {currentScene.audio_url && (
                <div className="mt-2 bg-black border border-[#4cd7f6]/30 p-2 rounded-lg">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-[#4cd7f6] mb-1 block">Audio Ready</span>
                  <audio controls className="w-full h-8 outline-none" src={currentScene.audio_url} />
                </div>
              )}
            </div>
          </div>
        </details>
      </section>
    </>
  );
}
