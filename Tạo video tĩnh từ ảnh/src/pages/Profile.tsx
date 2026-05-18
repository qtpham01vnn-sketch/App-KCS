import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/db';
import { 
  FolderHeart, 
  Image as ImageIcon, 
  Users, 
  MapPin, 
  Calendar, 
  Settings, 
  Bookmark 
} from 'lucide-react';

const SAVED_ALBUMS = [
  {
    id: 'august-amalfi',
    title: 'August in Amalfi',
    imgUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=300&auto=format&fit=crop',
    photos: 24,
    date: 'Tháng 8, 2026'
  },
  {
    id: 'parisian-mornings',
    title: 'Parisian Mornings',
    imgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=300&auto=format&fit=crop',
    photos: 12,
    date: 'Tháng 5, 2026'
  },
  {
    id: 'deep-redwoods',
    title: 'Deep in the Redwoods',
    imgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop',
    photos: 45,
    date: 'Tháng 10, 2025'
  }
];

export const Profile: React.FC = () => {
  const [createdAlbums, setCreatedAlbums] = useState<any[]>([]);

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

  const allSavedAlbums = [
    ...createdAlbums.map(a => ({
      id: a.id,
      title: a.title,
      imgUrl: a.imgUrl,
      photos: a.photosCount,
      date: 'Vừa tạo'
    })),
    ...SAVED_ALBUMS
  ];
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Profile Header Banner */}
      <div className="tactile-paper rounded-3xl border border-outline/10 p-6 flex flex-col sm:flex-row gap-5 items-center">
        {/* Avatar with tilt border */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-lg scale-105 flex-shrink-0">
          <img 
            alt="Profile Avatar" 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bio details */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Hoàng Nam</h2>
            <span className="self-center px-2 py-0.5 rounded bg-primary/15 text-[9px] font-bold text-primary uppercase tracking-widest">Biên tập viên</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body leading-relaxed max-w-md">
            "Kẻ chép sử những mảnh ký ức ngọt ngào qua thấu kính nhỏ. Mãi say đắm sắc nắng Positano và hương thơm cà phê Paris sáng thu."
          </p>
          <div className="flex justify-center sm:justify-start items-center gap-3 text-[10px] text-outline font-semibold">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Positano, Italy</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Thành viên từ 2024</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats Card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline/10 p-4 rounded-2xl text-center space-y-1">
          <FolderHeart className="h-5 w-5 text-primary mx-auto" />
          <span className="text-xl font-headline font-bold block text-on-surface">5</span>
          <span className="text-[9px] font-bold text-outline uppercase tracking-wider block">Album</span>
        </div>

        <div className="bg-surface-container-low border border-outline/10 p-4 rounded-2xl text-center space-y-1">
          <ImageIcon className="h-5 w-5 text-primary mx-auto" />
          <span className="text-xl font-headline font-bold block text-on-surface">129</span>
          <span className="text-[9px] font-bold text-outline uppercase tracking-wider block">Bức ảnh</span>
        </div>

        <div className="bg-surface-container-low border border-outline/10 p-4 rounded-2xl text-center space-y-1">
          <Users className="h-5 w-5 text-primary mx-auto" />
          <span className="text-xl font-headline font-bold block text-on-surface">4</span>
          <span className="text-[9px] font-bold text-outline uppercase tracking-wider block">Cộng sự</span>
        </div>
      </div>

      {/* Album collection grid */}
      <div className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-primary flex items-center gap-1.5">
          <Bookmark className="h-5 w-5 text-primary fill-primary/10" />
          Album đã lưu trữ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allSavedAlbums.map(album => (
            <Link 
              key={album.id}
              to={`/album/${album.id}`}
              className="group rounded-2xl overflow-hidden bg-surface-container border border-outline/10 shadow-sm flex flex-col hover:scale-[1.02] active:scale-98 transition-all"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-surface-container-high border-b border-outline/5">
                <img 
                  src={album.imgUrl} 
                  alt={album.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3 space-y-1">
                <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">{album.title}</h4>
                <div className="flex justify-between items-center text-[9px] font-bold text-outline uppercase tracking-wider pt-1">
                  <span>{album.photos} ảnh</span>
                  <span>{album.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};
