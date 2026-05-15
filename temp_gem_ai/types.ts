
export type TileSize = '300x600' | '600x600' | '800x800' | '500x500' | '100x600' | '150x800';

export interface Tile {
  id: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  material: string;
  category: 'Ốp tường' | 'Lót sàn' | 'Trang trí' | 'Viền';
  imageUrl: string;
  menh: Menh[];
}

export interface Paint {
  id: string;
  name: string;
  hex: string;
  code: string;
}

export type Menh = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';

export interface CalculationResult {
  totalBoxes: number;
  totalArea: number;
  wasteAmount: number;
  paintLiters: number;
}

export interface SavedPlan {
  id: string;
  name: string;
  timestamp: number;
  area: number;
  selectedTiles: Tile[];
  results: CalculationResult;
  fengShuiNote: string;
  visualizedImage?: string;
  materials?: MaterialSelection;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; 
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export interface MaterialSelection {
  floor?: Tile;
  wallMain?: Tile;    // Gạch thân
  wallBottom?: Tile;  // Gạch chân
  wallBorder?: Tile;  // Gạch viền
  paint?: Paint;      // Sơn nước phía trên
}
