import React, { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export const DataAssuranceCard = ({ data, onConfirm }) => {
  const [sliderPos, setSliderPos] = useState(0);

  const handleSlider = (e) => {
    const value = e.target.value;
    setSliderPos(value);
    if (value >= 90) {
      onConfirm();
      setSliderPos(0);
    }
  };

  return (
    <div className="high-contrast-card mt-6">
      <div className="flex items-center gap-3 mb-4 text-agric-neon">
        <ShieldCheck size={28} />
        <h2 className="text-xl font-bold uppercase tracking-widest">ESG Assurance</h2>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between border-b border-agric-neon/30 pb-2">
          <span className="opacity-60 text-sm">MATERIAL</span>
          <span className="font-bold">{data.material_name || "PENDING"}</span>
        </div>
        <div className="flex justify-between border-b border-agric-neon/30 pb-2">
          <span className="opacity-60 text-sm">AMOUNT</span>
          <span className="font-bold">{data.usage_amount} {data.original_unit}</span>
        </div>
        <div className="flex justify-between border-b border-agric-neon/30 pb-2">
          <span className="opacity-60 text-sm">INTEGRITY HASH</span>
          <span className="text-[10px] font-mono break-all text-right max-w-[60%]">
            {data.hash?.substring(0, 24)}...
          </span>
        </div>
      </div>

      {/* 滑動確認按鈕 */}
      <div className="relative h-24 bg-agric-gray border-2 border-agric-neon overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-agric-neon transition-all duration-75 flex items-center justify-end pr-4"
          style={{ width: `${sliderPos}%` }}
        >
          {sliderPos > 20 && <ChevronRight className="text-agric-black" />}
        </div>
        <input 
          type="range" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          min="0" max="100" value={sliderPos}
          onChange={handleSlider}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-agric-neon font-bold">
          {sliderPos > 50 ? "放開以確信數據" : "右滑確認數據"}
        </div>
      </div>
    </div>
  );
};
