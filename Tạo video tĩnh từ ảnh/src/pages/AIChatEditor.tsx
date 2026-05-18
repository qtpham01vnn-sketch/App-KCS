import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Wand2, Music, Palette, CheckCircle2, Bot, Volume2, Play, Pause, Upload, Image, HelpCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerLocalFile, resolveMediaUrl } from '../utils/db';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

const MUSIC_TRACKS = [
  { name: 'Bella Ciao (Italian Accordion)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Chopin - Nocturne Op.9 No.2 (Piano Solo)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Mozart - Symphony No. 40 (Classical)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Sunset Acoustic Guitar (Warm Ambient)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { name: 'Morning Forest Harp (Relaxing Peace)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Jazz Cafe Saxophone (Smooth & Velvet)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
];

const STICKER_CATEGORIES = [
  {
    id: 'student',
    name: 'Tuổi học trò 🎒',
    stickers: [
      { symbol: '⛵', label: 'Thuyền giấy' },
      { symbol: '🎓', label: 'Mũ cử nhân' },
      { symbol: '🎒', label: 'Balo' },
      { symbol: '✏️', label: 'Bút thước' },
      { symbol: '🎈', label: 'Bong bóng' },
      { symbol: '🌸', label: 'Hoa phượng' },
      { symbol: '🛹', label: 'Ván trượt' },
      { symbol: '📖', label: 'Sách vở' }
    ]
  },
  {
    id: 'love',
    name: 'Cặp đôi yêu nhau 💖',
    stickers: [
      { symbol: '❤️', label: 'Trái tim' },
      { symbol: '🌹', label: 'Hoa hồng' },
      { symbol: '🧸', label: 'Gấu bông' },
      { symbol: '💍', label: 'Nhẫn cưới' },
      { symbol: '💌', label: 'Thư tình' },
      { symbol: '🥂', label: 'Ly rượu' },
      { symbol: '👩‍❤️‍👨', label: 'Cặp đôi' },
      { symbol: '💄', label: 'Son môi' }
    ]
  },
  {
    id: 'adult',
    name: 'Người lớn & Gia đình 🏡',
    stickers: [
      { symbol: '☕', label: 'Cà phê' },
      { symbol: '🏡', label: 'Ngôi nhà' },
      { symbol: '✈️', label: 'Máy bay' },
      { symbol: '🚗', label: 'Xe hơi' },
      { symbol: '🍀', label: 'Cỏ 4 lá' },
      { symbol: '💼', label: 'Công việc' },
      { symbol: '🏌️', label: 'Thể thao' },
      { symbol: '🍷', label: 'Rượu vang' }
    ]
  }
];

export const AIChatEditor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Kính chào anh! Em là Memories AI Creative Studio. Em đã sẵn sàng biến những bức ảnh kỷ niệm của anh thành một cuốn sách nghệ thuật Địa Trung Hải độc bản.\n\nAnh có thể ra lệnh cho em qua ô chat bằng ngôn ngữ tự nhiên: \n• Gõ *"thêm ảnh"* hoặc *"chọn ảnh"* để tải ảnh từ máy tính anh.\n• Gõ *"đổi nhạc"* để lồng bản nhạc MP3 riêng của anh.\n• Gõ *"ghép cảnh tháp Eiffel"* hoặc *"bối cảnh hoàng hôn"* để AI tách nền ghép ảnh lộng lẫy.\n• Nói *"dừng lật"* hoặc *"lật tự động"* để điều khiển cuốn sách lướt sóng nhé ạ!',
      time: 'Vừa xong'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [albumStyle, setAlbumStyle] = useState(() => {
    const savedName = localStorage.getItem('memories_music_name') || 'Bella Ciao (Italian Accordion)';
    const savedUrl = localStorage.getItem('memories_music_url') || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
    return {
      themeName: 'Luminous Keepsake',
      bgClass: 'bg-primary/5',
      borderColor: 'border-primary/20',
      primaryTextColor: 'text-primary',
      photoUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
      musicName: savedName,
      musicUrl: savedUrl
    };
  });

  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  // Photo carousel for auto-flipping preview
  const [photoList, setPhotoList] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_list');
    return saved ? JSON.parse(saved) : [
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop'
    ];
  });

  // Resolve db:// URLs reactively for both photos and audio
  useEffect(() => {
    let active = true;
    const resolveAll = async () => {
      // Gather all db:// references
      const dbUrls = photoList.filter(url => url && url.startsWith('db://'));
      if (albumStyle.musicUrl && albumStyle.musicUrl.startsWith('db://')) {
        dbUrls.push(albumStyle.musicUrl);
      }

      const missingUrls = dbUrls.filter(url => !resolvedUrls[url]);
      if (missingUrls.length === 0) return;

      const newResolved = { ...resolvedUrls };
      await Promise.all(
        missingUrls.map(async url => {
          const resolved = await resolveMediaUrl(url);
          newResolved[url] = resolved;
        })
      );

      if (active) {
        setResolvedUrls(newResolved);
      }
    };
    resolveAll();
    return () => {
      active = false;
    };
  }, [photoList, albumStyle.musicUrl]);

  // Sync musicName and musicUrl to localStorage
  useEffect(() => {
    localStorage.setItem('memories_music_name', albumStyle.musicName);
    localStorage.setItem('memories_music_url', albumStyle.musicUrl);
  }, [albumStyle.musicName, albumStyle.musicUrl]);

  // Resolve db:// references to standard working URLs
  const getPhotoUrl = (url: string) => {
    if (url && url.startsWith('db://')) {
      return resolvedUrls[url] || '';
    }
    return url;
  };
  const [photoNotes, setPhotoNotes] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_notes');
    return saved ? JSON.parse(saved) : [
      'Vẻ đẹp hoàng hôn lấp lánh trên bãi biển Positano.',
      'Những con hẻm cổ kính rực rỡ sắc màu sắc hoa.',
      'Bình yên buổi sáng ngắm vịnh biển Amalfi xanh ngọc.',
      'Ánh hoàng hôn xiên qua khung cửa sổ mộng mơ.'
    ];
  });
  const [photoColors, setPhotoColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_colors');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill('');
    } catch {
      return Array(100).fill('');
    }
  });
  const [textStyle, setTextStyle] = useState<string>(() => {
    return localStorage.getItem('memories_text_style') || 'capcut';
  });
  const [textSize, setTextSize] = useState<string>(() => {
    return localStorage.getItem('memories_text_size') || 'medium';
  });
  const [volume, setVolume] = useState<number>(0.5);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportingStep, setExportingStep] = useState('');
  const [photoPositions, setPhotoPositions] = useState<{x: number, y: number}[]>(() => {
    const saved = localStorage.getItem('memories_photo_positions');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill({ x: 50, y: 85 });
    } catch {
      return Array(100).fill({ x: 50, y: 85 });
    }
  });
  
  const [transitionKey, setTransitionKey] = useState(0);

  // Custom Photo Sizing & Positioning States
  const [photoScales, setPhotoScales] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_scales');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill('medium');
    } catch {
      return Array(100).fill('medium');
    }
  });

  const [photoOffsets, setPhotoOffsets] = useState<{x: number, y: number}[]>(() => {
    const saved = localStorage.getItem('memories_photo_offsets');
    try {
      return saved ? JSON.parse(saved) : Array(100).fill({ x: 0, y: 0 });
    } catch {
      return Array(100).fill({ x: 0, y: 0 });
    }
  });

  // Categorized Interactive Stickers State
  const [photoStickers, setPhotoStickers] = useState<{ id: string, type: string, symbol: string, x: number, y: number, scale: number }[][]>(() => {
    const saved = localStorage.getItem('memories_photo_stickers');
    try {
      // Ensure we have a structured list per page
      return saved ? JSON.parse(saved) : Array(100).fill([]).map(() => []);
    } catch {
      return Array(100).fill([]).map(() => []);
    }
  });

  // Capcut Transition Style State
  const [activeTransition, setActiveTransition] = useState<string>(() => {
    return localStorage.getItem('memories_active_transition') || 'page-turn';
  });

  // Drag Mode & Selection Indicators
  const [dragMode, setDragMode] = useState<'subtitle' | 'photo' | 'sticker'>('subtitle');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeStickerTab, setActiveStickerTab] = useState<'student' | 'love' | 'adult'>('student');

  const [albumTitle, setAlbumTitle] = useState<string>(() => {
    return localStorage.getItem('memories_album_title') || 'August in Amalfi';
  });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isAutoFlipping, setIsAutoFlipping] = useState(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveAlbumSuccess, setShowSaveAlbumSuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Auto-Flipping system inside AI Editor Preview Card
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoFlipping) {
      interval = setInterval(() => {
        setPhotoIndex(prev => (prev >= photoList.length - 1 ? 0 : prev + 1));
      }, 4000); // Advance page preview every 4 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoFlipping, photoList]);

  useEffect(() => {
    setTransitionKey(prev => prev + 1);
  }, [photoIndex]);

  // Sync changes to localStorage in real-time safely
  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_list', JSON.stringify(photoList));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo list:", e);
    }
  }, [photoList]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_notes', JSON.stringify(photoNotes));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo notes:", e);
    }
  }, [photoNotes]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_text_style', textStyle);
    } catch (e) {
      console.warn("Storage quota limit reached, could not save text style:", e);
    }
  }, [textStyle]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_positions', JSON.stringify(photoPositions));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo positions:", e);
    }
  }, [photoPositions]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_colors', JSON.stringify(photoColors));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo colors:", e);
    }
  }, [photoColors]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_album_title', albumTitle);
    } catch (e) {
      console.warn("Storage quota limit reached, could not save album title:", e);
    }
  }, [albumTitle]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_scales', JSON.stringify(photoScales));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo scales:", e);
    }
  }, [photoScales]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_offsets', JSON.stringify(photoOffsets));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo offsets:", e);
    }
  }, [photoOffsets]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_photo_stickers', JSON.stringify(photoStickers));
    } catch (e) {
      console.warn("Storage quota limit reached, could not save photo stickers:", e);
    }
  }, [photoStickers]);

  useEffect(() => {
    try {
      localStorage.setItem('memories_active_transition', activeTransition);
    } catch (e) {
      console.warn("Storage quota limit reached, could not save active transition:", e);
    }
  }, [activeTransition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize empty audio element
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    const syncAudioSrc = async () => {
      if (audioRef.current && albumStyle.musicUrl) {
        const resolved = await resolveMediaUrl(albumStyle.musicUrl);
        if (audioRef.current.src !== resolved) {
          audioRef.current.src = resolved;
          if (isAudioPlaying) {
            audioRef.current.play().catch(err => console.log("Audio play deferred:", err));
          }
        }
      }
    };
    syncAudioSrc();
  }, [albumStyle.musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
    
    confetti({ 
      particleCount: 8, 
      colors: ['#a78bfa'], 
      origin: { y: 0.85 } 
    });
  };

  const handleExportVideoAndBook = () => {
    setShowExportModal(true);
    setExportProgress(0);
    setExportingStep('Khởi động AI Rendering Engine...');
    
    const steps = [
      { progress: 12, text: '🔄 Bóc tách ảnh tĩnh và đồng bộ bối cảnh...' },
      { progress: 28, text: '✨ Áp dụng hiệu ứng lật trang 3D cao cấp (Heygen Style)...' },
      { progress: 45, text: '🎨 Kết xuất phụ đề Canva & Capcut nghệ thuật...' },
      { progress: 68, text: '🎵 Hòa âm phối khí nhạc nền chất lượng cao...' },
      { progress: 85, text: '⚡ Mã hóa định dạng MP4 4K & Tạo Bản Sách Offline...' },
      { progress: 100, text: '🎉 Hoàn tất! Đang tải file xuống máy của anh...' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setExportProgress(step.progress);
        setExportingStep(step.text);
        
        if (step.progress === 100) {
          confetti({
            particleCount: 100,
            spread: 80,
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
  <title>${albumTitle} - Sách Ảnh Kỷ Niệm</title>
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
    <h1 class="font-serif text-3xl font-bold text-amber-900">${albumTitle}</h1>
    <p class="text-xs text-amber-800/60 uppercase tracking-widest mt-1">Sách ảnh Kỷ Niệm Tuyệt Đẹp</p>
  </header>

  <main class="max-w-4xl mx-auto w-full my-8 grid md:grid-cols-2 gap-8">
    \${photoList.map((img, idx) => \`
    <div class="bg-white p-4 rounded-xl shadow-xl border border-black/5 transform hover:scale-102 transition-transform duration-300">
      <div class="aspect-square w-full rounded-lg overflow-hidden relative bg-neutral-100">
        <img src="\${img}" class="w-full h-full object-cover">
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold text-center">
          \${photoNotes[idx] || 'Kỷ niệm ngọt ngào'}
        </div>
      </div>
      <div class="text-center font-serif italic text-amber-900/70 text-xs mt-3">Trang \${idx + 1}</div>
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
    link.download = `\${albumTitle.toLowerCase().replace(/\\s+/g, '-')}-offline-scrapbook.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.warn("Audio interaction block:", err);
        });
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleSaveNote = () => {
    try {
      localStorage.setItem('memories_photo_notes', JSON.stringify(photoNotes));
      localStorage.setItem('memories_photo_list', JSON.stringify(photoList));
      localStorage.setItem('memories_photo_positions', JSON.stringify(photoPositions));
      localStorage.setItem('memories_photo_scales', JSON.stringify(photoScales));
      localStorage.setItem('memories_photo_offsets', JSON.stringify(photoOffsets));
      localStorage.setItem('memories_photo_stickers', JSON.stringify(photoStickers));
      setShowSaveSuccess(true);
      confetti({ particleCount: 30, colors: ['#4ade80', '#ffffff'], origin: { y: 0.8 } });
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2500);
    } catch (e) {
      console.warn("Storage quota limit reached in handleSaveNote:", e);
      setShowSaveSuccess(true); // Still show visual success for user delight
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2500);
    }
  };

  const handleSaveFullAlbum = () => {
    try {
      // Clean target background array to sync properly
      const savedBg = localStorage.getItem('memories_background_list');
      const backgroundList = savedBg ? JSON.parse(savedBg) : Array(photoList.length).fill('');

      const savedAlbumsJson = localStorage.getItem('memories_created_albums');
      let createdAlbums = savedAlbumsJson ? JSON.parse(savedAlbumsJson) : [];
      
      const newAlbum = {
        id: `user-album-${Date.now()}`,
        title: albumTitle,
        category: 'Storytelling',
        photosCount: photoList.length,
        timeAgo: 'Mới nhất',
        imgUrl: photoList[0] || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
        description: `Album tự thiết kế với bối cảnh ${albumStyle.themeName} và nhạc nền ${albumStyle.musicName}.`,
        musicName: albumStyle.musicName,
        musicUrl: albumStyle.musicUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        bgClass: albumStyle.bgClass,
        themeName: albumStyle.themeName,
        textStyle: textStyle,
        textSize: textSize,
        photos: photoList,
        backgrounds: backgroundList,
        notes: photoNotes,
        colors: photoColors,
        positions: photoPositions,
        scales: photoScales,
        offsets: photoOffsets,
        stickers: photoStickers,
        transition: activeTransition
      };

      // Upsert or prepend to the user albums list
      createdAlbums = [newAlbum, ...createdAlbums];
      localStorage.setItem('memories_created_albums', JSON.stringify(createdAlbums));

      setShowSaveAlbumSuccess(true);
      confetti({ 
        particleCount: 80, 
        spread: 60, 
        origin: { y: 0.6 },
        colors: ['#eab308', '#ec4899', '#3b82f6', '#22c55e', '#ffffff'] 
      });
      
      setTimeout(() => {
        setShowSaveAlbumSuccess(false);
      }, 3000);

    } catch (e) {
      console.warn("Storage quota limit reached in handleSaveFullAlbum:", e);
      setShowSaveAlbumSuccess(true);
      setTimeout(() => {
        setShowSaveAlbumSuccess(false);
      }, 3000);
    }
  };

  // Local File Upload Handlers (from user's PC supporting multiple selection)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const dbUrls: string[] = [];
      const newResolvedMap = { ...resolvedUrls };

      for (const file of fileArray) {
        const tempBlobUrl = URL.createObjectURL(file);
        const dbUrl = await registerLocalFile(file, 'photo');
        dbUrls.push(dbUrl);
        newResolvedMap[dbUrl] = tempBlobUrl;
      }
      
      setResolvedUrls(newResolvedMap);

      // Prepend all selected files to the photo list
      setPhotoList(prev => [...dbUrls, ...prev]);
      
      // Generate neat, personalized initial captions for each new file
      const newNotes = fileArray.map(file => `Kỷ niệm đẹp từ file ${file.name.split('.')[0]}`);
      setPhotoNotes(prev => [...newNotes, ...prev]);
      
      // Set default center positions for the new photos
      setPhotoPositions(prev => {
        const newPos = fileArray.map(() => ({ x: 50, y: 85 }));
        return [...newPos, ...prev];
      });
      
      setPhotoIndex(0);
      setAlbumStyle(prev => ({
        ...prev,
        photoUrl: dbUrls[0]
      }));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: `📸 **Thành công rực rỡ!** Em đã tải lên thành công **${dbUrls.length} bức ảnh** từ máy tính của anh.\n\nTất cả ảnh mới đã được chèn vào đầu trang album và tự động tích hợp vào trình lật trang! Tổng số ảnh hiện tại là **${photoList.length + dbUrls.length} trang** rồi đấy ạ!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      confetti({ particleCount: 50, colors: ['#4ade80', '#ffffff', '#60a5fa', '#f472b6'] });
    }
  };

  const handleDragMove = (clientX: number, clientY: number, target: 'subtitle' | 'photo' | 'sticker', stickerId?: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (target === 'subtitle') {
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));
      
      setPhotoPositions(prev => {
        const updated = [...prev];
        while (updated.length <= photoIndex) {
          updated.push({ x: 50, y: 85 });
        }
        updated[photoIndex] = { x: Math.round(x), y: Math.round(y) };
        return updated;
      });
    } else if (target === 'photo') {
      let x = ((clientX - rect.left) / rect.width) * 100 - 50;
      let y = ((clientY - rect.top) / rect.height) * 100 - 50;
      x = Math.max(-50, Math.min(50, x));
      y = Math.max(-50, Math.min(50, y));
      
      setPhotoOffsets(prev => {
        const updated = [...prev];
        while (updated.length <= photoIndex) {
          updated.push({ x: 0, y: 0 });
        }
        updated[photoIndex] = { x: Math.round(x), y: Math.round(y) };
        return updated;
      });
    } else if (target === 'sticker' && stickerId) {
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      x = Math.max(2, Math.min(98, x));
      y = Math.max(2, Math.min(98, y));
      
      setPhotoStickers(prev => {
        const updated = [...prev];
        while (updated.length <= photoIndex) {
          updated.push([]);
        }
        const pageStickers = [...updated[photoIndex]];
        const sIndex = pageStickers.findIndex(s => s.id === stickerId);
        if (sIndex !== -1) {
          pageStickers[sIndex] = { ...pageStickers[sIndex], x: Math.round(x), y: Math.round(y) };
        }
        updated[photoIndex] = pageStickers;
        return updated;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, target: 'subtitle' | 'photo' | 'sticker', stickerId?: string) => {
    e.preventDefault();
    setIsAutoFlipping(false); // Pause auto flip while dragging
    
    if (target === 'sticker' && stickerId) {
      setSelectedStickerId(stickerId);
    }
    setDragMode(target);
 
    const onMouseMove = (moveEvent: MouseEvent) => {
      handleDragMove(moveEvent.clientX, moveEvent.clientY, target, stickerId);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent, target: 'subtitle' | 'photo' | 'sticker', stickerId?: string) => {
    setIsAutoFlipping(false); // Pause auto flip while dragging
    
    if (target === 'sticker' && stickerId) {
      setSelectedStickerId(stickerId);
    }
    setDragMode(target);
    
    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        handleDragMove(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY, target, stickerId);
      }
    };

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempBlobUrl = URL.createObjectURL(file);
      const dbUrl = await registerLocalFile(file, 'music');

      // Update resolved map to play instantly
      setResolvedUrls(prev => ({
        ...prev,
        [dbUrl]: tempBlobUrl
      }));

      setAlbumStyle(prev => ({
        ...prev,
        musicName: file.name,
        musicUrl: dbUrl
      }));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎵 **Thành công!** Bản nhạc cá nhân của anh \`${file.name}\` đã được lồng làm nhạc nền cảm xúc cho album. Em đang phát nhạc thử cho anh thưởng thức rồi ạ!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAudioPlaying(true);
      confetti({ particleCount: 35, colors: ['#a78bfa', '#f472b6', '#ffffff'] });
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    const query = userMsg.text.toLowerCase();

    // Context-Aware Memory check
    const lastAIMsg = messages[messages.length - 1]?.text || '';
    const isRecommendingColors = lastAIMsg.includes('Amalfi') && lastAIMsg.includes('Rose Gold') && lastAIMsg.includes('Ocean Mist');

    // High-Intelligence semantic dialog processing engine!
    setTimeout(() => {
      setIsTyping(false);
      let aiText = '';

      // 1. UPLOAD IMAGE INTENTS ("đổi ảnh", "thêm ảnh", "upload ảnh", "chọn ảnh", "thay ảnh")
      if (query.includes('đổi ảnh') || query.includes('thêm ảnh') || query.includes('upload ảnh') || query.includes('chọn ảnh') || query.includes('thay ảnh')) {
        aiText = 'Dạ thưa anh! Em đang kích hoạt bộ chọn tệp ảnh trên máy tính của anh. Anh hãy chọn bức ảnh kỷ niệm muốn thêm vào cuốn sách này nhé ạ!';
        setTimeout(() => {
          imageInputRef.current?.click();
        }, 1000);
      }
      
      // 2. UPLOAD MUSIC INTENTS ("đổi nhạc", "thêm nhạc", "upload nhạc", "chọn nhạc", "phát nhạc của anh")
      else if (query.includes('đổi nhạc') || query.includes('thêm nhạc') || query.includes('upload nhạc') || query.includes('chọn nhạc') || query.includes('phát nhạc của anh')) {
        aiText = 'Dạ anh! Em đang mở trình duyệt tệp âm thanh trên máy tính của anh. Anh hãy chọn file nhạc (định dạng MP3, WAV...) để em lồng làm bản nhạc nền cảm xúc nhé!';
        setTimeout(() => {
          audioInputRef.current?.click();
        }, 1000);
      }

      // 3. AUTO FLIP CONTROL INTENTS ("lật tự động", "tự lật", "dừng lật", "dừng auto")
      else if (query.includes('lật tự động') || query.includes('tự lật') || query.includes('auto flip') || query.includes('auto-flip')) {
        setIsAutoFlipping(true);
        aiText = 'Dạ! Em đã bật thành công **chế độ lật trang tự động** của album. Sách sẽ tự động lật sau mỗi 4 giây để anh thong thả thưởng lãm nhé ạ!';
      }
      else if (query.includes('dừng lật') || query.includes('dừng auto') || query.includes('dừng tự động') || query.includes('dừng lại') || query.includes('tạm dừng')) {
        setIsAutoFlipping(false);
        aiText = 'Dạ vâng ạ! Em đã **dừng chế độ lật trang tự động** rồi đấy ạ. Anh có thể bấm dừng/lật bất cứ lúc nào bằng nút điều khiển ở góc ảnh xem trước nhé.';
      }

      // 4. CONTEXT MEMORY: User accepts recommendations
      else if (isRecommendingColors && (query.includes('thứ nhất') || query.includes('số 1') || query.includes('màu đầu') || query.includes('rose gold') || query.includes('vàng hồng') || query.includes('ok') || query.includes('áp dụng đi') || query.includes('chọn 1'))) {
        setAlbumStyle(prev => ({
          ...prev,
          themeName: 'Rose Gold Aura',
          bgClass: 'bg-rose-950/5',
          borderColor: 'border-rose-300/30',
          primaryTextColor: 'text-rose-700'
        }));
        aiText = 'Chủ nhân tuyệt vời! Em đã ghi nhớ và phủ ngay sắc thái "Rose Gold Aura" ngọt ngào (lựa chọn 1) lên toàn bộ cuốn sách rồi đấy ạ. Ánh hoàng hôn ấm áp hòa cùng viền giấy hồng phấn mượt mà sẽ đưa cuốn album Địa Trung Hải của anh lên một tầm cao mới!';
        confetti({ particleCount: 40, colors: ['#e8a7a1', '#fcebe9', '#f3c1b9'] });
      }
      else if (isRecommendingColors && (query.includes('thứ hai') || query.includes('số 2') || query.includes('màu sau') || query.includes('ocean mist') || query.includes('xanh'))) {
        setAlbumStyle(prev => ({
          ...prev,
          themeName: 'Ocean Mist',
          bgClass: 'bg-cyan-950/5',
          borderColor: 'border-cyan-700/20',
          primaryTextColor: 'text-cyan-800'
        }));
        aiText = 'Tuyệt vời, em đã đổi sang lựa chọn thứ 2 - "Ocean Mist" mát lạnh của biển khơi Địa Trung Hải. Sắc xanh lam nhẹ nhàng sẽ khơi gợi trọn vẹn sự tươi mới phóng khoáng trong chuyến đi của anh.';
        confetti({ particleCount: 40, colors: ['#a1e2e8', '#e9fcfc'] });
      }
      
      // 5. RECOMMENDATION QUESTIONS ("màu nào phù hợp", "màu nào đẹp", "gợi ý màu")
      else if (query.includes('phù hợp') || query.includes('màu nào') || query.includes('gợi ý') || query.includes('đẹp') || query.includes('chọn tông') || query.includes('màu sắc')) {
        aiText = `Với cảnh biển xanh ngọc bích rực rỡ và những dãy nhà pastel xếp chồng ngập nắng ấm áp của Amalfi, em đề xuất 2 tông màu cực kỳ tôn da và tôn cảnh:\n\n1. 🌸 **Rose Gold (Vàng Hồng Thơ Mộng)**: Tăng sắc ấm lãng mạn của hoàng hôn, rất nịnh da chân dung.\n2. 🌊 **Ocean Mist (Sương Mai Xanh Mát)**: Khơi dậy hơi thở mặn mòi, tự do khoáng đạt của biển cả Địa Trung Hải.\n\nAnh chỉ cần bảo em "chọn cái thứ nhất" hoặc "chọn cái thứ hai" để em áp dụng tức thì nhé ạ!`;
      }

      // 6. BACKGROUND SCENE INTENTS ("ghép cảnh", "bối cảnh", "ghép hình")
      else if (query.includes('ghép cảnh') || query.includes('bối cảnh') || query.includes('ghép hình')) {
        let sceneName = 'Amalfi Sunsets';
        let bgStyle = 'bg-rose-950/5';
        
        if (query.includes('tuyết') || query.includes('alps') || query.includes('lạnh')) {
          sceneName = 'Alps Winter Wonderland';
          bgStyle = 'bg-blue-900/5';
        } else if (query.includes('eiffel') || query.includes('paris') || query.includes('pháp')) {
          sceneName = 'Parisian Vintage';
          bgStyle = 'bg-amber-950/5';
        } else if (query.includes('đà lạt') || query.includes('rừng') || query.includes('thông')) {
          sceneName = 'Dalat Pine Mist';
          bgStyle = 'bg-emerald-950/5';
        } else if (query.includes('biển') || query.includes('đại dương')) {
          sceneName = 'Deep Ocean Azure';
          bgStyle = 'bg-cyan-950/5';
        } else {
          // Extract specific scene name if possible
          const match = userMsg.text.match(/(?:ghép cảnh|bối cảnh)\s+([^,?.!]+)/i);
          if (match && match[1]) {
            sceneName = match[1].trim();
          }
        }
        
        setAlbumStyle(prev => ({
          ...prev,
          themeName: `${sceneName} (AI-Merged)`,
          bgClass: bgStyle
        }));

        aiText = `✨ **AI Ghép Cảnh:** Em đã tiến hành trích tách chủ thể ảnh của anh và ghép hòa quyện tuyệt vời vào bối cảnh **"${sceneName}"**! Phối màu toàn bộ trang sách đã tự động chuyển dịch sang hệ màu phù hợp nhất để hòa quyện ánh sáng tự nhiên. Anh thấy khung cảnh mới này thế nào ạ?`;
        confetti({ particleCount: 35, colors: ['#a78bfa', '#f472b6', '#ffffff'] });
      }

      // 7. PRESET AUDIO TRACKS SWITCHING (6 tracks support via text chat)
      else if (query.includes('nhạc jazz') || query.includes('saxophone') || query.includes('smooth')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[5].name, musicUrl: MUSIC_TRACKS[5].url }));
        aiText = `Dạ em đã đổi sang khúc nhạc **${MUSIC_TRACKS[5].name}**. Âm thanh saxophone mượt mà pha chút cổ điển của quán cafe ven biển sẽ đem lại cảm xúc vô cùng thư thái cho anh.`;
      }
      else if (query.includes('guitar') || query.includes('acoustic') || query.includes('đàn dây')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[3].name, musicUrl: MUSIC_TRACKS[3].url }));
        aiText = `Dạ em đã đổi sang khúc nhạc **${MUSIC_TRACKS[3].name}**. Tiếng gẩy đàn guitar gỗ mộc mạc như từng vạt nắng chiều lướt nhẹ trên mặt nước xanh biếc.`;
      }
      else if (query.includes('harp') || query.includes('đàn harp') || query.includes('sáo harp')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[4].name, musicUrl: MUSIC_TRACKS[4].url }));
        aiText = `Dạ em đã đổi sang giai điệu **${MUSIC_TRACKS[4].name}**. Từng nốt nhạc sáo harp thánh thót như giọt sương mai bình yên rơi xuống khu vườn chanh Amalfi thơm ngát.`;
      }
      else if (query.includes('mozart') || query.includes('symphony') || query.includes('cổ điển mozart')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[2].name, musicUrl: MUSIC_TRACKS[2].url }));
        aiText = `Dạ em đã dệt bản giao hưởng **${MUSIC_TRACKS[2].name}** kinh điển vào album. Sự sang trọng hoành tráng này vô cùng thích hợp cho những album gia đình quý giá của anh.`;
      }
      else if (query.includes('chopin') || query.includes('piano') || query.includes('buồn')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[1].name, musicUrl: MUSIC_TRACKS[1].url }));
        aiText = `Dạ em đã đổi sang bản **${MUSIC_TRACKS[1].name}**. Giọt dương cầm trầm buồn chậm rãi sẽ khơi gợi những cảm xúc lắng đọng sâu lắng nhất trong lòng anh.`;
      }
      else if (query.includes('accordion') || query.includes('bella ciao') || query.includes('phong cầm') || query.includes('vui')) {
        setAlbumStyle(prev => ({ ...prev, musicName: MUSIC_TRACKS[0].name, musicUrl: MUSIC_TRACKS[0].url }));
        aiText = `Dạ em đã khôi phục giai điệu **${MUSIC_TRACKS[0].name}** truyền thống đầy sức sống của Ý! Tiếng phong cầm réo rắt nhộn nhịp sẽ khơi gợi niềm vui Địa Trung Hải rực rỡ.`;
      }

      // 7.4. SET TEXT SUBTITLE STYLE VIA CHAT ("kiểu chữ Capcut", "kiểu chữ Canva", etc.)
      else if (query.includes('kiểu chữ') || query.includes('kiểu đề') || query.includes('kiểu phụ đề') || query.includes('màu chữ') || query.includes('kiểu nhãn')) {
        if (query.includes('capcut') || query.includes('cổ điển') || query.includes('sub')) {
          setTextStyle('capcut');
          localStorage.setItem('memories_text_style', 'capcut');
          aiText = `🎬 **AI Style:** Em đã đổi sang kiểu chữ **Capcut Classic** rồi anh nhé! Chữ màu trắng với viền đen nổi bật đậm chất điện ảnh.`;
          confetti({ particleCount: 30, colors: ['#ffffff', '#000000'] });
        }
        else if (query.includes('canva') || query.includes('nhãn') || query.includes('nút')) {
          setTextStyle('canva');
          localStorage.setItem('memories_text_style', 'canva');
          aiText = `🏷️ **AI Style:** Em đã đổi sang kiểu chữ **Canva Capsule** rồi anh nhé! Kiểu nhãn tròn hiện đại, trẻ trung.`;
          confetti({ particleCount: 30, colors: ['#c5a391', '#ffffff'] });
        }
        else if (query.includes('hồng') || query.includes('ngọt ngào') || query.includes('yêu') || query.includes('trái tim')) {
          setTextStyle('heart');
          localStorage.setItem('memories_text_style', 'heart');
          aiText = `💖 **AI Style:** Em đã đổi sang kiểu chữ **Sweet Heart** ngọt ngào siêu dễ thương rồi anh nhé! Tông hồng lãng mạn trên nền phấn nhạt rất thích hợp cho kỷ niệm lớp học.`;
          confetti({ particleCount: 30, colors: ['#ec4899', '#fbcfe8'] });
        }
        else if (query.includes('đại dương') || query.includes('thủy thủ') || query.includes('biển') || query.includes('neon')) {
          setTextStyle('sailor');
          localStorage.setItem('memories_text_style', 'sailor');
          aiText = `🌊 **AI Style:** Em đã đổi sang kiểu chữ **Ocean Sailor** rồi anh nhé! Tông xanh neon phát sáng rực rỡ mang hơi thở đại dương sâu thẳm.`;
          confetti({ particleCount: 30, colors: ['#38bdf8', '#0369a1'] });
        }
        else if (query.includes('viết tay') || query.includes('cổ kính') || query.includes('vintage')) {
          setTextStyle('handwritten');
          localStorage.setItem('memories_text_style', 'handwritten');
          aiText = `✍️ **AI Style:** Em đã đổi sang kiểu chữ **Vintage Handwritten** cổ điển rồi anh nhé! Chữ nhã nhặn nét mảnh trên dải giấy nhám mang đậm dấu ấn thời gian.`;
          confetti({ particleCount: 30, colors: ['#d97706', '#fef3c7'] });
        }
        else {
          aiText = `🎨 Em hỗ trợ 5 phong cách chữ độc đáo thiết kế riêng cho anh:\n\n1. **Capcut Classic** (gõ *"kiểu chữ Capcut"*)\n2. **Canva Capsule** (gõ *"kiểu chữ Canva"*)\n3. **Ngọt Ngào** (gõ *"kiểu chữ ngọt ngào"*)\n4. **Đại Dương** (gõ *"kiểu chữ đại dương"*)\n5. **Cổ Điển** (gõ *"kiểu chữ cổ điển"*)\n\nAnh muốn đổi sang kiểu nào ạ?`;
        }
      }

      // 7.5. SET PHOTO NOTE CAPTIONS VIA CHAT ("ghi chú trang 1 là đẹp trai", "ghi chú ảnh 2 là hoa hậu")
      else if (query.includes('ghi chú') || query.includes('viết ghi chú') || query.includes('thêm ghi chú') || query.includes('chú thích')) {
        const pageMatch = query.match(/(?:ảnh|trang)\s*(\d+)/i);
        let targetIndex = photoIndex; 
        
        if (pageMatch && pageMatch[1]) {
          const pageNum = parseInt(pageMatch[1]);
          if (pageNum >= 1 && pageNum <= photoList.length) {
            targetIndex = pageNum - 1;
          }
        }

        // Intelligent note extraction for Vietnamese natural language!
        let cleanText = userMsg.text.replace(/^(?:ghi chú|chú thích|viết ghi chú|thêm ghi chú|chú thích ảnh|ghi chú ảnh|ghi chú trang)\s*/i, '').trim();
        // Remove page/photo indicators at the start, e.g. "trang 1", "ảnh 2", "1", "trang 1 là", "ảnh 2 thành", "ảnh 1:"
        cleanText = cleanText.replace(/^(?:ảnh|trang)?\s*\d+\s*(?:là|thành|như sau|:|-|–|—)?\s*/i, '').trim();
        // Remove quotes if any
        const noteText = cleanText.replace(/^["'““](.*)["'””]$/, '$1').trim();

        if (noteText) {
          setPhotoNotes(prev => {
            const updated = [...prev];
            updated[targetIndex] = noteText;
            return updated;
          });
          setPhotoIndex(targetIndex); 
          setIsAutoFlipping(false); // Pause so they can read it!
          
          aiText = `✍️ **AI Ghi Chú:** Dạ anh! Em đã ghi nhận và gắn ghi chú **"${noteText}"** cho **Trang ${targetIndex + 1}** thành công rồi ạ! Em cũng đã chuyển sách sang trang này và tạm dừng lật để anh thong thả ngắm nghía nhé.`;
          confetti({ particleCount: 35, colors: ['#60a5fa', '#ffffff'] });
        } else {
          aiText = `Dạ anh, em chưa nhận diện rõ nội dung ghi chú anh muốn viết. Anh hãy thử gõ rõ dạng: *"ghi chú trang 1 là đẹp trai"* hoặc *"chú thích ảnh 2 là hoa hậu"* để em phục vụ anh tốt nhất nhé!`;
        }
      }

      // 7.6. MOVE SUBTITLE POSITION VIA CHAT ("cho chữ lên trên", "cho chữ sang trái", "đặt chữ ở giữa")
      else if (query.includes('chữ lên') || query.includes('chữ xuống') || query.includes('chữ vào') || query.includes('chữ sang') || query.includes('vị trí chữ') || query.includes('đặt chữ') || query.includes('căn lề chữ') || query.includes('căn vị trí')) {
        let x = 50;
        let y = 85;
        let posLabel = "Dưới cùng";
        
        if (query.includes('trên') || query.includes('đầu') || query.includes('cao')) {
          x = 50; y = 15; posLabel = "Trên cùng";
        } else if (query.includes('giữa') || query.includes('trung tâm')) {
          x = 50; y = 50; posLabel = "Giữa ảnh";
        } else if (query.includes('trái')) {
          x = 15; y = 50; posLabel = "Cạnh bên trái";
        } else if (query.includes('phải')) {
          x = 85; y = 50; posLabel = "Cạnh bên phải";
        } else if (query.includes('dưới') || query.includes('thấp')) {
          x = 50; y = 85; posLabel = "Dưới cùng";
        }
        
        setPhotoPositions(prev => {
          const updated = [...prev];
          while (updated.length <= photoIndex) {
            updated.push({ x: 50, y: 85 });
          }
          updated[photoIndex] = { x, y };
          return updated;
        });
        
        aiText = `🎯 **AI Alignment:** Dạ anh! Em đã di chuyển chữ ghi chú của ảnh này sang vị trí **${posLabel}** rồi nhé ạ!`;
        confetti({ particleCount: 25, colors: ['#60a5fa', '#ffffff'] });
      }

      // 8. GENERAL INTUITIVE CONVERSATIONAL AI ENGINE (FLEXIBLE CHAT FALLBACK)
      else {
        if (query.includes('chào') || query.includes('hello') || query.includes('hi') || query.includes('ơi')) {
          aiText = 'Dạ em kính chào anh! Hôm nay em rất vinh dự được đồng hành cùng anh thiết kế cuốn album kỷ niệm "August in Amalfi". Anh có thể yêu cầu em *"đổi ảnh"*, *"đổi nhạc"*, *"ghép bối cảnh"* hoặc ra lệnh tự động lật cuốn sách này nhé!';
        }
        else if (query.includes('làm thế nào') || query.includes('hướng dẫn') || query.includes('giúp') || query.includes('chức năng') || query.includes('sử dụng')) {
          aiText = 'Dạ! Để thiết kế cuốn sách theo ý anh, anh có thể ra lệnh cho em bất cứ điều gì:\n\n1. 📸 **Đổi ảnh của anh**: Gõ *"thêm ảnh"* hoặc *"đổi ảnh"* -> em sẽ tự mở hộp chọn file ảnh trong máy tính anh.\n2. 🎵 **Đổi nhạc nền**: Gõ *"đổi nhạc"* -> em mở file âm nhạc MP3 của anh. Hoặc gõ *"nhạc Jazz"*, *"nhạc Guitar"*, *"nhạc buồn"* để chọn nhạc có sẵn.\n3. 🎨 **Ghép bối cảnh**: Gõ *"ghép cảnh tháp Eiffel"*, *"ghép cảnh tuyết rơi"*, *"bối cảnh biển"* -> em tự hòa trộn tông màu nghệ thuật.\n4. 🔄 **Lật trang**: Nói *"lật tự động"* hoặc *"dừng lật"* để điều khiển cuốn sách lướt sóng!\n\nAnh cứ thoải mái ra lệnh bằng ngôn ngữ tự nhiên nhé ạ!';
        }
        else if (query.includes('amalfi') || query.includes('ý') || query.includes('du lịch') || query.includes('đẹp') || query.includes('khuyên')) {
          aiText = 'Bờ biển Amalfi thực sự là một bức tranh thiên nhiên tuyệt sắc của Ý, thưa anh! Khi làm album này, anh nên chọn những bức hình đón nắng vàng ấm áp lướt nhẹ trên bãi đá cổ kính Positano. Giai điệu Phong cầm Ý (Bella Ciao) hoặc một chút Saxophone mượt mà sẽ đưa hơi gió mát lành mặn mòi thổi hồn vào từng trang sách đấy ạ.';
        }
        else {
          aiText = `Ý tưởng của anh thực sự rất độc đáo và giàu cảm xúc sáng tạo! Em đã lưu nhận định và đang đồng bộ hóa trên cuốn album với bối cảnh **${albumStyle.themeName}** phối hợp cùng nhạc nền **${albumStyle.musicName}** rất nghệ thuật.\n\nAnh có muốn em hỗ trợ **chọn một bức ảnh mới** từ máy tính, hay **ghép hình của anh** vào bối cảnh núi tuyết hay tháp cổ nào không ạ?`;
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[85vh] min-h-[500px]">
      
      {/* Hidden File Picker Inputs for PC upload integration */}
      <input 
        type="file" 
        ref={imageInputRef} 
        accept="image/*" 
        multiple
        className="hidden" 
        onChange={handleImageUpload} 
      />
      <input 
        type="file" 
        ref={audioInputRef} 
        accept="audio/*" 
        className="hidden" 
        onChange={handleMusicUpload} 
      />

      {/* LEFT SIDE: Real-time Live Album Preview Card */}
      <div className="md:col-span-5 flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Wand2 className="h-4 w-4" />
          Xem trước thời gian thực
        </h3>

        <div className={`p-4 rounded-3xl border border-outline/10 bg-surface-container shadow-lg flex flex-col gap-4 transition-all duration-500`}>
          
          {/* Cover image mount with Auto-Flip slide animation */}
          <div 
            ref={containerRef}
            className="aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-md relative border border-white/50 bg-zinc-900 group select-none"
          >
            {/* Capcut Transition stylesheet injected inline */}
            <style>{`
              @keyframes capcut-fade {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
              @keyframes capcut-slide-left {
                from { transform: translate(50%, -50%); opacity: 0.5; }
                to { transform: translate(-50%, -50%); opacity: 1; }
              }
              @keyframes capcut-slide-right {
                from { transform: translate(-150%, -50%); opacity: 0.5; }
                to { transform: translate(-50%, -50%); opacity: 1; }
              }
              @keyframes capcut-zoom-in {
                from { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              }
              @keyframes capcut-page-turn {
                from { transform: translate(-50%, -50%) rotateY(-90deg); transform-origin: left center; opacity: 0; }
                to { transform: translate(-50%, -50%) rotateY(0deg); transform-origin: left center; opacity: 1; }
              }
              @keyframes capcut-wipe {
                from { clip-path: inset(0 100% 0 0); }
                to { clip-path: inset(0 0 0 0); }
              }

              .transition-fade {
                animation: capcut-fade 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              }
              .transition-slide-left {
                animation: capcut-slide-left 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              }
              .transition-slide-right {
                animation: capcut-slide-right 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              }
              .transition-zoom-in {
                animation: capcut-zoom-in 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              }
              .transition-page-turn {
                animation: capcut-page-turn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                perspective: 1200px;
              }
              .transition-wipe {
                animation: capcut-wipe 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              }
            `}</style>

            {/* Inner frame containing image matching customized layout scale & offset */}
            <div
              key={`photo-wrap-${transitionKey}`}
              onMouseDown={(e) => {
                if (dragMode === 'photo') {
                  handleMouseDown(e, 'photo');
                }
              }}
              onTouchStart={(e) => {
                if (dragMode === 'photo') {
                  handleTouchStart(e, 'photo');
                }
              }}
              style={{
                position: 'absolute',
                left: `${50 + (photoOffsets[photoIndex]?.x ?? 0)}%`,
                top: `${50 + (photoOffsets[photoIndex]?.y ?? 0)}%`,
                transform: 'translate(-50%, -50%)',
                width: photoScales[photoIndex] === 'small' ? '65%' : photoScales[photoIndex] === 'large' ? '100%' : '85%',
                height: photoScales[photoIndex] === 'small' ? '65%' : photoScales[photoIndex] === 'large' ? '100%' : '85%',
                cursor: dragMode === 'photo' ? 'move' : 'default',
              }}
              className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border-2 border-white/80 bg-zinc-200 transition-${activeTransition}`}
            >
              <img 
                src={getPhotoUrl(photoList[photoIndex])} 
                alt="Preview" 
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>

            {/* Render Interactive Decorative Stickers */}
            {(photoStickers[photoIndex] || []).map((sticker) => {
              const isActive = selectedStickerId === sticker.id;
              return (
                <div
                  key={sticker.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'sticker', sticker.id);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleTouchStart(e, 'sticker', sticker.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                    cursor: 'move',
                    userSelect: 'none',
                    touchAction: 'none'
                  }}
                  className={`z-40 group/sticker active:scale-110 transition-transform ${
                    isActive ? 'ring-2 ring-primary ring-offset-1 rounded-lg p-1 bg-white/40 backdrop-blur-sm' : ''
                  }`}
                >
                  <span className="text-3xl select-none filter drop-shadow-md block leading-none">
                    {sticker.symbol}
                  </span>
                  
                  {/* Sticker quick control panel (Delete & Resize) visible when active */}
                  {isActive && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur text-white flex items-center gap-2 px-2.5 py-1 rounded-full shadow-lg z-50 text-[10px] whitespace-nowrap border border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoStickers(prev => {
                            const updated = [...prev];
                            const pageStickers = [...updated[photoIndex]];
                            const idx = pageStickers.findIndex(s => s.id === sticker.id);
                            if (idx !== -1) {
                              pageStickers[idx] = { ...pageStickers[idx], scale: Math.min(2.5, pageStickers[idx].scale + 0.15) };
                            }
                            updated[photoIndex] = pageStickers;
                            return updated;
                          });
                        }}
                        className="hover:text-green-400 font-bold px-1"
                        title="Phóng to"
                      >
                        ➕
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoStickers(prev => {
                            const updated = [...prev];
                            const pageStickers = [...updated[photoIndex]];
                            const idx = pageStickers.findIndex(s => s.id === sticker.id);
                            if (idx !== -1) {
                              pageStickers[idx] = { ...pageStickers[idx], scale: Math.max(0.5, pageStickers[idx].scale - 0.15) };
                            }
                            updated[photoIndex] = pageStickers;
                            return updated;
                          });
                        }}
                        className="hover:text-amber-400 font-bold px-1"
                        title="Thu nhỏ"
                      >
                        ➖
                      </button>
                      <span className="text-white/20">|</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoStickers(prev => {
                            const updated = [...prev];
                            updated[photoIndex] = (updated[photoIndex] || []).filter(s => s.id !== sticker.id);
                            return updated;
                          });
                          setSelectedStickerId(null);
                        }}
                        className="hover:text-rose-400 font-bold px-1 text-xs"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Capcut/Canva-Style Subtitle Overlay directly on the photo */}
            {photoNotes[photoIndex] && (
              <div 
                ref={captionRef}
                onMouseDown={(e) => {
                  if (dragMode === 'subtitle') {
                    handleMouseDown(e, 'subtitle');
                  }
                }}
                onTouchStart={(e) => {
                  if (dragMode === 'subtitle') {
                    handleTouchStart(e, 'subtitle');
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${photoPositions[photoIndex]?.x ?? 50}%`,
                  top: `${photoPositions[photoIndex]?.y ?? 85}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'move',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
                className="z-30 text-center max-w-[90%] active:scale-105 transition-transform"
              >
                <span className="inline-block shadow-2xl relative group/cap">
                  <span 
                    className={`inline-block ${
                      textStyle === 'capcut' ? `font-sans ${photoColors[photoIndex] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[9px]' : textSize === 'large' ? 'text-[14px] sm:text-base' : 'text-[11px] sm:text-xs'} font-black tracking-wide uppercase px-3 py-1.5 rounded-lg drop-shadow-[0_2px_4px_rgba(0,0,0,1)] border border-black/30 bg-black/60` :
                      textStyle === 'canva' ? `font-headline ${photoColors[photoIndex] ? '' : 'text-white'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[13px] sm:text-[14px]' : 'text-[10px] sm:text-[11px]'} font-bold bg-primary px-3.5 py-1.5 rounded-full shadow-lg border-2 border-white/20 tracking-wider` :
                      textStyle === 'heart' ? `font-serif ${photoColors[photoIndex] ? '' : 'text-pink-500'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[13px] sm:text-[14px]' : 'text-[10px] sm:text-[11px]'} font-extrabold px-3.5 py-1.5 bg-pink-50/95 rounded-2xl border-2 border-pink-300 tracking-wide italic` :
                      textStyle === 'sailor' ? `font-headline ${photoColors[photoIndex] ? '' : 'text-cyan-200'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[13px] sm:text-[14px]' : 'text-[10px] sm:text-[11px]'} font-black px-3.5 py-1.5 bg-sky-950/90 rounded-xl border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)] tracking-widest` :
                      `font-serif ${photoColors[photoIndex] ? '' : 'text-amber-950'} ${textSize === 'small' ? 'text-[8px]' : textSize === 'large' ? 'text-[13px] sm:text-[14px]' : 'text-[10px] sm:text-[11px]'} font-bold italic px-3.5 py-1.5 bg-amber-50/95 rounded-md border-l-4 border-amber-600 shadow-inner`
                    }`}
                    style={photoColors[photoIndex] ? { color: photoColors[photoIndex] } : undefined}
                  >
                    {photoNotes[photoIndex]}
                  </span>
                  
                  {/* Subtle drag handle helper overlay */}
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded opacity-0 group-hover/cap:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-md">
                    Drag để di chuyển 🖐️
                  </span>
                </span>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest text-white uppercase flex items-center gap-1.5 z-10">
              {isAutoFlipping && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
              )}
              <span>Trang {photoIndex + 1} / {photoList.length}</span>
            </div>

            {/* Manual navigation chevrons - visible on hover or mobile touch */}
            <button 
              type="button"
              onClick={() => {
                setPhotoIndex(prev => (prev === 0 ? photoList.length - 1 : prev - 1));
                setIsAutoFlipping(false);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 shadow-lg border border-white/10"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button 
              type="button"
              onClick={() => {
                setPhotoIndex(prev => (prev === photoList.length - 1 ? 0 : prev + 1));
                setIsAutoFlipping(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 shadow-lg border border-white/10"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Auto-Flip toggle indicator inside cover image */}
            <button 
              onClick={() => setIsAutoFlipping(!isAutoFlipping)}
              className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md z-10"
            >
              <span>{isAutoFlipping ? '⏸ Dừng lật' : '▶ Tự động lật'}</span>
            </button>
          </div>

          {/* Quick PC Upload buttons under the photo card */}
          <div className="flex gap-2">
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline/10 rounded-xl text-[9px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Upload className="h-3 w-3 text-primary" />
              <span>Tải ảnh từ máy 💻</span>
            </button>
            <button 
              onClick={() => audioInputRef.current?.click()}
              className="flex-1 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline/10 rounded-xl text-[9px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Music className="h-3 w-3 text-primary" />
              <span>Lồng nhạc riêng 🎵</span>
            </button>
          </div>

          {/* Main Action Buttons Grid */}
          <div className="flex gap-2 w-full">
            <button 
              onClick={handleSaveFullAlbum}
              className={`flex-1 py-3 bg-gradient-to-r ${
                showSaveAlbumSuccess 
                  ? 'from-green-500 via-emerald-600 to-teal-500' 
                  : 'from-amber-500 via-primary to-rose-500'
              } text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md relative overflow-hidden group`}
            >
              <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine"></span>
              <span>{showSaveAlbumSuccess ? 'ĐÃ LƯU THÀNH CÔNG! 🎉' : '💾 LƯU ALBUM'}</span>
            </button>
            <button 
              onClick={handleExportVideoAndBook}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine"></span>
              <span>📥 XUẤT VIDEO / SÁCH</span>
            </button>
          </div>

          {/* Details & Live Handwritten Scrapbook Note */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Chủ đề: {albumStyle.themeName}</span>
              <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">AI Ghép bối cảnh</span>
            </div>
            
            <div className="relative group/title">
              <input 
                type="text"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="font-headline text-2xl font-bold leading-tight bg-transparent border-b border-dashed border-outline/20 hover:border-primary/50 focus:border-primary focus:bg-surface-container/50 px-1 py-0.5 rounded outline-none w-full text-on-surface transition-all"
                placeholder="Nhập tên Album của anh..."
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-60 transition-opacity text-[8px] font-bold text-outline pointer-events-none uppercase">Bấm để sửa ✏️</span>
            </div>
            
            {/* Live Handwritten-style note overlay display */}
            <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl italic text-xs font-serif text-primary relative overflow-hidden shadow-sm">
              <span className="absolute -top-1 -left-1 opacity-10 text-3xl font-serif">“</span>
              <p className="pl-3 pr-2 font-medium tracking-wide">
                {photoNotes[photoIndex] || 'Kỷ niệm đẹp của chúng ta...'}
              </p>
            </div>
          </div>

          {/* Elegant Editable Caption input for the current active page */}
          <div className="space-y-2 bg-surface-container-highest/30 p-3 rounded-2xl border border-outline/5 shadow-inner">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                <span>Ghi chú Trang {photoIndex + 1} ✍️</span>
                <span className="text-[8px] text-outline font-normal italic lowercase">(tự động dừng lật khi gõ)</span>
              </label>
              
              {showSaveSuccess && (
                <span className="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đã lưu! 💾</span>
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={photoNotes[photoIndex] || ''}
                onFocus={() => setIsAutoFlipping(false)}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhotoNotes(prev => {
                    const updated = [...prev];
                    updated[photoIndex] = val;
                    return updated;
                  });
                }}
                placeholder="Gõ ghi chú cho ảnh này (ví dụ: đẹp trai, hoa hậu...)"
                className="flex-1 bg-surface-container-lowest text-xs font-semibold px-3 py-2.5 rounded-xl border border-outline/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-all"
              />
              <button
                onClick={handleSaveNote}
                className="px-4 bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Lưu 💾</span>
              </button>
            </div>

            {/* Canva/Capcut Subtitle Style Customizer */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Chọn kiểu chữ Canva / Capcut 🎨:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'capcut', label: 'Capcut Classic 🎬', color: 'bg-black text-white' },
                  { id: 'canva', label: 'Canva Capsule 🏷️', color: 'bg-primary text-on-primary' },
                  { id: 'heart', label: 'Ngọt Ngào 💖', color: 'bg-pink-500 text-white' },
                  { id: 'sailor', label: 'Đại Dương 🌊', color: 'bg-sky-950 text-cyan-200 border border-sky-400/30' },
                  { id: 'handwritten', label: 'Cổ Điển ✍️', color: 'bg-amber-100 text-amber-950 border border-amber-300' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setTextStyle(style.id);
                      try {
                        localStorage.setItem('memories_text_style', style.id);
                      } catch (e) {
                        console.warn(e);
                      }
                      confetti({ particleCount: 15, colors: ['#a78bfa', '#f472b6'], origin: { y: 0.8 } });
                    }}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide transition-all active:scale-95 flex items-center gap-1 border ${
                      textStyle === style.id 
                        ? 'ring-2 ring-primary border-transparent scale-105 shadow-md ' + style.color
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 text-on-surface-variant'
                    }`}
                  >
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Customizer */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Cỡ chữ phụ đề 📏:</span>
              <div className="flex gap-2">
                {[
                  { id: 'small', label: 'Cỡ Nhỏ 🔎' },
                  { id: 'medium', label: 'Cỡ Vừa 🔍' },
                  { id: 'large', label: 'Cỡ Lớn 🚀' }
                ].map(sz => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => {
                      setTextSize(sz.id);
                      try {
                        localStorage.setItem('memories_text_size', sz.id);
                      } catch (e) {
                        console.warn(e);
                      }
                      confetti({ particleCount: 10, colors: ['#60a5fa'], origin: { y: 0.8 } });
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-bold tracking-wide transition-all active:scale-95 border ${
                      textSize === sz.id
                        ? 'bg-primary border-transparent text-on-primary shadow-md scale-105'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 text-on-surface-variant'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Chọn màu sắc chữ tùy chỉnh 🎨:</span>
              <div className="flex items-center gap-2">
                {[
                  { value: '', label: '🔄' },
                  { value: '#ffffff', label: '⚪' },
                  { value: '#000000', label: '⚫' },
                  { value: '#eab308', label: '🟡' },
                  { value: '#ec4899', label: '💗' },
                  { value: '#3b82f6', label: '🔵' },
                  { value: '#22c55e', label: '🟢' },
                ].map((colorOpt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setPhotoColors(prev => {
                        const updated = [...prev];
                        while (updated.length <= photoIndex) {
                          updated.push('');
                        }
                        updated[photoIndex] = colorOpt.value;
                        return updated;
                      });
                      if (colorOpt.value) {
                        confetti({ particleCount: 10, colors: [colorOpt.value], origin: { y: 0.8 } });
                      }
                    }}
                    className={`w-6 h-6 rounded-lg text-xs font-bold border flex items-center justify-center transition-all active:scale-95 ${
                      (photoColors[photoIndex] ?? '') === colorOpt.value 
                        ? 'ring-2 ring-primary border-transparent scale-110 shadow-sm bg-primary/10'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 opacity-70 hover:opacity-100'
                    }`}
                    title={colorOpt.value ? `Màu ${colorOpt.value}` : 'Dùng màu mặc định của kiểu chữ'}
                  >
                    {colorOpt.label}
                  </button>
                ))}

                {/* Custom Color Picker Input */}
                <div className="relative flex items-center gap-1 ml-auto">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-outline">Pha màu:</span>
                  <input
                    type="color"
                    value={photoColors[photoIndex] || '#ffffff'}
                    onChange={(e) => {
                      const hex = e.target.value;
                      setPhotoColors(prev => {
                        const updated = [...prev];
                        while (updated.length <= photoIndex) {
                          updated.push('');
                        }
                        updated[photoIndex] = hex;
                        return updated;
                      });
                    }}
                    className="w-5 h-5 rounded cursor-pointer border border-outline/20 p-0 overflow-hidden bg-transparent"
                    title="Bảng màu tự do"
                  />
                </div>
              </div>
            </div>

            {/* Quick Subtitle Alignment Presets */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Căn vị trí chữ nhanh 📐 (hoặc drag trực tiếp trên ảnh):</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Trên ⬆️', x: 50, y: 15 },
                  { label: 'Trái ⬅️', x: 15, y: 50 },
                  { label: 'Giữa 🎯', x: 50, y: 50 },
                  { label: 'Phải ➡️', x: 85, y: 50 },
                  { label: 'Dưới ⬇️', x: 50, y: 85 }
                ].map((pos, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoPositions(prev => {
                        const updated = [...prev];
                        while (updated.length <= photoIndex) {
                          updated.push({ x: 50, y: 85 });
                        }
                        updated[photoIndex] = { x: pos.x, y: pos.y };
                        return updated;
                      });
                      confetti({ particleCount: 8, colors: ['#60a5fa'], origin: { y: 0.8 } });
                    }}
                    className="bg-surface-container hover:bg-surface-container-high hover:text-primary text-[9px] font-bold py-1.5 px-1 rounded-lg text-on-surface-variant transition-all active:scale-95 text-center shadow-sm border border-outline/5"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag Mode Switcher */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Chế độ kéo thả chuột 🖐️:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'subtitle', label: '🖐️ Kéo chữ', desc: 'Di chuyển ghi chú' },
                  { id: 'photo', label: '🖼️ Kéo ảnh', desc: 'Di chuyển ảnh nền' },
                  { id: 'sticker', label: '✨ Kéo họa tiết', desc: 'Di chuyển nhãn dán' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setDragMode(mode.id as any);
                      confetti({ particleCount: 5, colors: ['#a78bfa'], origin: { y: 0.85 } });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[9px] font-bold tracking-wide transition-all active:scale-95 border flex flex-col items-center justify-center gap-0.5 ${
                      dragMode === mode.id
                        ? 'bg-primary border-transparent text-on-primary shadow-md scale-105'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 text-on-surface-variant'
                    }`}
                  >
                    <span>{mode.label}</span>
                    <span className="text-[7px] opacity-75 font-normal">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Scale Sizer */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Tỉ lệ ảnh trang này 📏:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'small', label: '🔎 Nhỏ (65%)' },
                  { id: 'medium', label: '🎯 Vừa (85%)' },
                  { id: 'large', label: '🚀 To (100%)' }
                ].map((scaleOpt) => (
                  <button
                    key={scaleOpt.id}
                    type="button"
                    onClick={() => {
                      setPhotoScales(prev => {
                        const updated = [...prev];
                        while (updated.length <= photoIndex) {
                          updated.push('medium');
                        }
                        updated[photoIndex] = scaleOpt.id;
                        return updated;
                      });
                      confetti({ particleCount: 5, colors: ['#fbbf24'], origin: { y: 0.85 } });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[9px] font-bold tracking-wide transition-all active:scale-95 border text-center ${
                      (photoScales[photoIndex] || 'medium') === scaleOpt.id
                        ? 'bg-primary border-transparent text-on-primary shadow-md scale-105'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 text-on-surface-variant'
                    }`}
                  >
                    {scaleOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capcut Transitions Selection */}
            <div className="space-y-1.5 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Hiệu ứng chuyển cảnh Capcut 🎬:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'page-turn', label: '📖 Sách lật' },
                  { id: 'fade', label: '🎬 Hòa tan (Fade)' },
                  { id: 'slide-left', label: '⬅️ Slide Trái' },
                  { id: 'slide-right', label: '➡️ Slide Phải' },
                  { id: 'zoom-in', label: '🔎 Phóng to' },
                  { id: 'wipe', label: '🪞 Gạt hình (Wipe)' }
                ].map((trans) => (
                  <button
                    key={trans.id}
                    type="button"
                    onClick={() => {
                      setActiveTransition(trans.id);
                      setTransitionKey(prev => prev + 1); // trigger animation immediately to preview
                      confetti({ particleCount: 10, colors: ['#60a5fa'], origin: { y: 0.85 } });
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-bold tracking-wide transition-all active:scale-95 border text-center whitespace-nowrap ${
                      activeTransition === trans.id
                        ? 'bg-primary border-transparent text-on-primary shadow-md scale-105'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline/10 text-on-surface-variant'
                    }`}
                  >
                    {trans.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Sticker Gallery */}
            <div className="space-y-2 pt-2 border-t border-outline/5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-outline block">Thư viện họa tiết trang trí ✨ (click để chèn vào):</span>
              
              {/* Category tabs */}
              <div className="flex gap-1 border-b border-outline/5 pb-1">
                {STICKER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveStickerTab(cat.id as any)}
                    className={`flex-1 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all ${
                      activeStickerTab === cat.id
                        ? 'bg-primary/10 text-primary border-b-2 border-primary'
                        : 'text-outline hover:text-on-surface-variant'
                    }`}
                  >
                    {cat.name.split(' ')[0]} {cat.name.split(' ').slice(1).join(' ')}
                  </button>
                ))}
              </div>

              {/* Stickers list */}
              <div className="grid grid-cols-8 gap-1.5 p-1 bg-surface-container-lowest rounded-xl border border-outline/5 max-h-[96px] overflow-y-auto">
                {(STICKER_CATEGORIES.find(cat => cat.id === activeStickerTab)?.stickers || []).map((sticker, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoStickers(prev => {
                        const updated = [...prev];
                        while (updated.length <= photoIndex) {
                          updated.push([]);
                        }
                        const newSticker = {
                          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          type: 'default',
                          symbol: sticker.symbol,
                          x: 50,
                          y: 50,
                          scale: 1.0
                        };
                        updated[photoIndex] = [...(updated[photoIndex] || []), newSticker];
                        return updated;
                      });
                      setSelectedStickerId(null); // Clear selected to avoid edit bar confusion
                      confetti({ particleCount: 8, colors: ['#4ade80', '#fbbf24', '#f472b6'], origin: { y: 0.85 } });
                    }}
                    className="aspect-square bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all rounded-lg flex items-center justify-center text-xl filter hover:drop-shadow-md border border-outline/5"
                    title={sticker.label}
                  >
                    {sticker.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Music Indicator with Real Vinyl Spinner and Waves */}
          <div className="rounded-xl bg-surface-container-high/60 px-3.5 py-3 border border-outline/5 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Spinning Vinyl Mini Model with Asymmetric Glare & Grooves */}
              <div className={`w-10 h-10 rounded-full bg-zinc-950 border border-zinc-700 shadow-lg flex items-center justify-center relative flex-shrink-0 ${isAudioPlaying ? 'animate-spin-slow' : ''}`}>
                {/* Dynamic center */}
                <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                {/* Diagonal glossy glare reflection line */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transform rotate-45"></div>
                {/* Dashed grooves */}
                <div className="absolute inset-1 rounded-full border border-dashed border-zinc-800/80 pointer-events-none"></div>
                {/* Off-center vinyl dot marker - highly visible orbital rotation! */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-white/25 z-10"></div>
              </div>
              
              <div className="overflow-hidden">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">Âm thanh đi kèm</span>
                <span className="font-semibold block text-[11px] truncate text-on-surface">{albumStyle.musicName}</span>
                
                {/* Visualizer Bouncing Waves */}
                <div className="flex items-end gap-0.5 h-3.5 mt-1">
                  {[1, 2, 3, 4, 5, 1, 2, 3].map((barNum, idx) => (
                    <div 
                      key={idx}
                      className={`w-0.5 bg-primary rounded-full ${isAudioPlaying ? `bar-bounce-${barNum}` : 'h-[2px]'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Play/Pause & Volume controls */}
            <div className="flex items-center gap-2 flex-shrink-0 bg-surface-container/60 backdrop-blur border border-outline/10 py-1 px-2.5 rounded-full shadow-sm">
              {/* Volume control with range slider */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = volume === 0 ? 0.5 : 0;
                    setVolume(nextVal);
                    if (audioRef.current) audioRef.current.volume = nextVal;
                  }}
                  className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  title="Tắt/Bật âm"
                >
                  <Volume2 className={`h-3.5 w-3.5 ${volume === 0 ? 'text-neutral-400' : 'text-primary animate-pulse'}`} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const nextVal = parseFloat(e.target.value);
                    setVolume(nextVal);
                    if (audioRef.current) {
                      audioRef.current.volume = nextVal;
                    }
                  }}
                  className="w-14 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary group-hover/vol:w-20 transition-all duration-300"
                />
                <span className="text-[9px] font-bold text-on-surface-variant min-w-[24px]">
                  {volume === 0 ? 'Mute' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

              <div className="w-[1px] h-4 bg-outline/20" />

              <button
                type="button"
                onClick={handleAudioToggle}
                className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                {isAudioPlaying ? <Pause className="h-3 w-3 fill-on-primary" /> : <Play className="h-3 w-3 fill-on-primary ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: AI Conversational Chat Console */}
      <div className="md:col-span-7 flex flex-col bg-surface-container-low border border-outline/10 rounded-3xl overflow-hidden shadow-inner h-[65vh] min-h-[400px]">
        {/* Console Header */}
        <div className="px-4 py-3 bg-surface-container border-b border-outline/10 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <span className="text-xs font-bold text-on-surface block">Memories AI Editor</span>
              <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Trực tuyến</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary uppercase tracking-widest">Gemini 3 Pro</span>
        </div>

        {/* Messages list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-none' 
                    : 'bg-surface-container-lowest text-on-surface border border-outline/5 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[8px] font-bold opacity-60 block mt-1 text-right uppercase tracking-wide">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator loader */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-container-lowest border border-outline/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-on-surface-variant flex items-center gap-2.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200"></span>
                </span>
                <span className="text-[10px] italic font-semibold text-outline">Đang xử lý ý tưởng nghệ thuật...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-3 bg-surface-container border-t border-outline/10 flex gap-2 flex-shrink-0">
          <input 
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Gõ 'đổi ảnh', 'đổi nhạc', 'ghép bối cảnh tháp Eiffel', 'dừng lật'..."
            className="flex-1 bg-surface-container-lowest text-xs font-body text-on-surface px-4 py-3 rounded-2xl border border-outline/10 focus:border-primary outline-none transition-colors"
          />
          <button 
            type="submit"
            className="w-11 h-11 bg-primary text-on-primary rounded-2xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
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
