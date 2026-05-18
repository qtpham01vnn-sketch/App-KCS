import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, CheckCircle2, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-commissions'; // Wait, let's import the canvas-confetti directly as 'canvas-confetti'!
import confetti_lib from 'canvas-confetti';

export const Collaborate: React.FC = () => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    confetti_lib({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    setTimeout(() => {
      navigate('/');
    }, 1800);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6 animate-fade-in text-center">
      {/* Header link back */}
      <div className="flex justify-start">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại</span>
        </Link>
      </div>

      {/* Invite Card Box */}
      <div className="tactile-paper rounded-3xl border border-outline/10 p-6 flex flex-col items-center gap-5">
        
        {accepted ? (
          /* Accepted success state */
          <div className="py-8 space-y-3 animate-scale-up">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface">Đồng Ý Thành Công!</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Cuốn album "August in Amalfi" hiện đã được thêm vào Thư viện của bạn. Bạn đã sẵn sàng cùng Hoàng Nam dệt nên ký ức rồi đấy!
            </p>
          </div>
        ) : (
          /* Main pending invite state */
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-2">
              <Users className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Lời mời cộng tác</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface">Hoàng Nam mời bạn đóng góp</h3>
              <p className="text-xs text-on-surface-variant font-body max-w-xs leading-relaxed italic">
                "Hãy cùng mình tải lên những khoảnh khắc tuyệt vời nhất của nhóm tụi mình tại bờ biển Amalfi nhé! AI sẽ tự biên tập cực kỳ thơ mộng."
              </p>
            </div>

            {/* Album preview mount card */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-outline/10 shadow relative">
              <img 
                src="https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=450&auto=format&fit=crop" 
                alt="Amalfi Coast" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-left text-white">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Album chung</span>
                <h4 className="font-headline text-lg font-bold text-white mt-0.5">August in Amalfi</h4>
                <div className="flex items-center gap-3 text-[9px] font-semibold text-white/80 mt-1 uppercase tracking-wide">
                  <span>24 Photos</span>
                  <span>1 Thành viên tích cực</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full transition-all"
              >
                Bỏ qua
              </button>
              
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chấp nhận</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
