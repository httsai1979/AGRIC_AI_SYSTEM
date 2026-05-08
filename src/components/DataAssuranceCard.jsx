import React, { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export const DataAssuranceCard = ({ data, onConfirm }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [1, 0]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= 150) {
      setIsConfirmed(true);
      onConfirm();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="high-contrast-card mt-6"
    >
      <div className="flex items-center gap-3 mb-4 text-agric-neon">
        <ShieldCheck size={28} />
        <h2 className="text-xl font-bold uppercase tracking-widest">ESG Assurance</h2>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between border-b border-agric-neon/30 pb-2">
          <span className="opacity-60 text-sm">LOG ID</span>
          <span className="font-bold text-xs">{data.log_id || "PENDING"}</span>
        </div>
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
          <span className="text-[8px] font-mono break-all text-right max-w-[60%]">
            {data.integrity_hash}
          </span>
        </div>
      </div>

      {/* 滑動確認按鈕 (Framer Motion 實作) */}
      <div className="relative h-24 bg-agric-gray border-2 border-agric-neon overflow-hidden rounded-none">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 200 }}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="absolute inset-y-0 left-0 w-24 bg-agric-neon z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <ChevronRight className="text-agric-black" size={32} />
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-agric-neon font-bold text-sm">
          右滑確信數據 [SLIDE TO ASSURE]
        </div>
      </div>
    </motion.div>
  );
};

