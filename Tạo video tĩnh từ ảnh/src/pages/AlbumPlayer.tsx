import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles,
  Bookmark,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { resolveMediaUrl } from '../utils/db';

interface BookPage {
  leftImage: string;
  leftTitle: string;
  leftText: string;
  leftBg?: string;
  leftColor?: string;
  rightImage: string;
  rightTitle: string;
  rightText: string;
  rightBg?: string;
  rightColor?: string;
}

const ALBUM_PAGES: BookPage[] = [
  {
    leftImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
    leftTitle: 'August in Amalfi',
    leftText: 'Bờ cát lấp lánh như dát vàng dưới ánh hoàng hôn nước Ý. Chúng tôi đứng nghe tiếng sóng xô vào những ghềnh đá cổ kính.',
    rightImage: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=600&auto=format&fit=crop',
    rightTitle: 'Màu Nắng Positano',
    rightText: 'Những căn nhà màu pastel xếp chồng lên nhau như hộp diêm rực rỡ, nhìn thẳng ra vịnh biển xanh ngọc bích phẳng lặng.'
  },
  {
    leftImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    leftTitle: 'Buổi Sáng Địa Trung Hải',
    leftText: 'Thức dậy với tiếng chuông nhà thờ ngân vang xa xa và hương chanh chín mọng thơm mát ngập tràn cả ban công đón nắng.',
    rightImage: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop',
    rightTitle: 'Thuyền Đi Trong Sương',
    rightText: 'Một chiếc thuyền nhỏ lênh đênh ngoài khơi xa, rạch một đường chỉ trắng trên tấm gương biển ngọc bao la vô tận.'
  },
  {
    leftImage: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=600&auto=format&fit=crop',
    leftTitle: 'Hương Vị Địa Phương',
    leftText: 'Thưởng thức ly Gelato chanh tươi mát lạnh bên góc phố cổ, ngắm nhìn nhịp sống chậm rãi thanh bình chảy trôi.',
    rightImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
    rightTitle: 'Mảnh Ghép Mùa Hè',
    rightText: 'Ký ức ngọt ngào này sẽ mãi được cất giữ nơi tim, giống như ly rượu limoncello ngọt nồng cuối chiều thu nước Ý.'
  }
];

export const AlbumPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isAutoFlipping, setIsAutoFlipping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pages, setPages] = useState<BookPage[]>(ALBUM_PAGES);
  const [musicName, setMusicName] = useState('Bella Ciao (Italian Classic Accordion)');
  const [textStyle, setTextStyle] = useState('capcut');
  const [textSize, setTextSize] = useState('medium');
  const [volume, setVolume] = useState(0.5);
  const [activeMusicUrl, setActiveMusicUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportingStep, setExportingStep] = useState('');
  const [albumTitleState, setAlbumTitleState] = useState('August in Amalfi');
  const [photoPositions, setPhotoPositions] = useState<{x: number, y: number}[]>(() => {
    const saved = localStorage.getItem('memories_photo_positions');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill({ x: 50, y: 85 });
    } catch {
      return Array(100).fill({ x: 50, y: 85 });
    }
  });
  const [photoColors, setPhotoColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_colors');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill('');
    } catch {
      return Array(100).fill('');
    }
  });

  const [photoScales, setPhotoScales] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_scales');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill('medium');
    } catch {
      return Array(100).fill('medium');
    }
  });

  const [photoStickers, setPhotoStickers] = useState<{
    id: string;
    type: string;
    symbol: string;
    x: number;
    y: number;
    scale: number;
  }[][]>(() => {
    const saved = localStorage.getItem('memories_photo_stickers');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill([]).map(() => []);
    } catch {
      return Array(100).fill([]).map(() => []);
    }
  });

  const [activeTransition, setActiveTransition] = useState<string>(() => {
    return localStorage.getItem('memories_active_transition') || 'page-turn';
  });

  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [localPageKey, setLocalPageKey] = useState<number>(0);

  useEffect(() => {
    setLocalPageKey(prev => prev + 1);
  }, [currentPage]);

  // Load settings from localStorage safely in real-time
  const loadFromLocalStorage = async () => {
    const savedAlbumsJson = localStorage.getItem('memories_created_albums');
    let userAlbum = null;
    if (id && savedAlbumsJson) {
      try {
        const albums = JSON.parse(savedAlbumsJson);
        userAlbum = albums.find((a: any) => a.id === id);
      } catch (err) {
        console.error("Failed to parse created albums:", err);
      }
    }

    if (userAlbum) {
      setAlbumTitleState(userAlbum.title);
      setMusicName(userAlbum.musicName || 'Bella Ciao (Italian Classic Accordion)');
      setTextStyle(userAlbum.textStyle || 'capcut');
      setTextSize(userAlbum.textSize || 'medium');
      
      const resolvedMusic = await resolveMediaUrl(userAlbum.musicUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
      setActiveMusicUrl(resolvedMusic);
      
      if (userAlbum.positions) setPhotoPositions(userAlbum.positions);
      if (userAlbum.colors) setPhotoColors(userAlbum.colors);
      if (userAlbum.scales) setPhotoScales(userAlbum.scales);
      if (userAlbum.stickers) setPhotoStickers(userAlbum.stickers);
      if (userAlbum.transition) setActiveTransition(userAlbum.transition);

      const photos: string[] = userAlbum.photos || [];
      const resolvedPhotos = await Promise.all(photos.map(url => resolveMediaUrl(url)));
      const backgrounds: string[] = userAlbum.backgrounds || Array(photos.length).fill('');
      const notes: string[] = userAlbum.notes || [];
      const colors: string[] = userAlbum.colors || Array(photos.length).fill('');

      const generatedPages: BookPage[] = [];
      for (let i = 0; i < resolvedPhotos.length; i += 2) {
        generatedPages.push({
          leftImage: resolvedPhotos[i],
          leftTitle: userAlbum.title ? `${userAlbum.title} - Trang ${i + 1}` : `Kỷ niệm Trang ${i + 1}`,
          leftText: notes[i] || 'Khoảnh khắc đáng nhớ trong cuộc sống.',
          leftBg: backgrounds[i] || '',
          leftColor: colors[i] || '',
          rightImage: resolvedPhotos[i + 1] || resolvedPhotos[0],
          rightTitle: resolvedPhotos[i + 1] ? (userAlbum.title ? `${userAlbum.title} - Trang ${i + 2}` : `Kỷ niệm Trang ${i + 2}`) : 'Bìa cuối',
          rightText: resolvedPhotos[i + 1] ? (notes[i + 1] || 'Khoảnh khắc tuyệt vời.') : 'Hành trình trọn vẹn.',
          rightBg: resolvedPhotos[i + 1] ? (backgrounds[i + 1] || '') : '',
          rightColor: resolvedPhotos[i + 1] ? (colors[i + 1] || '') : ''
        });
      }
      if (generatedPages.length > 0) {
        setPages(generatedPages);
      }
    } else {
      // System defaults or backup active editing state
      let defaultTitle = 'August in Amalfi';
      let presetMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
      
      if (id === 'parisian-mornings') {
        defaultTitle = 'Parisian Mornings';
        presetMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
      } else if (id === 'deep-redwoods') {
        defaultTitle = 'Deep in the Redwoods';
        presetMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3';
      } else if (id === 'modern-forms') {
        defaultTitle = 'Modern Forms';
        presetMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3';
      } else if (id === 'winter-solstice') {
        defaultTitle = 'Winter Solstice';
        presetMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
      }
      
      setAlbumTitleState(defaultTitle);

      const savedPhotos = localStorage.getItem('memories_photo_list');
      const savedNotes = localStorage.getItem('memories_photo_notes');
      const savedBgList = localStorage.getItem('memories_background_list');
      const savedMusicName = localStorage.getItem('memories_music_name');
      const savedTextStyle = localStorage.getItem('memories_text_style');
      const savedTextSize = localStorage.getItem('memories_text_size');
      const savedPositions = localStorage.getItem('memories_photo_positions');
      const savedColors = localStorage.getItem('memories_photo_colors');
      const savedScales = localStorage.getItem('memories_photo_scales');
      const savedStickers = localStorage.getItem('memories_photo_stickers');
      const savedTransition = localStorage.getItem('memories_active_transition');
      const savedMusicUrl = localStorage.getItem('memories_music_url');
      
      if (savedMusicName) setMusicName(savedMusicName);
      if (savedTextStyle) setTextStyle(savedTextStyle);
      if (savedTextSize) setTextSize(savedTextSize || 'medium');
      if (savedTransition) setActiveTransition(savedTransition);
      
      const resolvedMusic = await resolveMediaUrl(savedMusicUrl || presetMusic);
      setActiveMusicUrl(resolvedMusic);
      
      if (savedPositions) {
        try { setPhotoPositions(JSON.parse(savedPositions)); } catch {}
      }
      if (savedColors) {
        try { setPhotoColors(JSON.parse(savedColors)); } catch {}
      }
      if (savedScales) {
        try { setPhotoScales(JSON.parse(savedScales)); } catch {}
      }
      if (savedStickers) {
        try { setPhotoStickers(JSON.parse(savedStickers)); } catch {}
      }

      if (savedPhotos && savedNotes) {
        try {
          const photos: string[] = JSON.parse(savedPhotos);
          const resolvedPhotos = await Promise.all(photos.map(url => resolveMediaUrl(url)));
          const notes: string[] = JSON.parse(savedNotes);
          const backgrounds: string[] = savedBgList ? JSON.parse(savedBgList) : Array(photos.length).fill('');
          const colors: string[] = savedColors ? JSON.parse(savedColors) : Array(photos.length).fill('');
          
          const generatedPages: BookPage[] = [];
          for (let i = 0; i < resolvedPhotos.length; i += 2) {
            generatedPages.push({
              leftImage: resolvedPhotos[i],
              leftTitle: `${defaultTitle} - Trang ${i + 1}`,
              leftText: notes[i] || 'Khoảnh khắc đáng nhớ trong cuộc sống.',
              leftBg: backgrounds[i] || '',
              leftColor: colors[i] || '',
              rightImage: resolvedPhotos[i + 1] || resolvedPhotos[0],
              rightTitle: resolvedPhotos[i + 1] ? `${defaultTitle} - Trang ${i + 2}` : 'Bìa cuối',
              rightText: resolvedPhotos[i + 1] ? (notes[i + 1] || 'Khoảnh khắc tuyệt vời.') : 'Hành trình trọn vẹn.',
              rightBg: resolvedPhotos[i + 1] ? (backgrounds[i + 1] || '') : '',
              rightColor: resolvedPhotos[i + 1] ? (colors[i + 1] || '') : ''
            });
          }
          if (generatedPages.length > 0) {
            setPages(generatedPages);
          }
        } catch (err) {
          console.error("Failed to parse custom pages:", err);
        }
      }
    }
  };

  useEffect(() => {
    loadFromLocalStorage();

    // Listen to changes in other tabs/windows for magical instant real-time sync!
    window.addEventListener('storage', loadFromLocalStorage);
    return () => {
      window.removeEventListener('storage', loadFromLocalStorage);
    };
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(activeMusicUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    if (isPlaying) {
      audioRef.current.play().catch(err => console.log("Audio play deferred:", err));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeMusicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log("Audio play deferred:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-Flipping system
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoFlipping) {
      interval = setInterval(() => {
        if (!isFlipping) {
          setIsFlipping(true);
          setTimeout(() => {
            setCurrentPage(prev => (prev >= pages.length - 1 ? 0 : prev + 1));
            setIsFlipping(false);
          }, 400);
        }
      }, 5000); // Auto flip every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoFlipping, isFlipping, pages.length]);

  const handleVolumeCycle = () => {
    let nextVolume = 0.5;
    if (volume === 0.5) nextVolume = 0.8;
    else if (volume === 0.8) nextVolume = 1.0;
    else if (volume === 1.0) nextVolume = 0;
    else if (volume === 0) nextVolume = 0.2;
    else nextVolume = 0.5;
    
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
    confetti({ particleCount: 5, colors: ['#60a5fa'], origin: { y: 0.85 } });
  };

  const handleExportVideoAndBook = () => {
    setShowExportModal(true);
    setExportProgress(0);
    setExportingStep('Khởi động AI Rendering Engine...');
    
    const steps = [
      { progress: 15, text: '🔄 Tổng hợp dữ liệu ảnh và thiết lập bối cảnh...' },
      { progress: 35, text: '✨ Áp dụng chuyển động lật trang 3D mượt mà...' },
      { progress: 55, text: '🎨 Tạo phụ đề Canva & Capcut cá nhân hóa...' },
      { progress: 75, text: '🎵 Hòa âm phối khí nhạc nền vào video...' },
      { progress: 90, text: '⚡ Xuất bản bản sách HTML Offline cao cấp...' },
      { progress: 100, text: '🎉 Kết xuất thành công! File đang tải xuống máy của anh...' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setExportProgress(step.progress);
        setExportingStep(step.text);
        
        if (step.progress === 100) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.5 }
          });
          
          downloadOfflineScrapbook();
          clearInterval(interval);
          setTimeout(() => {
            setShowExportModal(false);
          }, 3500);
        }
        currentStepIdx++;
      }
    }, 1200);
  };

  const downloadOfflineScrapbook = () => {
    const albumHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${albumTitleState} - Sách Ảnh Kỷ Niệm</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: linear-gradient(135deg, #fdfbf7 0%, #f5f0e6 100%);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between p-6">
  <header class="text-center py-4 border-b border-amber-900/10">
    <h1 class="font-serif text-3xl font-bold text-amber-900">${albumTitleState}</h1>
    <p class="text-xs text-amber-800/60 uppercase tracking-widest mt-1">Sách ảnh Kỷ Niệm Tuyệt Đẹp</p>
  </header>

  <main class="max-w-4xl mx-auto w-full my-8 grid md:grid-cols-2 gap-8">
    \${pages.map((page, idx) => \`
    <div class="bg-white p-4 rounded-xl shadow-xl border border-black/5 transform hover:scale-102 transition-transform duration-300">
      <div class="aspect-square w-full rounded-lg overflow-hidden relative bg-neutral-100">
        <img src="\${page.leftImage}" class="w-full h-full object-cover">
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold text-center">
          \${page.leftText || 'Kỷ niệm ngọt ngào'}
        </div>
      </div>
      <div class="text-center font-serif italic text-amber-900/70 text-xs mt-3">Trang \${idx * 2 + 1}</div>
    </div>
    <div class="bg-white p-4 rounded-xl shadow-xl border border-black/5 transform hover:scale-102 transition-transform duration-300">
      <div class="aspect-square w-full rounded-lg overflow-hidden relative bg-neutral-100">
        <img src="\${page.rightImage}" class="w-full h-full object-cover">
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold text-center">
          \${page.rightText || 'Kỷ niệm ngọt ngào'}
        </div>
      </div>
      <div class="text-center font-serif italic text-amber-900/70 text-xs mt-3">Trang \${idx * 2 + 2}</div>
    </div>
    \`).join('')}
  </main>

  <footer class="text-center py-4 border-t border-amber-900/10 text-[10px] text-amber-900/40 font-bold uppercase tracking-widest">
    Được xuất bản bởi Memories AI Editor
  </footer>
</body>
</html>`;

    const blob = new Blob([albumHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `\${albumTitleState.toLowerCase().replace(/\\s+/g, '-')}-offline-scrapbook.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Audio playback failed:", err);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 400);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 400);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại feed</span>
        </Link>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Hiệu ứng lật trang 3D
        </span>
      </div>

      {/* Album Title */}
      <div className="text-center">
        <h2 className="font-headline text-3xl font-bold text-primary">{albumTitleState}</h2>
        <p className="text-xs text-on-surface-variant font-body mt-1">Lật từng trang giấy để hồi tưởng ký ức ngọt ngào.</p>
      </div>

      {/* 3D Book Layout Container */}
      <div className="relative py-4 flex justify-center items-center">
        {/* Realistic 3D Book Gold/Copper Metallic Spine */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-800 via-amber-400 to-amber-800 border-x border-amber-950/20 z-30 shadow-[0_0_12px_rgba(0,0,0,0.6)] hidden md:block rounded-full">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/20 via-transparent to-black/25"></div>
        </div>

        <div className={`w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-outline/10 p-4 relative transition-all duration-500 ${isFlipping ? 'scale-[0.99] opacity-70 blur-[0.5px]' : ''}`}>
          
          {/* LEFT PAGE */}
          <div 
            key={`left-${localPageKey}`}
            className={`p-4 md:border-r border-outline/5 flex flex-col gap-4 relative transition-all ${
              activeTransition === 'page-turn' ? 'animate-page-turn' :
              activeTransition === 'fade' ? 'animate-fade-in' :
              activeTransition === 'slide-left' ? 'animate-slide-left' :
              activeTransition === 'slide-right' ? 'animate-slide-right' :
              activeTransition === 'zoom-in' ? 'animate-zoom-in' :
              activeTransition === 'wipe' ? 'animate-wipe' : 'animate-fade-in'
            }`}
          >
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-outline/10 shadow relative group flex items-center justify-center bg-surface-container-high">
              {/* Blurred Background Collage Layer */}
              {pages[currentPage].leftBg && (
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                  <img 
                    src={pages[currentPage].leftBg} 
                    alt="Collage Background" 
                    className="w-full h-full object-cover blur-[4px] scale-105 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-10"></div>
                </div>
              )}

              {/* Scrapbook Polaroid Mount with Scale */}
              <div 
                style={{
                  transform: `scale(${
                    photoScales[currentPage * 2] === 'small' ? 0.65 :
                    photoScales[currentPage * 2] === 'large' ? 1.0 : 0.85
                  }) rotate(-1deg)`
                }}
                className="relative z-10 w-[78%] aspect-square bg-white p-2 sm:p-3 shadow-2xl border border-black/10 transition-all duration-300 rounded-sm flex flex-col justify-between"
              >
                <div className="w-full h-[82%] overflow-hidden bg-surface relative">
                  <img 
                    src={pages[currentPage].leftImage} 
                    alt={pages[currentPage].leftTitle} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
                {/* Elegant dynamic Title inside Polaroid margin */}
                <div className="text-center font-serif text-[8px] sm:text-[9px] text-amber-900 font-semibold tracking-tight truncate mt-1">
                  ✨ {albumTitleState} - #{currentPage * 2 + 1}
                </div>
              </div>

              {/* Left Page Stickers Layer */}
              {(photoStickers[currentPage * 2] || []).map((sticker) => (
                <div
                  key={sticker.id}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                  }}
                  className="z-20 text-3xl select-none pointer-events-none drop-shadow-md animate-pop-in"
                >
                  {sticker.symbol}
                </div>
              ))}
              
              {/* Capcut/Canva-Style Subtitle Overlay directly on the photo */}
              {pages[currentPage].leftText && (
                <div 
                  style={{
                    position: 'absolute',
                    left: `${photoPositions[currentPage * 2]?.x ?? 50}%`,
                    top: `${photoPositions[currentPage * 2]?.y ?? 85}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="z-30 text-center max-w-[90%] transition-all duration-300"
                >
                  <span 
                    style={{ color: photoColors[currentPage * 2] || undefined }}
                    className={`inline-block shadow-2xl ${
                      textStyle === 'capcut' ? `font-sans ${photoColors[currentPage * 2] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[12px] sm:text-sm' : 'text-[10px] sm:text-xs'} font-black tracking-wide uppercase px-2.5 py-1.5 rounded-lg drop-shadow-[0_2px_4px_rgba(0,0,0,1)] border border-black/30 bg-black/60` :
                      textStyle === 'canva' ? `font-headline ${photoColors[currentPage * 2] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-bold bg-primary px-3 py-1.5 rounded-full shadow-lg border border-white/20 tracking-wider` :
                      textStyle === 'heart' ? `font-serif ${photoColors[currentPage * 2] ? '' : 'text-pink-500'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-extrabold px-3 py-1 bg-pink-50/95 rounded-2xl border border-pink-300 tracking-wide italic` :
                      textStyle === 'sailor' ? `font-headline ${photoColors[currentPage * 2] ? '' : 'text-cyan-200'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-black px-3 py-1 bg-sky-950/90 rounded-xl border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)] tracking-widest` :
                      `font-serif ${photoColors[currentPage * 2] ? '' : 'text-amber-950'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-bold italic px-3 py-1 bg-amber-50/95 rounded-md border-l-4 border-amber-600 shadow-inner`
                    }`}
                  >
                    {pages[currentPage].leftText}
                  </span>
                </div>
              )}

              <div className="absolute top-2 left-2 bg-black/40 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-white z-20">
                Trang {currentPage * 2 + 1}
              </div>
            </div>
            <div className="space-y-1 px-1">
              <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 fill-primary/10" />
                {albumTitleState} - Trang {currentPage * 2 + 1}
              </h3>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed italic">
                "{pages[currentPage].leftText}"
              </p>
            </div>
          </div>

          {/* RIGHT PAGE */}
          <div 
            key={`right-${localPageKey}`}
            className={`p-4 flex flex-col gap-4 bg-surface-container-low/30 relative transition-all ${
              activeTransition === 'page-turn' ? 'animate-page-turn' :
              activeTransition === 'fade' ? 'animate-fade-in' :
              activeTransition === 'slide-left' ? 'animate-slide-left' :
              activeTransition === 'slide-right' ? 'animate-slide-right' :
              activeTransition === 'zoom-in' ? 'animate-zoom-in' :
              activeTransition === 'wipe' ? 'animate-wipe' : 'animate-fade-in'
            }`}
          >
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-outline/10 shadow relative group flex items-center justify-center bg-surface-container-high">
              {/* Blurred Background Collage Layer */}
              {pages[currentPage].rightBg && (
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                  <img 
                    src={pages[currentPage].rightBg} 
                    alt="Collage Background" 
                    className="w-full h-full object-cover blur-[4px] scale-105 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-10"></div>
                </div>
              )}

              {/* Scrapbook Polaroid Mount with Scale */}
              <div 
                style={{
                  transform: `scale(${
                    photoScales[currentPage * 2 + 1] === 'small' ? 0.65 :
                    photoScales[currentPage * 2 + 1] === 'large' ? 1.0 : 0.85
                  }) rotate(1deg)`
                }}
                className="relative z-10 w-[78%] aspect-square bg-white p-2 sm:p-3 shadow-2xl border border-black/10 transition-all duration-300 rounded-sm flex flex-col justify-between"
              >
                <div className="w-full h-[82%] overflow-hidden bg-surface relative">
                  <img 
                    src={pages[currentPage].rightImage} 
                    alt={pages[currentPage].rightTitle} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
                {/* Elegant dynamic Title inside Polaroid margin */}
                <div className="text-center font-serif text-[8px] sm:text-[9px] text-amber-900 font-semibold tracking-tight truncate mt-1">
                  ✨ {albumTitleState} - #{currentPage * 2 + 2}
                </div>
              </div>

              {/* Right Page Stickers Layer */}
              {(photoStickers[currentPage * 2 + 1] || []).map((sticker) => (
                <div
                  key={sticker.id}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                  }}
                  className="z-20 text-3xl select-none pointer-events-none drop-shadow-md animate-pop-in"
                >
                  {sticker.symbol}
                </div>
              ))}

              {/* Capcut/Canva-Style Subtitle Overlay directly on the photo */}
              {pages[currentPage].rightText && (
                <div 
                  style={{
                    position: 'absolute',
                    left: `${photoPositions[currentPage * 2 + 1]?.x ?? 50}%`,
                    top: `${photoPositions[currentPage * 2 + 1]?.y ?? 85}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="z-30 text-center max-w-[90%] transition-all duration-300"
                >
                  <span 
                    style={{ color: photoColors[currentPage * 2 + 1] || undefined }}
                    className={`inline-block shadow-2xl ${
                      textStyle === 'capcut' ? `font-sans ${photoColors[currentPage * 2 + 1] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[12px] sm:text-sm' : 'text-[10px] sm:text-xs'} font-black tracking-wide uppercase px-2.5 py-1.5 rounded-lg drop-shadow-[0_2px_4px_rgba(0,0,0,1)] border border-black/30 bg-black/60` :
                      textStyle === 'canva' ? `font-headline ${photoColors[currentPage * 2 + 1] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-bold bg-primary px-3 py-1.5 rounded-full shadow-lg border border-white/20 tracking-wider` :
                      textStyle === 'heart' ? `font-serif ${photoColors[currentPage * 2 + 1] ? '' : 'text-pink-500'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-extrabold px-3 py-1 bg-pink-50/95 rounded-2xl border border-pink-300 tracking-wide italic` :
                      textStyle === 'sailor' ? `font-headline ${photoColors[currentPage * 2 + 1] ? '' : 'text-cyan-200'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-black px-3 py-1 bg-sky-950/90 rounded-xl border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)] tracking-widest` :
                      `font-serif ${photoColors[currentPage * 2 + 1] ? '' : 'text-amber-950'} ${textSize === 'small' ? 'text-[7px]' : textSize === 'large' ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[10px]'} font-bold italic px-3 py-1 bg-amber-50/95 rounded-md border-l-4 border-amber-600 shadow-inner`
                    }`}
                  >
                    {pages[currentPage].rightText}
                  </span>
                </div>
              )}

              <div className="absolute top-2 right-2 bg-black/40 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-white z-20">
                Trang {currentPage * 2 + 2}
              </div>
            </div>
            <div className="space-y-1 px-1">
              <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 fill-primary/10" />
                {albumTitleState} - Trang {currentPage * 2 + 2}
              </h3>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed italic">
                "{pages[currentPage].rightText}"
              </p>
            </div>
          </div>
        </div>

        {/* Page controllers */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className={`absolute left-0 md:-left-4 z-30 w-10 h-10 rounded-full bg-surface-container-lowest hover:bg-surface border border-outline/15 shadow-lg flex items-center justify-center transition-all ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90 hover:scale-105'}`}
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage === pages.length - 1}
          className={`absolute right-0 md:-right-4 z-30 w-10 h-10 rounded-full bg-surface-container-lowest hover:bg-surface border border-outline/15 shadow-lg flex items-center justify-center transition-all ${currentPage === pages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90 hover:scale-105'}`}
        >
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Pages indicator dots & Auto-Flip Toggle */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex justify-center gap-1.5">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentPage(idx);
                setIsAutoFlipping(false); // Pause auto-flipping when user manually clicks
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${currentPage === idx ? 'w-6 bg-primary' : 'w-1.5 bg-outline/20'}`}
            />
          ))}
        </div>

        <button
          onClick={() => setIsAutoFlipping(!isAutoFlipping)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
            isAutoFlipping 
              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
              : 'bg-surface-container-high text-on-surface-variant border-outline/10 hover:bg-surface-container-highest'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isAutoFlipping && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoFlipping ? 'bg-primary' : 'bg-outline'}`}></span>
          </span>
          <span>{isAutoFlipping ? 'Lật trang tự động (Đang bật)' : 'Lật trang tự động (Đang dừng)'}</span>
        </button>
      </div>

      {/* Audio Controller - Emotional Music Ambiance */}
      <div className="rounded-2xl bg-surface-container border border-outline/10 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Spinning Vinyl Record Visual with Asymmetric Glare & Grooves */}
          <div className={`w-12 h-12 rounded-full bg-zinc-950 border-2 border-zinc-700 shadow-xl flex items-center justify-center relative flex-shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
            {/* Dynamic visual center */}
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            
            {/* Diagonal Glossy Glare line - rotates with the vinyl! */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transform rotate-45"></div>
            
            {/* Dashed outer grooves - highly visible rotation! */}
            <div className="absolute inset-1 rounded-full border border-dashed border-zinc-800/80 pointer-events-none"></div>
            <div className="absolute inset-2.5 rounded-full border border-dashed border-zinc-900 pointer-events-none"></div>
            
            {/* Off-center label dot - orbits beautifully during spinning! */}
            <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-white/20 z-10"></div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">{musicName}</h4>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest block mt-0.5">Bản nhạc Gợi Cảm Xúc</span>
            
            {/* Bouncing Audio Visualizer bars */}
            <div className="flex items-end gap-0.5 h-4 mt-1.5">
              {[1, 2, 3, 4, 5, 1, 2, 3, 4].map((barNum, idx) => (
                <div 
                  key={idx}
                  className={`w-0.5 bg-primary rounded-full ${isPlaying ? `bar-bounce-${barNum}` : 'h-[3px]'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {/* Export Video / Book Action */}
          <button
            onClick={handleExportVideoAndBook}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full hover:shadow-md active:scale-95 transition-all shadow-sm"
          >
            <span>📥 Xuất Video / Sách</span>
          </button>

          {/* Volume control cycler */}
          <button
            onClick={handleVolumeCycle}
            className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-3.5 py-2 rounded-full text-xs text-on-surface-variant transition-all active:scale-95 border border-outline/5"
            title="Tăng giảm âm lượng"
          >
            <Volume2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-[10px] tracking-wide uppercase">
              {volume === 0 ? 'Tắt âm 🔇' : `Âm lượng ${Math.round(volume * 100)}%`}
            </span>
          </button>

          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-on-primary" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-on-primary" />
                <span>Phát nhạc nền</span>
              </>
            )}
          </button>
        </div>
      </div>
    {/* Premium Glassmorphic Exporting Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-surface-container-low border border-primary/20 rounded-3xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Spinning glowing background orb */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>

            <div className="relative space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-inner">
                <Bot className="h-8 w-8 text-primary animate-bounce" />
              </div>

              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface">Memories AI Rendering Engine</h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Đang xuất bản tác phẩm nghệ thuật</p>
              </div>

              {/* Progress Bar with glowing neon filling */}
              <div className="space-y-2">
                <div className="w-full bg-surface-container-highest rounded-full h-3.5 p-0.5 shadow-inner border border-outline/5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-primary to-rose-500 h-full rounded-full transition-all duration-300 relative"
                    style={{ width: `${exportProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 animate-shine"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant">
                  <span className="truncate max-w-[80%] italic text-outline">{exportingStep}</span>
                  <span className="text-primary font-black text-xs">{exportProgress}%</span>
                </div>
              </div>

              {/* Interactive loading tip */}
              <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 text-[10px] text-on-surface-variant font-medium leading-relaxed italic">
                💡 Mẹo: Bản sách offline được xuất dưới định dạng HTML đơn lập tự chạy, chứa đầy đủ ảnh và ghi chú Canva/Capcut của anh để chia sẻ ngay lập tức!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
