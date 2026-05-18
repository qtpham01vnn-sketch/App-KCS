import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const ANALYTICAL_LOGS = [
  'Đang kết nối tới máy chủ AI của Memories...',
  'Đang quét bố cục hình ảnh, nhận diện các vật thể chính...',
  'Phát hiện 3 chân dung nụ cười, 2 vạt nắng chiều Positano...',
  'Tính toán phân tích cảm xúc và chọn bài hát phù hợp...',
  'Đang dệt nhạc nền Bella Ciao đồng điệu với nhịp thở câu chuyện...',
  'Đang dựng hoạt ảnh 3D lật trang vật lý cho album ảnh...',
  'Tối ưu hóa các hạt ánh sáng ambient glow ấm áp...',
  'Hoàn thành! Đang chuyển tiếp bạn tới thế giới ký ức lộng lẫy...'
];

export const AIProcessing: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [activeLogIdx, setActiveLogIdx] = useState(0);

  useEffect(() => {
    // Progress loader increment
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 45); // ~4.5 seconds to complete

    // Logs rolling rotation
    const logInterval = setInterval(() => {
      setActiveLogIdx(prev => {
        if (prev < ANALYTICAL_LOGS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, []);

  // Redirect on 100% complete
  useEffect(() => {
    if (progress === 100) {
      // Fire confetti celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
      
      const timer = setTimeout(() => {
        navigate('/album/august-amalfi');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, navigate]);

  return (
    <div className="max-w-md mx-auto py-12 space-y-8 text-center animate-fade-in">
      
      {/* Circular Rotating Glowing Loader */}
      <div className="relative flex justify-center items-center h-48">
        {/* Outer glowing rotating border */}
        <div className="absolute w-40 h-40 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        
        {/* Inner rotating counter-clockwise border */}
        <div className="absolute w-32 h-32 rounded-full border-4 border-dashed border-primary/10 border-b-primary/40 animate-reverse-spin" />
        
        {/* Center Text percentage counter */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-headline text-4xl font-bold text-primary">{progress}%</span>
          <span className="text-[10px] text-outline font-bold uppercase tracking-wider mt-1">Đang dệt ký ức</span>
        </div>
      </div>

      {/* Status Panel Details */}
      <div className="space-y-4 px-4">
        <div>
          <span className="px-2 py-0.5 rounded bg-primary/15 text-[10px] font-bold text-primary tracking-widest uppercase">Trình dựng tác phẩm</span>
          <h3 className="font-headline text-2xl font-bold text-on-surface mt-2">Dệt Ký Ức Đang Diễn Ra</h3>
          <p className="text-xs text-on-surface-variant font-body mt-1.5 leading-relaxed">
            AI đang phân tích khuôn mặt, bố cục hoàng hôn để ghép nhạc nền limoncello lãng mạn.
          </p>
        </div>

        {/* Live Rolling Logs Card */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 text-left min-h-[90px] flex items-start gap-3 shadow-inner">
          <RefreshCw className="h-4 w-4 text-primary animate-spin mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Nhật ký AI</span>
            <p className="text-xs font-semibold text-on-surface-variant font-body leading-relaxed animate-pulse">
              {ANALYTICAL_LOGS[activeLogIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* Shield trust note */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-outline font-medium">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <span>Bảo mật hình ảnh 100% trên thiết bị nội bộ của bạn.</span>
      </div>

    </div>
  );
};
