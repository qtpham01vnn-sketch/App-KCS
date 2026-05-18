import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  Leaf, 
  Tv, 
  Cpu, 
  Eye, 
  Factory, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { registerLocalFile, resolveMediaUrl } from '../utils/db';

interface SceneryOption {
  id: string;
  url: string;
  subCategory: string;
  name: string;
}

// Predefined high-quality scenery templates across 5 Bento blocks
const SCENERY_TEMPLATES: Record<string, SceneryOption[]> = {
  nature: [
    { id: 'n1', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop', subCategory: 'Rừng thông', name: 'Rừng thông tĩnh lặng' },
    { id: 'n2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', subCategory: 'Biển cả', name: 'Bãi cát hoàng hôn' },
    { id: 'n3', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop', subCategory: 'Núi non', name: 'Đỉnh núi tuyết phủ' },
    { id: 'n4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop', subCategory: 'Sông suối', name: 'Suối mát thung lũng' },
    { id: 'n5', url: 'https://images.unsplash.com/photo-1500627869374-13cd993b1115?q=80&w=600&auto=format&fit=crop', subCategory: 'Cây cối', name: 'Cây sồi vàng mùa thu' }
  ],
  production: [
    { id: 'p1', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop', subCategory: 'Nhà xưởng', name: 'Dây chuyền sản xuất hiện đại' },
    { id: 'p2', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop', subCategory: 'Văn phòng', name: 'Góc làm việc công nghệ' },
    { id: 'p3', url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=600&auto=format&fit=crop', subCategory: 'Thiết bị', name: 'Hệ thống đo lường KCS' }
  ],
  cinematic: [
    { id: 'c1', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop', subCategory: 'Phim retro', name: 'Thước phim cổ điển' },
    { id: 'c2', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop', subCategory: 'Ánh đèn Neon', name: 'Đường phố Tokyo rực rỡ' },
    { id: 'c3', url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop', subCategory: 'Khung cảnh', name: 'Cầu cảng lãng mạn hoàng hôn' }
  ],
  ai: [
    { id: 'a1', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop', subCategory: 'Robots', name: 'Robot thông minh trợ lý' },
    { id: 'a2', url: 'https://images.unsplash.com/photo-1601987177651-8edfe6c20009?q=80&w=600&auto=format&fit=crop', subCategory: 'Bảng mạch', name: 'Bảng mạch silicon xanh lá' },
    { id: 'a3', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop', subCategory: 'Không gian số', name: 'Vũ trụ ma trận số hóa' }
  ],
  physiognomy: [
    { id: 'ph1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop', subCategory: 'Thần thái', name: 'Góc nghiêng nhân dung' },
    { id: 'ph2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop', subCategory: 'Ngũ đình', name: 'Chân dung hội tụ ánh sáng' },
    { id: 'ph3', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop', subCategory: 'Tướng học', name: 'Thần khí tĩnh tại sắc nét' }
  ]
};

export const PhotoSelector: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [personalPhotos, setPersonalPhotos] = useState<string[]>(() => {
    const saved = localStorage.getItem('memories_photo_list');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [activeBlock, setActiveBlock] = useState<string>('nature');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('Tất cả');
  const [selectedSceneryIds, setSelectedSceneryIds] = useState<string[]>([]);

  // Resolve db:// URLs to active browser blob URLs
  useEffect(() => {
    let active = true;
    const resolveAll = async () => {
      const missingUrls = personalPhotos.filter(url => url.startsWith('db://') && !resolvedUrls[url]);
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
  }, [personalPhotos]);

  // File Upload Handlers (Object URLs + IndexedDB to prevent localStorage Quota Overflow)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPhotoKeys: string[] = [];
      const newResolvedMap: Record<string, string> = { ...resolvedUrls };

      for (const file of filesArray) {
        // Create an instant session blob URL for instant previewing
        const tempBlobUrl = URL.createObjectURL(file);
        
        // Register in IndexedDB to get the persistent db:// URL
        const dbUrl = await registerLocalFile(file, 'photo');
        
        newPhotoKeys.push(dbUrl);
        newResolvedMap[dbUrl] = tempBlobUrl;
      }

      setResolvedUrls(newResolvedMap);
      setPersonalPhotos(prev => [...prev, ...newPhotoKeys]);
    }
  };

  const removePersonalPhoto = (index: number) => {
    setPersonalPhotos(prev => {
      const target = prev[index];
      // Revoke temporary blob url if it exists in our resolved map
      const resolved = resolvedUrls[target];
      if (resolved && resolved.startsWith('blob:')) {
        URL.revokeObjectURL(resolved);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleSelectScenery = (id: string) => {
    setSelectedSceneryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Get active templates filtered by subcategory
  const currentTemplates = SCENERY_TEMPLATES[activeBlock] || [];
  const subCategories = ['Tất cả', ...Array.from(new Set(currentTemplates.map(t => t.subCategory)))];
  const filteredTemplates = activeSubCategory === 'Tất cả' 
    ? currentTemplates 
    : currentTemplates.filter(t => t.subCategory === activeSubCategory);

  const handleNextStep = () => {
    if (personalPhotos.length === 0) return;

    // Save personal photos array
    localStorage.setItem('memories_photo_list', JSON.stringify(personalPhotos));
    
    // Save selected backgrounds. If none chosen, use empty array (will fallback to white pages)
    const allSceneryList = Object.values(SCENERY_TEMPLATES).flat();
    const selectedBackgrounds = allSceneryList
      .filter(item => selectedSceneryIds.includes(item.id))
      .map(item => item.url);
    localStorage.setItem('memories_background_list', JSON.stringify(selectedBackgrounds));

    // Initialize Default Notes
    const defaultNotes = personalPhotos.map((_, idx) => {
      if (idx === 0) return "Khởi đầu chương ký ức rạng rỡ của tôi";
      if (idx === 1) return "Khoảnh khắc ngọt ngào bên những người thương yêu";
      if (idx === 2) return "Nụ cười tỏa nắng lưu lại mãi thời gian";
      return `Chương ký ức thứ ${idx + 1} của chúng ta.`;
    });
    localStorage.setItem('memories_photo_notes', JSON.stringify(defaultNotes));

    // Reset default text colors (white)
    const defaultColors = personalPhotos.map(() => '#ffffff');
    localStorage.setItem('memories_photo_colors', JSON.stringify(defaultColors));

    // Reset coordinates to center
    const defaultPositions = personalPhotos.map(() => ({ x: 50, y: 70 }));
    localStorage.setItem('memories_photo_positions', JSON.stringify(defaultPositions));

    navigate('/processing');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h2 className="font-headline text-2xl font-bold text-primary">Tạo Album Mới</h2>
        <p className="text-xs text-on-surface-variant font-body">Ghép những bức ảnh cá nhân của anh vào bối cảnh đẹp nghệ thuật để tạo video sách 3D độc quyền.</p>
      </div>

      {/* SECTION 1: PERSONAL PHOTO UPLOADER */}
      <div className="tactile-paper p-5 rounded-3xl border border-outline/10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              1. Tải ảnh cá nhân từ máy tính
            </h3>
            <p className="text-[10px] text-on-surface-variant">Chọn nhiều ảnh cùng lúc, xử lý Blob bộ nhớ đệm siêu mượt</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Tải ảnh lên
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Uploaded Photos Preview List */}
        {personalPhotos.length === 0 ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-outline/20 hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-surface-container-low"
          >
            <ImageIcon className="h-8 w-8 text-outline/50" />
            <span className="text-xs font-semibold text-outline">Chưa có ảnh nào được chọn. Click để tải ảnh...</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto pr-1">
            {personalPhotos.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-outline/10 group shadow-sm">
                <img src={url.startsWith('db://') ? (resolvedUrls[url] || '') : url} alt="Personal upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePersonalPhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-600 text-white shadow transition-all scale-90 active:scale-75"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase">
                  Trang {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BENTO CATEGORY BLOCKS (BACKGROUND SCENERIES) */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            2. Thư viện bối cảnh nghệ thuật (Mỹ thuật nền)
          </h3>
          <p className="text-[10px] text-on-surface-variant">Click chọn các bối cảnh đẹp (Capcut/Viral style) để lồng ghép ảnh cá nhân</p>
        </div>

        {/* 5 Bento Theme Cards */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'nature', label: 'Thiên Nhiên', icon: Leaf, desc: 'Rừng, Biển, Núi' },
            { id: 'production', label: 'Sản Xuất', icon: Factory, desc: 'Nhà xưởng, KCS' },
            { id: 'cinematic', label: 'Điện Ảnh', icon: Tv, desc: 'Neon, Phim nhựa' },
            { id: 'ai', label: 'AI & Tech', icon: Cpu, desc: 'Robot, Silicon' },
            { id: 'physiognomy', label: 'Tướng Học', icon: Eye, desc: 'Cố vấn nhân tướng' }
          ].map(block => {
            const Icon = block.icon;
            const isActive = activeBlock === block.id;
            return (
              <button
                key={block.id}
                onClick={() => {
                  setActiveBlock(block.id);
                  setActiveSubCategory('Tất cả');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${
                  isActive 
                    ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                    : 'border-outline/10 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <Icon className={`h-4 h-4 ${isActive ? 'scale-110 text-primary' : ''} transition-transform`} />
                <span className="text-[9px] font-bold uppercase tracking-tight block truncate w-full">{block.label}</span>
                <span className="text-[7px] text-outline block line-clamp-1">{block.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-tabs Slider */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subCategories.map(subCat => (
            <button
              key={subCat}
              onClick={() => setActiveSubCategory(subCat)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 transition-all ${
                activeSubCategory === subCat
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {subCat}
            </button>
          ))}
        </div>

        {/* Curated Sceneries Grid */}
        <div className="grid grid-cols-3 gap-3">
          {filteredTemplates.map(scenery => {
            const isSelected = selectedSceneryIds.includes(scenery.id);
            return (
              <button
                key={scenery.id}
                onClick={() => toggleSelectScenery(scenery.id)}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all group ${
                  isSelected ? 'border-primary scale-[0.98] shadow-md' : 'border-outline/10 hover:border-primary/50'
                }`}
              >
                <img 
                  src={scenery.url} 
                  alt={scenery.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Title overlay bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                  <span className="text-[7px] font-bold text-primary uppercase tracking-widest">{scenery.subCategory}</span>
                  <p className="text-[9px] font-semibold text-white truncate">{scenery.name}</p>
                </div>

                {/* Checkmark circle */}
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected 
                    ? 'bg-primary border-primary text-on-primary scale-100 shadow-md' 
                    : 'bg-black/25 border-white/50 text-transparent scale-90'
                }`}>
                  <Check className="h-3 w-3" />
                </div>

                {isSelected && <div className="absolute inset-0 bg-primary/10 pointer-events-none"></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER FLOATING ACTION BAR */}
      <div className="rounded-2xl bg-surface-container border border-outline/10 p-4 flex justify-between items-center shadow-lg">
        <div className="space-y-0.5">
          <span className="text-[8px] font-bold text-primary uppercase tracking-widest block">Trạng thái cấu hình</span>
          <h4 className="text-xs font-bold text-on-surface">
            {personalPhotos.length} Ảnh cá nhân × {selectedSceneryIds.length} Bối cảnh
          </h4>
        </div>

        <button
          onClick={handleNextStep}
          disabled={personalPhotos.length === 0}
          className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Tiếp tục dệt nhạc & chữ</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
