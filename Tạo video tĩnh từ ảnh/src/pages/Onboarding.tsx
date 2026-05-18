import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Palette, 
  Music, 
  Share2, 
  CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Step {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps: Step[] = [
    {
      title: 'Bước 1: Chọn ảnh thông minh',
      desc: 'Công nghệ AI quét toàn bộ thư viện ảnh, tự động nhận diện và chọn ra những bức ảnh rõ nét nhất, ngập tràn nụ cười và cảm xúc ấm áp.',
      icon: <ImageIcon className="h-8 w-8 text-primary" />
    },
    {
      title: 'Bước 2: Chọn phong cách nghệ thuật',
      desc: 'Tự do lựa chọn bầu không khí: Cổ điển (Classic), Lật trang 3D sống động (3D Flip), hay Tự sự giàu chất thơ (Storytelling).',
      icon: <Palette className="h-8 w-8 text-primary" />
    },
    {
      title: 'Bước 3: Nhạc nền khơi gợi cảm xúc',
      desc: 'Đồng bộ hóa nhịp điệu ảnh với các bản nhạc cụ piano mượt mà hay tiếng phong cầm rộn rã lúc chiều tà, nâng tầm cảm xúc người xem.',
      icon: <Music className="h-8 w-8 text-primary" />
    },
    {
      title: 'Bước 4: Chia sẻ tức thì & Hợp tác',
      desc: 'Xuất video HD hoặc chia sẻ album lật trang 3D dưới dạng đường dẫn web tĩnh siêu nhẹ. Đồng thời mời bạn bè cùng góp ảnh vào album chung.',
      icon: <Share2 className="h-8 w-8 text-primary" />
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      // Completed onboarding flow!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      navigate('/');
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Onboarding steps indicator */}
      <div className="flex justify-between items-center px-2">
        {steps.map((_, idx) => (
          <div key={idx} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => setActiveStep(idx)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep === idx 
                  ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-105' 
                  : activeStep > idx 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {activeStep > idx ? <CheckCircle2 className="h-4 w-4 text-primary" /> : idx + 1}
            </button>
            {idx < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 rounded ${activeStep > idx ? 'bg-primary/30' : 'bg-surface-container-high'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Main card panel */}
      <div className="tactile-paper rounded-3xl border border-outline/10 p-6 flex flex-col items-center text-center gap-6 min-h-[380px] justify-between">
        
        {/* Step Icon with floating animation */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner mt-4 animate-pulse">
          {steps[activeStep].icon}
        </div>

        {/* Step Text details */}
        <div className="space-y-3 px-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Hướng dẫn sử dụng</span>
          <h3 className="font-headline text-2xl font-bold text-on-surface leading-tight">
            {steps[activeStep].title}
          </h3>
          <p className="text-xs text-on-surface-variant font-body leading-relaxed max-w-sm">
            {steps[activeStep].desc}
          </p>
        </div>

        {/* Illustrated visual mockup based on step */}
        <div className="w-full max-w-sm aspect-[16/9] rounded-xl bg-surface-container-low border border-outline/10 overflow-hidden flex items-center justify-center p-4">
          {activeStep === 0 && (
            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
              {['https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=150&auto=format&fit=crop', 
                'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=150&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=150&auto=format&fit=crop'].map((url, idx) => (
                <div key={idx} className="relative rounded overflow-hidden aspect-square border border-white/50 shadow-sm animate-pulse">
                  <img src={url} alt="Mockup" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStep === 1 && (
            <div className="flex gap-2">
              {['Classic', '3D Flip', 'Storytelling'].map((style, idx) => (
                <div key={idx} className={`px-4 py-2 rounded-xl border text-xs font-semibold shadow-sm ${idx === 1 ? 'border-primary bg-primary/10 text-primary' : 'border-outline/10 bg-surface-container-lowest text-on-surface-variant'}`}>
                  {style}
                </div>
              ))}
            </div>
          )}

          {activeStep === 2 && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/15 border border-primary/20 rounded-xl text-primary text-xs font-semibold">
                <Music className="h-4 w-4 animate-bounce" />
                <span>Bella Ciao (Italian Accordion)</span>
              </div>
              <span className="text-[10px] text-outline font-medium">Bouncing audio waves...</span>
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/10 px-4 py-2.5 rounded-xl shadow-sm">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-on-surface">memories.app/s/amalfi-2026</span>
              </div>
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded">Sẵn sàng xuất bản</span>
            </div>
          )}
        </div>

        {/* Buttons flow controls */}
        <div className="flex w-full justify-between items-center border-t border-outline/5 pt-4">
          <button
            onClick={handleBack}
            disabled={activeStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all ${
              activeStep === 0 ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            <span>{activeStep === steps.length - 1 ? 'Hoàn tất học tập' : 'Tiếp tục'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
