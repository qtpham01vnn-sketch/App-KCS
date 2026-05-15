
import React, { useState } from 'react';
import { TILE_SPECS, WASTE_FACTOR, PAINT_COVERAGE } from '../constants';
import { TileSize, MaterialSelection } from '../types';

interface CalculatorProps {
  onCalculate: (area: number, size: string) => void;
  selection: MaterialSelection;
  onRemoveMaterial: (type: keyof MaterialSelection) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onCalculate, selection, onRemoveMaterial }) => {
  const [area, setArea] = useState<number>(50);
  const [selectedSize, setSelectedSize] = useState<string>('600x600');

  const handleCalculate = () => {
    onCalculate(area, selectedSize);
  };

  const getBoxes = () => {
    const spec = TILE_SPECS[selectedSize] || 1.44;
    return Math.ceil(((area || 0) / spec) * WASTE_FACTOR);
  };

  const getPaint = () => {
    return Math.ceil((area || 0) / PAINT_COVERAGE);
  };

  const SelectionItem = ({ label, item, type, colorClass }: { label: string, item: any, type: keyof MaterialSelection, colorClass: string }) => (
    <div className={`p-3 rounded-2xl border transition-all ${item ? `${colorClass}/20 border-${colorClass.split('-')[1]}-500/50` : 'bg-white/5 border-dashed border-white/10'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-black uppercase text-gray-400">{label}</span>
        {item && <button onClick={() => onRemoveMaterial(type)} className="text-red-400 text-[10px]"><i className="fas fa-times-circle"></i></button>}
      </div>
      {item ? (
        <div className="flex items-center gap-3">
          {item.imageUrl ? <img src={item.imageUrl} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg" style={{backgroundColor: item.hex}}></div>}
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
            <p className="text-[8px] text-blue-300 font-bold uppercase">{item.size || item.code}</p>
          </div>
        </div>
      ) : <p className="text-[9px] text-gray-500 italic">Chưa chọn</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl shadow-xl space-y-4 border border-white/10">
        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-calculator"></i> Tính vật tư dự tính
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-center">
            <p className="text-[9px] font-black text-blue-300 uppercase">Gạch (Thùng)</p>
            <p className="text-2xl font-black text-white">{getBoxes()}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-[9px] font-black text-emerald-300 uppercase">Sơn (Lít)</p>
            <p className="text-2xl font-black text-white">{getPaint()}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] mb-1 font-bold text-gray-400 uppercase">Diện tích sàn (m²)</label>
            <input type="number" value={area || ''} onChange={(e) => setArea(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={handleCalculate} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Lưu thông số</button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 shadow-2xl">
        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">Cấu trúc vật liệu</h3>
        <div className="space-y-2">
          <SelectionItem label="Gạch lót sàn" item={selection.floor} type="floor" colorClass="bg-blue-600" />
          <SelectionItem label="Gạch chân tường" item={selection.wallBottom} type="wallBottom" colorClass="bg-indigo-600" />
          <SelectionItem label="Gạch thân tường" item={selection.wallMain} type="wallMain" colorClass="bg-purple-600" />
          <SelectionItem label="Gạch viền điểm" item={selection.wallBorder} type="wallBorder" colorClass="bg-orange-600" />
          <SelectionItem label="Sơn nước trên" item={selection.paint} type="paint" colorClass="bg-emerald-600" />
        </div>
      </div>
    </div>
  );
};
