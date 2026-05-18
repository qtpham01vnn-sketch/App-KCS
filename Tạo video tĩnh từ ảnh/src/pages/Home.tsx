import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/db';
import { 
  Search, 
  Sparkles, 
  Users, 
  ArrowRight, 
  Clock, 
  Layers, 
  Music, 
  ChevronRight,
  Heart
} from 'lucide-react';

interface Album {
  id: string;
  title: string;
  category: string;
  photosCount: number;
  timeAgo: string;
  imgUrl: string;
  description: string;
  featured?: boolean;
}

const ALBUM_DATA: Album[] = [
  {
    id: 'august-amalfi',
    title: 'August in Amalfi',
    category: 'Storytelling',
    photosCount: 24,
    timeAgo: 'Mới nhất',
    imgUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop',
    description: 'Chuyến phiêu lưu mùa hè lãng mạn tại bờ biển nước Ý rực nắng.',
    featured: true
  },
  {
    id: 'parisian-mornings',
    title: 'Parisian Mornings',
    category: 'Classic',
    photosCount: 12,
    timeAgo: '2 ngày trước',
    imgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop',
    description: 'Bàn cà phê sáng thư thái và góc phố ngập sắc xuân.'
  },
  {
    id: 'deep-redwoods',
    title: 'Deep in the Redwoods',
    category: 'Storytelling',
    photosCount: 45,
    timeAgo: 'Tháng 10, 2023',
    imgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    description: 'Hành trình tĩnh lặng xuyên qua những rặng thông cổ thụ kỳ vĩ.'
  },
  {
    id: 'modern-forms',
    title: 'Modern Forms',
    category: '3D Flip',
    photosCount: 18,
    timeAgo: 'Tháng 9, 2023',
    imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
    description: 'Các góc cạnh kiến trúc trắng tối giản tương phản bầu trời xanh.'
  },
  {
    id: 'winter-solstice',
    title: 'Winter Solstice',
    category: 'Classic',
    photosCount: 32,
    timeAgo: 'Tháng 12, 2023',
    imgUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=600&auto=format&fit=crop',
    description: 'Căn nhà gỗ nhỏ sưởi ấm giữa núi tuyết chập chùng lúc hoàng hôn.'
  }
];

export const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [createdAlbums, setCreatedAlbums] = useState<Album[]>([]);
  const [tilts, setTilts] = useState<number[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadAlbums = async () => {
      const saved = localStorage.getItem('memories_created_albums');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const resolved = await Promise.all(parsed.map(async (album: any) => {
            if (album.imgUrl && album.imgUrl.startsWith('db://')) {
              try {
                const resolvedUrl = await resolveMediaUrl(album.imgUrl);
                return { ...album, imgUrl: resolvedUrl };
              } catch (e) {
                console.warn("Failed to resolve album thumbnail:", e);
              }
            }
            return album;
          }));
          setCreatedAlbums(resolved);
        } catch (e) {
          console.warn(e);
        }
      }
    };
    loadAlbums();
  }, []);

  const allAlbums = [...createdAlbums, ...ALBUM_DATA];

  // Generate stable random tilt angles when allAlbums length changes
  useEffect(() => {
    const randomTilts = allAlbums.map(() => (Math.random() * 3 - 1.5));
    setTilts(randomTilts);
  }, [createdAlbums.length]);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAlbums = allAlbums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          album.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || album.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredAlbum = allAlbums.find(a => a.featured);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding walkthrough invite banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary-container/20 to-surface-container border border-primary/20 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full filter blur-xl"></div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary tracking-widest uppercase">Trải nghiệm mới</span>
          <h3 className="font-headline text-lg font-bold text-primary mt-1.5">Tạo Video Kỷ Niệm AI Chỉ Trong 4 Bước</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Khám phá cách AI tự động ghép nhạc cảm xúc và hoạt ảnh 3D lật trang.</p>
        </div>
        <Link 
          to="/onboarding"
          className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
        >
          <span>Khám phá ngay</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Search Input Section */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline h-5 w-5" />
        <input 
          type="text" 
          placeholder="Tìm lại những mảnh ký ức ngọt ngào..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container-low border-b border-outline/30 focus:border-primary focus:bg-surface-container pl-12 pr-4 py-3.5 rounded-xl font-body text-sm text-on-surface outline-none transition-all"
        />
      </div>

      {/* Category Horizontal Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['All', 'Classic', '3D Flip', 'Storytelling'].map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
              activeCategory === category 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Bento Grid Feature Area */}
      {featuredAlbum && activeCategory === 'All' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight text-primary">Dành Cho Bạn</h2>
              <p className="text-xs text-on-surface-variant">AI tự động biên tập góc hoàng hôn rực nắng</p>
            </div>
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Tuyển tập hôm nay
            </span>
          </div>

          <Link 
            to={`/album/${featuredAlbum.id}`}
            className="block group relative rounded-3xl overflow-hidden aspect-[4/5] md:aspect-video tactile-paper border border-outline/10 p-0"
          >
            <img 
              alt={featuredAlbum.title} 
              src={featuredAlbum.imgUrl} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Elegant vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Kỷ niệm nổi bật</span>
                  <h3 className="font-headline text-2xl md:text-3xl font-bold mt-1 text-white">{featuredAlbum.title}</h3>
                  <p className="text-xs text-white/80 font-body max-w-md mt-1.5 leading-relaxed">{featuredAlbum.description}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                  <span className="material-symbols-outlined text-xs" data-icon="auto_awesome">auto_awesome</span>
                  <span>Mở Album 3D</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Main Feed Grid with Analog Page Tilts */}
      <div className="space-y-6">
        <div>
          <h2 className="font-headline text-xl font-bold tracking-tight text-primary">Ký ức gần đây</h2>
          <p className="text-xs text-on-surface-variant font-body">Mảnh ghép cuộc sống được lưu trữ tỉ mỉ.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredAlbums.filter(a => !a.featured || activeCategory !== 'All').map((album, idx) => {
            const tilt = tilts[idx] || 0;
            const isLiked = likes[album.id] || false;
            
            return (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                style={{ transform: `rotate(${tilt}deg)` }}
                className="group flex flex-col gap-3 tactile-paper photo-mount-classic transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Polaroid-style Mount */}
                <div className="aspect-square w-full bg-surface-container overflow-hidden rounded-md relative shadow-inner">
                  <img 
                    alt={album.title} 
                    src={album.imgUrl} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Category label indicator */}
                  <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-outline/10 text-[9px] font-bold uppercase tracking-wider text-primary">
                    {album.category}
                  </div>

                  {/* Heart like interaction */}
                  <button 
                    onClick={(e) => handleLike(album.id, e)}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center border border-outline/10 text-on-surface-variant transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-on-surface-variant'}`} />
                  </button>
                </div>

                {/* Polaroid Text margin */}
                <div className="px-1 pt-1">
                  <h4 className="font-headline text-lg font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{album.title}</h4>
                  <p className="text-xs text-on-surface-variant font-body line-clamp-2 mt-1 leading-relaxed">{album.description}</p>
                  
                  <div className="flex items-center justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-outline border-t border-outline/5 pt-2">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {album.timeAgo}</span>
                    <span>{album.photosCount} bức ảnh</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredAlbums.length === 0 && (
          <div className="text-center py-12 bg-surface-container-low rounded-2xl border border-dashed border-outline/20">
            <p className="text-sm font-semibold text-on-surface-variant">Không tìm thấy album kỷ niệm phù hợp</p>
            <p className="text-xs text-outline mt-1">Hãy thử tìm từ khoá khác hoặc lọc danh mục khác.</p>
          </div>
        )}
      </div>

      {/* Floating Collaborative invitation Banner */}
      <div className="rounded-2xl bg-surface-container border border-outline/15 p-5 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-bold text-on-surface">Lời mời từ Hoàng Nam</h4>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Đồng tác giả</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">"Hãy cùng đóng góp ảnh vào cuốn album kỷ niệm chung của nhóm chúng ta tại Amalfi nhé!"</p>
          <div className="pt-2 flex gap-2">
            <Link 
              to="/collaborate"
              className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Xem lời mời
            </Link>
            <button className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs font-semibold rounded-full transition-all">
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
