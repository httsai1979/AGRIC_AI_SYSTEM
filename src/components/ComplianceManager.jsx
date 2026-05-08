import React, { useState, useEffect } from 'react';
import { FileText, Download, ShieldCheck, Eye, EyeOff, BarChart, History, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AggregatorService } from '../services/AggregatorService';
import { jsPDF } from 'jspdf';

/**
 * ComplianceManager - B2B 稽核員入口與一鍵合規包生成器
 */
export const ComplianceManager = () => {
  const [isAuditorMode, setIsAuditorMode] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // 從本地持久化隊列讀取數據進行彙整
    const savedData = JSON.parse(localStorage.getItem('ag_persistent_queue') || '[]');
    setHistory(savedData);
    setMetrics(AggregatorService.getComplianceMetrics(savedData));
  }, []);

  // --- 1. 一鍵合規包 (Compliance Kit) PDF 生成 ---
  const generateComplianceReport = () => {
    const doc = new jsPDF();
    const ts = new Date().toLocaleString();

    // 浮水印設計
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(50);
    doc.text("ANTICRAVITY CONFIDENTIAL", 30, 150, { angle: 45 });

    // 標題與內容
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text("2026 ESG COMPLIANCE REPORT", 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Report ID: AG-AUDIT-${Date.now()}`, 20, 40);
    doc.text(`Generated At: ${ts}`, 20, 45);

    doc.line(20, 50, 190, 50);

    doc.setFontSize(14);
    doc.text("1. GRI 305-5 ENVIRONMENTAL IMPACT", 20, 65);
    doc.text(`- Annual Carbon Reduction: ${metrics.totalCarbonReduction} kg CO2e`, 25, 75);
    doc.text(`- Total Material Tracked: ${metrics.totalTonnage} Tons`, 25, 82);

    doc.text("2. SDG 10 SOCIAL IMPACT", 20, 100);
    doc.text(`- Total Farmers Supported: ${metrics.farmerCount}`, 25, 110);

    doc.text("3. EVIDENCE AUDIT TRAIL (DIGITAL FINGERPRINTS)", 20, 130);
    doc.setFontSize(8);
    history.slice(0, 5).forEach((item, idx) => {
      doc.text(`- ${item.data.material_name}: ${item.data.hmac_signature?.substring(0, 40)}...`, 25, 140 + (idx * 6));
    });

    doc.save(`AG_Compliance_Report_2026.pdf`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 稽核員切換開關 */}
      <div className="bg-agric-gray border-2 border-agric-neon p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isAuditorMode ? <Eye size={24} className="text-agric-neon" /> : <EyeOff size={24} className="opacity-40" />}
          <div>
            <h3 className="text-sm font-bold uppercase">稽核員入口模式</h3>
            <p className="text-[10px] opacity-50">啟動後僅顯示確信憑證</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuditorMode(!isAuditorMode)}
          className={`w-14 h-8 flex items-center p-1 transition-colors ${isAuditorMode ? 'bg-agric-neon' : 'bg-gray-700'}`}
        >
          <motion.div 
            animate={{ x: isAuditorMode ? 24 : 0 }}
            className="w-6 h-6 bg-white"
          />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isAuditorMode ? (
          /* B2B 管理儀表板 */
          <motion.div 
            key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            <div className="high-contrast-card">
              <div className="flex items-center gap-2 mb-6 text-agric-neon">
                <BarChart size={24} />
                <h2 className="text-xl font-black uppercase">年度永續指標 (2026)</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="border-l-4 border-agric-neon pl-4">
                  <span className="text-[10px] opacity-60 uppercase block mb-1">年度累計減碳 (GRI 305-5)</span>
                  <div className="text-4xl font-black">{metrics?.totalCarbonReduction} <span className="text-sm font-normal">kg CO2e</span></div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <span className="text-[10px] opacity-60 uppercase block mb-1">支持農民總數 (SDG 10)</span>
                  <div className="text-4xl font-black">{metrics?.farmerCount} <span className="text-sm font-normal">位</span></div>
                </div>
              </div>

              <button 
                onClick={generateComplianceReport}
                className="mt-8 btn-muddy h-24 w-full shadow-[0_0_20px_rgba(0,255,0,0.2)]"
              >
                <Download size={24} /> 一鍵生成 2026 合規報告
              </button>
            </div>
          </motion.div>
        ) : (
          /* 稽核員確信介面 */
          <motion.div 
            key="auditor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-red-900/20 border-2 border-red-500/50 flex items-center gap-3 text-red-500">
              <ShieldCheck size={20} />
              <span className="text-xs font-bold uppercase">稽核模式已啟動：敏感數據已遮蔽</span>
            </div>

            {history.map((task, idx) => (
              <div key={idx} className="high-contrast-card p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-agric-neon/20 pb-2">
                  <span className="text-xs font-bold">憑證 #{idx + 1}</span>
                  <span className="text-[8px] font-mono opacity-50">{task.data.timestamp}</span>
                </div>
                {/* 僅顯示影像與數位指紋，隱藏農民 UID */}
                <div className="aspect-video border border-agric-neon/30 bg-agric-gray overflow-hidden">
                  <img src={task.data.image} alt="Evidence" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="grid gap-2">
                   <div className="flex items-center gap-2 text-[10px]">
                      <MapPin size={10} className="text-agric-neon" />
                      <span className="font-mono">{task.data.coords}</span>
                   </div>
                   <div className="flex items-center gap-2 text-[8px] opacity-50 overflow-hidden">
                      <History size={10} />
                      <span className="truncate">{task.data.hmac_signature}</span>
                   </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-center py-4">
        <p className="text-[8px] opacity-30 uppercase tracking-[0.2em]">Antigravity Compliance Engine v1.5</p>
      </footer>
    </div>
  );
};
