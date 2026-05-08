import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, Package, Leaf, Coins, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

/**
 * DataAssuranceCard - ESG 確信與利益誘幫轉譯終端
 */
export const DataAssuranceCard = ({ data, onConfirm, onRetake }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isManualMode, setIsManualMode] = useState(data.confidence_score >= 0.5 && data.confidence_score <= 0.9);
  const [manualData, setManualData] = useState({ ...data });

  // --- AI 信心值邏輯門實作 ---
  useEffect(() => {
    if (data.confidence_score < 0.5) {
      // 觸發重拍流程
      const speak = () => {
        const msg = new SpeechSynthesisUtterance("阿伯，照片太反光了，幫我重拍一張好嗎？");
        msg.lang = "zh-TW";
        window.speechSynthesis.speak(msg);
      };
      speak();
      onRetake();
    }
  }, [data.confidence_score]);

  const triggerConfirm = async () => {
    setIsSyncing(true);
    try {
      await onConfirm(manualData);
      setIsSuccess(true);
    } catch (err) {
      console.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="high-contrast-card relative overflow-hidden p-6 border-4 border-agric-neon">
      <AnimatePresence>
        {isManualMode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-yellow-600/30 border-2 border-yellow-500">
            <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2 text-sm">
               🔍 數據信心偏低 ({data.confidence_score})，請確認品項
            </h3>
            <div className="grid gap-3">
              <input 
                type="text" 
                value={manualData.material_name} 
                onChange={(e) => setManualData({...manualData, material_name: e.target.value})}
                className="bg-agric-black border border-agric-neon p-3 text-lg font-black text-agric-neon outline-none"
              />
            </div>
            <button onClick={() => setIsManualMode(false)} className="mt-4 w-full bg-yellow-500 text-black p-3 font-black uppercase">修正完畢</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 標題：數據來源確信 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-agric-neon">
          <ShieldCheck size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">ESG Secured Evidence</span>
        </div>
        <div className="text-[10px] opacity-40 font-mono">DIGITAL_FINGERPRINT: {data.hash?.substring(0, 8)}</div>
      </div>

      {/* 特大視覺模組：資材核對與縮圖 */}
      <div className="flex gap-4 mb-8">
        <div className="w-24 h-24 border-2 border-agric-neon flex-shrink-0 bg-agric-gray overflow-hidden">
          <img src={data.image} alt="Original Capture" className="w-full h-full object-cover grayscale" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[10px] opacity-50 uppercase mb-1 font-bold">已辨識資材內容</span>
          <h2 className="text-2xl font-black neon-glow flex items-center gap-2">
            <Package size={24} className="text-agric-neon" /> {data.material_name}
          </h2>
          <p className="text-sm opacity-80 mt-1">今天施作了 {data.usage_amount} {data.original_unit}</p>
        </div>
      </div>

      {/* 利益誘因顯示模組 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-agric-gray border-2 border-agric-neon/30 p-4">
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <Leaf size={14} className="text-agric-neon" />
            <span className="text-[10px] font-bold">預計減碳量</span>
          </div>
          <div className="text-2xl font-black text-agric-neon">
            {carbonSaving} <span className="text-xs font-normal">kg</span>
          </div>
        </div>
        <div className="bg-agric-gray border-2 border-[#FFD700]/30 p-4">
          <div className="flex items-center gap-2 mb-2 opacity-60 text-[#FFD700]">
            <Coins size={14} />
            <span className="text-[10px] font-bold">預計補貼額</span>
          </div>
          <div className="text-2xl font-black text-[#FFD700]">
            ${estimatedSubsidy} <span className="text-xs font-normal">NTD</span>
          </div>
        </div>
      </div>

      {/* 橫向滑動確認鎖 (Assurance Lock) */}
      {!isSuccess ? (
        <div className="relative h-24 bg-agric-gray border-4 border-agric-neon rounded-none overflow-hidden flex items-center p-1">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: trackWidth }}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="h-full aspect-square bg-agric-neon z-20 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(0,255,0,0.5)]"
          >
            <ChevronRight className="text-agric-black" size={48} strokeWidth={3} />
          </motion.div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-agric-neon opacity-50 uppercase">右滑確信存檔</span>
              <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity }} className="text-agric-neon opacity-50">
                <ArrowRight size={24} />
              </motion.div>
            </div>
          </div>
          
          {/* 滑動軌跡填滿 */}
          <motion.div 
            style={{ width: x, backgroundColor: bgColor }}
            className="absolute inset-y-0 left-0 z-0 opacity-20"
          />
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
          className="h-24 bg-agric-neon flex flex-col items-center justify-center text-agric-black font-black"
        >
          <div className="flex items-center gap-2 text-2xl">
             <CheckCircle2 size={32} /> 存檔成功
          </div>
          <div className="text-[10px] uppercase mt-1">Blockchain Confirmed // Audit Trail Initialized</div>
        </motion.div>
      )}

      <footer className="mt-6 text-[8px] opacity-30 text-center tracking-widest font-mono">
        SECURED DATA TRANSLATION ENGINE v1.2 // GRI 305-5 COMPLIANT
      </footer>
    </motion.div>
  );
};
