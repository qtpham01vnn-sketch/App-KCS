
import { Tile, TileSize, Menh, Paint } from './types';

export const TILE_SPECS: Record<string, number> = {
  '300x600': 1.44,
  '600x600': 1.44, 
  '800x800': 1.92, 
  '500x500': 1.5,
  '100x600': 0.6,
  '150x800': 1.2,
};

export const WASTE_FACTOR = 1.05;
export const PAINT_COVERAGE = 5;

export const MOCK_PAINTS: Paint[] = [
  { id: 'P001', name: 'Trắng Sứ Phương Nam', hex: '#F2F3F4', code: 'PNC-W01' },
  { id: 'P002', name: 'Xám Ghi Hiện Đại', hex: '#8E9196', code: 'PNC-G02' },
  { id: 'P003', name: 'Vàng Kem Hoàng Gia', hex: '#FDF4E3', code: 'PNC-C03' },
  { id: 'P004', name: 'Xanh Mint Dịu Mát', hex: '#E0F2F1', code: 'PNC-M04' },
  { id: 'P005', name: 'Hồng Phấn Lãng Mạn', hex: '#FCE4EC', code: 'PNC-P05' },
  { id: 'P006', name: 'Xanh Navy Đẳng Cấp', hex: '#1A237E', code: 'PNC-N06' },
  { id: 'P007', name: 'Xanh Rêu Tĩnh Lặng', hex: '#4E5B4F', code: 'PNC-G07' },
  { id: 'P008', name: 'Cam Đất Ấm Áp', hex: '#D2691E', code: 'PNC-O08' },
];

export const MOCK_TILES: Tile[] = [
  // GẠCH SÀN
  { id: 'PNC-S801', brand: 'Phương Nam', name: 'Gạch Sàn 80×80 Vàng Kem Vân Đá', size: '800x800', color: 'Vàng Kem', material: 'Bóng Kiếng', category: 'Lót sàn', imageUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=800&q=80', menh: ['Thổ'] },
  { id: 'PNC-S802', brand: 'Phương Nam', name: 'Gạch Sàn 80×80 Trắng Vân Khói Mara', size: '800x800', color: 'Trắng', material: 'Bóng Kiếng', category: 'Lót sàn', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', menh: ['Kim'] },
  { id: 'PNC-S603', brand: 'Phương Nam', name: 'Gạch Sàn 60x60 Xám Xi Măng Industry', size: '600x600', color: 'Xám', material: 'Mờ', category: 'Lót sàn', imageUrl: 'https://images.unsplash.com/photo-1590333746437-142f9b87a8b6?auto=format&fit=crop&w=800&q=80', menh: ['Kim'] },
  
  // GẠCH CHÂN TƯỜNG (Thường dùng loại màu đậm)
  { id: 'PNC-C364', brand: 'Phương Nam', name: 'Gạch Chân 30x60 Đen Vân Đá Marble', size: '300x600', color: 'Đen', material: 'Bóng', category: 'Ốp tường', imageUrl: 'https://images.unsplash.com/photo-1504148455328-497c5ef215d0?auto=format&fit=crop&w=800&q=80', menh: ['Thủy'] },
  { id: 'PNC-C365', brand: 'Phương Nam', name: 'Gạch Chân 30x60 Nâu Gỗ Đậm', size: '300x600', color: 'Nâu', material: 'Mờ', category: 'Ốp tường', imageUrl: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=800&q=80', menh: ['Mộc'] },

  // GẠCH THÂN (Thường dùng loại màu sáng)
  { id: 'PNC-T366', brand: 'Phương Nam', name: 'Gạch Thân 30x60 Trắng Vân Mây', size: '300x600', color: 'Trắng', material: 'Bóng', category: 'Ốp tường', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', menh: ['Kim'] },
  { id: 'PNC-T367', brand: 'Phương Nam', name: 'Gạch Thân 30x60 Vàng Kem Nhạt', size: '300x600', color: 'Vàng', material: 'Bóng', category: 'Ốp tường', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80', menh: ['Thổ'] },

  // GẠCH VIỀN
  { id: 'PNC-V101', brand: 'Phương Nam', name: 'Viền 10x60 Hoa Văn Á Đông', size: '100x600', color: 'Đa sắc', material: 'Men', category: 'Viền', imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80', menh: ['Thổ'] },
  { id: 'PNC-V102', brand: 'Phương Nam', name: 'Viền 10x60 Kim Loại Vàng Gold', size: '100x600', color: 'Vàng', material: 'Kim loại', category: 'Viền', imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80', menh: ['Kim'] },
  { id: 'PNC-V103', brand: 'Phương Nam', name: 'Viền 10x60 Ceramic Xanh Ngọc', size: '100x600', color: 'Xanh', material: 'Men', category: 'Viền', imageUrl: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=800&q=80', menh: ['Thủy'] },
];
