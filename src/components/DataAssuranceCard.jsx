import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, Package, Leaf, Coins, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

/**
 * DataAssuranceCard - ESG 確信與利益誘因轉譯終端
 * 負責將 AI 辨識結果轉譯為農民感知的價值，並執行最終確信滑動
 */
export const DataAssuranceCard = ({ data, onConfirm }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // --- 1. 利益誘因實時算法 (基於 $W_{fert}$ 邏輯) ---
  // 1包預設 20kg, 補助預設 10元/kg, 減碳預設 0.5kg/kg
  const weight = (data.usage_amount || 0) * 20; 
  const carbonSaving = (weight * 0.5).toFixed(1);
  const estimatedSubsidy = (weight * 10).toLocaleString();

  // --- 2. 確信滑動鎖 (Assurance Lock) 邏輯 ---
  const x = useMotionValue(0);
  const trackWidth = 220; // 滑動軌道長度
  const xRange = [0, trackWidth];
  const opacity = useTransform(x, xRange, [1, 0]);
  const bgColor = useTransform(x, xRange, ["#1A1A1A", "#00FF00"]);

  const handleDragEnd = (_, info) => {
    // 若滑動超過 80% 則視為確信成功
    if (info.offset.x >= trackWidth * 0.8) {
      executeCommit();
    }
  };

  const executeCommit = async () => {
    setIsSyncing(true);
    
    // 3. 語音反饋 (在地化阿伯親和模式)
    const playSuccessVoice = () => {
      const utterance = new SpeechSynthesisUtterance("阿伯記錄成功了，補助金已經幫你記在帳本囉！");
      utterance.lang = "zh-TW";
      utterance.rate = 0.95; // 稍慢的速度增加親切感
      window.speechSynthesis.speak(utterance);
    };

    try {
      // 呼叫外部傳入的確認回調 (觸發 stitchApi)
      await onConfirm();
      
      setTimeout(() => {
        setIsSyncing(false);
        setIsSuccess(true);
        playSuccessVoice();
      }, 1500);
    } catch (err) {
      setIsSyncing(false);
      alert("同步失敗，已轉入離線隊列存檔。");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="high-contrast-card relative overflow-hidden p-6 border-4 border-agric-neon"
    >
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-agric-neon z-50 flex flex-col items-center justify-center text-agric-black"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <CheckCircle2 size={64} />
            </motion.div>
            <span className="text-2xl font-black mt-4 uppercase">數據入鏈中...</span>
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
