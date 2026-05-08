import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, FileArchive, Search } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ComplianceManager - B2B 合規包生成器
 * 供採購人員下載批次數據、AI 辨識軌跡與 PDF 檢測報告
 */
export const ComplianceManager = () => {
  const [batchId, setBatchId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportLink, setReportLink] = useState(null);

  const handleGenerate = async () => {
    if (!batchId) return;
    setIsGenerating(true);
    
    // 模擬呼叫 GAS API 進行報告打包
    try {
      // 實際場景會呼叫 GAS 的 doGet 並帶入批號
      // const url = `${import.meta.env.VITE_GAS_URL}?action=generate_compliance_zip&batch=${batchId}`;
      setTimeout(() => {
        setReportLink("#"); // 模擬生成的 ZIP 連結
        setIsGenerating(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to generate compliance pack", err);
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-6 bg-agric-black border-4 border-agric-neon min-h-[400px]"
    >
      <div className="flex items-center gap-3 mb-8">
        <FileArchive size={32} className="text-agric-neon" />
        <h2 className="text-3xl font-black neon-glow uppercase tracking-tighter">B2B Compliance Manager</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs opacity-50 block mb-2 uppercase">請輸入契作批號 (Batch Number)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.json-2024-CONTRACT-001"
              className="flex-grow bg-agric-gray border-2 border-agric-neon p-4 text-agric-neon outline-none"
            />
            <button 
              onClick={handleGenerate}
              className="bg-agric-neon text-agric-black px-6 font-black uppercase"
            >
              <Search size={24} />
            </button>
          </div>
        </div>

        {isGenerating ? (
          <div className="h-40 border-2 border-dashed border-agric-neon/30 flex flex-col items-center justify-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <FileText size={48} className="text-agric-neon" />
            </motion.div>
            <span className="text-sm font-bold animate-pulse">正在打包原始辨識軌跡與確信報告...</span>
          </div>
        ) : reportLink ? (
          <motion.div 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-agric-neon p-6 text-agric-black flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-black uppercase">報告生成完成</h3>
              <p className="text-xs font-bold opacity-70">包含：PDF 報告, 原始影像, GPS 指紋</p>
            </div>
            <a 
              href={reportLink} 
              className="bg-agric-black text-agric-neon p-4 rounded-none shadow-[4px_4px_0px_#000]"
            >
              <Download size={32} />
            </a>
          </motion.div>
        ) : (
          <div className="p-4 bg-agric-gray border border-agric-neon/20 text-xs opacity-50 flex items-start gap-3">
            <AlertCircle size={16} className="mt-1" />
            <div>
              此功能將自動串接後端 Google Apps Script，
              將所有對應此批號的農事紀錄、Gemini 辨識 JSON 與 
              SHA-256 原始指紋打包為 B2B 稽核專用 ZIP。
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
