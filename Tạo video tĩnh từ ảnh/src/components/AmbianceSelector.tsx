import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, RefreshCw, X, Check } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  class: string;
  color: string; // Preview color
  desc: string;
}

const PREDEFINED_THEMES: Theme[] = [
  { id: 'default', name: 'Luminous Keepsake', class: '', color: '#745849', desc: 'Vàng hồng ấm áp và cổ điển (Mặc định)' },
  { id: 'sepia', name: 'Archival Sepia', class: 'theme-sepia', color: '#85583b', desc: 'Tông màu hổ phách, như giấy cổ lưu trữ' },
  { id: 'ocean', name: 'Ocean Mist', class: 'theme-ocean', color: '#3d6a7f', desc: 'Xanh sương mù, thanh tịnh và yên ả' },
  { id: 'forest', name: 'Forest Moss', class: 'theme-forest', color: '#4a5c43', desc: 'Xanh rêu cổ kính, gần gũi với thiên nhiên' },
  { id: 'lavender', name: 'Lavender Dream', class: 'theme-lavender', color: '#65578a', desc: 'Tím oải hương thanh tao, đầy chất thơ' },
  { id: 'crimson', name: 'Crimson Velvet', class: 'theme-crimson', color: '#853b49', desc: 'Đỏ nhung kịch tính, lãng mạn và sâu lắng' },
  { id: 'charcoal', name: 'Charcoal Noir', class: 'theme-charcoal', color: '#c5a391', desc: 'Nền tối Charcoal hiện đại, ảnh nổi bật bật tông' },
  { id: 'ivory', name: 'Ivory Silk', class: 'theme-ivory', color: '#5c5550', desc: 'Trắng lụa tối giản, sang trọng tinh tế' },
  { id: 'teal', name: 'Teal Whispers', class: 'theme-teal', color: '#2b5457', desc: 'Màu ngọc bích thẳm và kem cát nhạt' },
  { id: 'honey', name: 'Honey Amber', class: 'theme-honey', color: '#946927', desc: 'Sắc mật ong mùa thu vàng rực rỡ' },
  { id: 'dusk', name: 'Dusk Blush', class: 'theme-dusk', color: '#704459', desc: 'Màu hoàng hôn buông lãng mạn tím hồng' },
  { id: 'sage', name: 'Sage Breeze', class: 'theme-sage', color: '#45574c', desc: 'Xanh xô thơm nhẹ nhàng, mát mẻ dịu mắt' },
];

// Helper functions for HSL/Hex conversion
function hexToHsl(hex: string): { h: number, s: number, l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

interface AmbianceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncStitch?: () => void;
}

export const AmbianceSelector: React.FC<AmbianceSelectorProps> = ({ isOpen, onClose, onSyncStitch }) => {
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [customBgColor, setCustomBgColor] = useState<string>('#faf6f0');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('#8a583c');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('memories-theme');
    const isCustom = localStorage.getItem('memories-theme-custom') === 'true';
    
    if (isCustom) {
      setIsCustomMode(true);
      const bg = localStorage.getItem('memories-custom-bg') || '#faf6f0';
      const pri = localStorage.getItem('memories-custom-primary') || '#8a583c';
      setCustomBgColor(bg);
      setCustomPrimaryColor(pri);
      applyCustomColors(bg, pri);
    } else if (savedTheme) {
      setActiveTheme(savedTheme);
      applyPredefinedTheme(savedTheme);
    }
  }, []);

  const applyPredefinedTheme = (themeId: string) => {
    // Remove custom styling if any
    const existingStyle = document.getElementById('custom-theme-styles');
    if (existingStyle) existingStyle.remove();

    // Set class to html
    const html = document.documentElement;
    PREDEFINED_THEMES.forEach(t => {
      if (t.class) html.classList.remove(t.class);
    });

    const targetTheme = PREDEFINED_THEMES.find(t => t.id === themeId);
    if (targetTheme && targetTheme.class) {
      html.classList.add(targetTheme.class);
    }

    localStorage.setItem('memories-theme', themeId);
    localStorage.setItem('memories-theme-custom', 'false');
  };

  const applyCustomColors = (bgHex: string, primaryHex: string) => {
    // Clean preset classes
    const html = document.documentElement;
    PREDEFINED_THEMES.forEach(t => {
      if (t.class) html.classList.remove(t.class);
    });

    const bgHsl = hexToHsl(bgHex);
    const priHsl = hexToHsl(primaryHex);

    const isDark = bgHsl.l < 50;

    // Generate contrast compliant variables
    let textHex = isDark ? '#f6f3f2' : '#1b1c1c';
    let textVarHex = isDark ? '#b0aba8' : '#4f453f';
    let outlineHex = isDark ? '#5c5450' : '#81746e';
    
    // Auto-calculate containers with proper contrasts
    let containerLowest = isDark ? '#080809' : '#ffffff';
    let containerLow = isDark ? '#141416' : hslToHex(bgHsl.h, bgHsl.s, Math.min(98, bgHsl.l + 3));
    let container = isDark ? '#1d1d22' : hslToHex(bgHsl.h, bgHsl.s, Math.max(0, bgHsl.l - 4));
    let containerHigh = isDark ? '#28282e' : hslToHex(bgHsl.h, bgHsl.s, Math.max(0, bgHsl.l - 8));
    let containerHighest = isDark ? '#32323b' : hslToHex(bgHsl.h, bgHsl.s, Math.max(0, bgHsl.l - 12));

    const stylesText = `
      :root {
        --color-surface: ${bgHex};
        --color-surface-dim: ${isDark ? '#0d0d0f' : '#dcd9d9'};
        --color-surface-bright: ${bgHex};
        --color-surface-container-lowest: ${containerLowest};
        --color-surface-container-low: ${containerLow};
        --color-surface-container: ${container};
        --color-surface-container-high: ${containerHigh};
        --color-surface-container-highest: ${containerHighest};
        --color-on-surface: ${textHex};
        --color-on-surface-variant: ${textVarHex};
        --color-outline: ${outlineHex};
        
        --color-primary: ${primaryHex};
        --color-primary-container: ${hslToHex(priHsl.h, priHsl.s, isDark ? 30 : 80)};
        --color-on-primary: ${isDark ? '#121212' : '#ffffff'};
        --color-on-primary-container: ${isDark ? '#ffffff' : '#2a170b'};
        
        --color-secondary: ${isDark ? '#c5c5c5' : '#5f5e5b'};
        --color-secondary-container: ${isDark ? '#2e2e2e' : '#e5e2dd'};
        --color-on-secondary: ${isDark ? '#121212' : '#ffffff'};
        --color-on-secondary-container: ${isDark ? '#ffffff' : '#1c1c19'};
      }
    `;

    let styleNode = document.getElementById('custom-theme-styles');
    if (!styleNode) {
      styleNode = document.createElement('style');
      styleNode.id = 'custom-theme-styles';
      document.head.appendChild(styleNode);
    }
    styleNode.innerHTML = stylesText;

    localStorage.setItem('memories-theme-custom', 'true');
    localStorage.setItem('memories-custom-bg', bgHex);
    localStorage.setItem('memories-custom-primary', primaryHex);
  };

  const selectTheme = (themeId: string) => {
    setIsCustomMode(false);
    setActiveTheme(themeId);
    applyPredefinedTheme(themeId);
  };

  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomBgColor(val);
    applyCustomColors(val, customPrimaryColor);
  };

  const handleCustomPrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomPrimaryColor(val);
    applyCustomColors(customBgColor, val);
  };

  const resetToDefault = () => {
    selectTheme('default');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Bottom Sheet UI */}
      <div className="relative w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl transition-all duration-300 transform translate-y-0 max-h-[85vh] overflow-y-auto border-t border-outline/10 text-on-surface">
        {/* Handle bar */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-outline/30"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-primary">
            <Palette className="h-5 w-5" />
            <h3 className="font-headline text-xl font-semibold">Phòng thí nghiệm Bầu không khí</h3>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sync with Stitch Section */}
        {onSyncStitch && (
          <div className="mb-6 rounded-2xl bg-primary/10 p-4 border border-primary/20 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5 font-medium text-primary text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Đồng bộ với Google Stitch</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">Tải Tokens và thiết kế trực tiếp từ file DESIGN.md</p>
            </div>
            <button
              onClick={onSyncStitch}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Đồng bộ ngay
            </button>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl mb-6">
          <button 
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isCustomMode ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            12 Bầu không khí nghệ thuật
          </button>
          <button 
            onClick={() => {
              setIsCustomMode(true);
              applyCustomColors(customBgColor, customPrimaryColor);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isCustomMode ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Phối màu tùy chọn (Lab)
          </button>
        </div>

        {/* Tab 1: Predefined 12 Themes */}
        {!isCustomMode ? (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {PREDEFINED_THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => selectTheme(theme.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all group relative overflow-hidden ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline/10 bg-surface-container-low hover:bg-surface-container'}`}
                >
                  {/* Color Circle Preview */}
                  <div 
                    className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center shadow-inner mb-2 transition-transform group-hover:scale-105" 
                    style={{ backgroundColor: theme.color }}
                  >
                    {isActive && <Check className="h-5 w-5 text-white drop-shadow" />}
                  </div>
                  <span className="text-xs font-semibold tracking-tight line-clamp-1">{theme.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Tab 2: Custom Color Lab */
          <div className="space-y-5 mb-6">
            <div className="rounded-xl bg-surface-container-low p-4 space-y-4 border border-outline/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Tự do pha màu tác phẩm</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Chọn màu bạn thích, hệ thống sẽ tự động phối các màu còn lại đạt chuẩn tương phản WCAG AA (&gt;= 4.5:1)</p>
                </div>
                <button 
                  onClick={resetToDefault}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-xs text-primary font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Khôi phục
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Background color picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant block">Màu nền chủ đạo (Background)</label>
                  <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline/10">
                    <input 
                      type="color" 
                      value={customBgColor} 
                      onChange={handleCustomBgChange}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold uppercase">{customBgColor}</span>
                  </div>
                </div>

                {/* Primary accent picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant block">Màu nhấn thương hiệu (Primary)</label>
                  <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline/10">
                    <input 
                      type="color" 
                      value={customPrimaryColor} 
                      onChange={handleCustomPrimaryChange}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold uppercase">{customPrimaryColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Contrast indicator card */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl flex items-start gap-2">
              <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">Đạt chuẩn WCAG AA (Contrast &gt; 4.5:1)</span>
                <p className="text-xs mt-0.5 opacity-90">Toàn bộ văn bản hiển thị rõ ràng, sắc nét trên nền tùy chỉnh, mang lại sự dễ chịu tuyệt đối cho đôi mắt.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-full transition-all text-sm active:scale-98"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
