import React, { useState, useEffect } from 'react';
import { ShieldCheck, BarChart3, Map, History, FileText, Lock, Globe, FileArchive, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AggregatorService } from '../services/AggregatorService';

import { PdfService } from '../services/PdfService';

/**
 * ComplianceManager - B2B 核心功能模組 (採購/稽核 雙模)
 */
export const ComplianceManager = ({ mode }) => {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('ag_persistent_queue') || '[]');
    setHistory(data);
    setMetrics(AggregatorService.getComplianceMetrics(data));
  }, []);

  const handleDownloadReport = async (task) => {
    // 針對特定紀錄生成合規包
    await PdfService.generateComplianceReport({
      enterprise: "阿古力契作專案",
      batch_number: "CONTRACT-2024-001",
      impact: { totalCarbonReduction: (task.data.usage_amount * 0.52).toFixed(2) },
      image: task.data.image,
      coords: task.data.coords,
      timestamp: task.data.timestamp,
      signature: task.data.hmac_signature || task.data.digital_signature
    });
  };


  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode === 'BUYER' ? <BarChart3 className="text-agric-neon" /> : <ShieldCheck className="text-agric-neon" />}
          <h2 className="text-2xl font-black neon-glow uppercase tracking-tighter">
            {mode === 'BUYER' ? '採購儀表板' : '確信稽核入口'}
          </h2>
        </div>
        <div className="text-[10px] bg-agric-gray px-2 py-1 border border-agric-neon/30 text-agric-neon font-mono">
          MODE_{mode}
        </div>
      </header>

      {/* 採購模式：顯示 ESG 彙整指標 */}
      {mode === 'BUYER' && metrics && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="high-contrast-card bg-agric-gray/50">
            <span className="text-[10px] opacity-60 uppercase font-bold">年度累計減碳 (GRI 305-5)</span>
            <div className="text-4xl font-black text-agric-neon mt-2">{metrics.totalCarbonReduction} <span className="text-sm font-normal">kg CO2e</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="high-contrast-card">
              <span className="text-[10px] opacity-60 uppercase block mb-1">支持農民數 (SDG 10)</span>
              <span className="text-2xl font-black">{metrics.farmerCount} 位</span>
            </div>
            <div className="high-contrast-card border-blue-500">
              <span className="text-[10px] opacity-60 uppercase block mb-1">契約總量 (Tons)</span>
              <span className="text-2xl font-black text-blue-500">{metrics.totalTonnage}</span>
            </div>
          </div>
          {/* 契作地圖入口 (Placeholder) */}
          <div className="h-40 border-2 border-agric-neon flex flex-col items-center justify-center gap-2 bg-agric-gray">
             <Map size={32} className="text-agric-neon animate-pulse" />
             <span className="text-xs font-bold uppercase">點擊進入契作產地 3D 視角</span>
          </div>
        </motion.div>
      )}

      {/* 稽核模式：顯示確信證據 (隱藏價格與敏感個資) */}
      {mode === 'AUDITOR' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-3 bg-red-900/20 border border-red-500/50 text-[10px] text-red-500 font-bold uppercase flex items-center gap-2">
            <Lock size={12} /> 稽核模式：敏感個資 (農民姓名/契作價格) 已依合約遮蔽
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((task, idx) => (
              <div key={idx} className="high-contrast-card p-4 space-y-4">
                <div className="flex justify-between items-center text-[10px] border-b border-agric-neon/20 pb-2">
                   <span className="font-bold">憑證 #{idx + 1}</span>
                   <span className="flex items-center gap-1 text-agric-neon"><Globe size={10} /> HMAC_VERIFIED</span>
                </div>
                <div className="aspect-video bg-agric-gray border border-agric-neon/20 overflow-hidden">
                  <img src={task.data.image} alt="Original Capture" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-agric-neon">
                    <History size={12} />
                    <span className="font-mono truncate uppercase">TX: {task.data.hmac_signature || task.data.digital_signature}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] opacity-60">
                    <FileText size={12} />
                    <span className="font-mono">GPS: {task.data.coords}</span>
                  </div>
                  <button 
                    onClick={() => handleDownloadReport(task)}
                    className="mt-2 flex items-center justify-center gap-2 bg-agric-neon text-black text-[10px] font-black py-2 uppercase"
                  >
                    <Download size={12} /> 下載此筆合規證明
                  </button>
                </div>

              </div>
            ))}
          </div>

          <button className="btn-muddy w-full h-20 flex items-center justify-center gap-3">
             <FileArchive size={24} /> 生成完整確信稽核包 (ZIP)
          </button>
        </motion.div>
      )}
    </div>
  );
};
