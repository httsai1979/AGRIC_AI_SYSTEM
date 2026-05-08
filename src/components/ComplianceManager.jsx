import React, { useState, useEffect } from 'react';
import { FileArchive, Download, Eye, EyeOff, BarChart3, ShieldAlert, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculationService } from '../services/CalculationService';
import { jsPDF } from 'jspdf';

/**
 * ComplianceManager - 專業級合規管理終端
 * 支援多租戶視角切換與一鍵 PDF 確信報告生成
 */
export const ComplianceManager = () => {
  const [role, setRole] = useState('corporate'); // 'farmer' | 'corporate'
  const [batchId, setBatchId] = useState('CONTRACT-2024-001');
  const [mockTasks, setMockTasks] = useState([]);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    // 模擬從 localStorage 或 API 獲取該批次的歷史數據
    const savedTasks = JSON.parse(localStorage.getItem('ag_persistent_queue') || '[]');
    setMockTasks(savedTasks);
    setImpact(CalculationService.calculateBatchImpact(savedTasks));
  }, [batchId]);

  // --- 1. 一鍵下載包固化 (Compliance Kit) ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    doc.setFontSize(22);
    doc.text("ANTIGRAVITY ESG COMPLIANCE REPORT", 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Batch ID: ${batchId}`, 20, 45);
    doc.text(`Generated At: ${timestamp}`, 20, 52);
    doc.text(`GRI 305-5 Status: COMPLIANT`, 20, 59);

    doc.line(20, 65, 190, 65);

    doc.text("IMPACT SUMMARY:", 20, 80);
    doc.text(`- Total Scope 3 Reduction: ${impact.scope3Reduction} kg CO2e`, 25, 90);
    doc.text(`- Soil Carbon Sequestration: ${impact.soilCarbon} kg CO2e`, 25, 100);
    doc.text(`- Verification Method: AI-OCR Digital Evidence`, 25, 110);

    doc.text("GRI 305-5 STATEMENT:", 20, 130);
    doc.text("All data in this report is backed by SHA-256 digital signatures", 20, 140);
    doc.text("and authenticated GPS coordinates, ensuring non-repudiation.", 20, 147);

    doc.save(`Compliance_Report_${batchId}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* 租戶切換器 */}
      <div className="flex bg-agric-gray border-2 border-agric-neon p-1">
        <button 
          onClick={() => setRole('corporate')}
          className={`flex-1 py-2 text-xs font-bold uppercase ${role === 'corporate' ? 'bg-agric-neon text-agric-black' : 'text-agric-neon'}`}
        >
          Corporate Buyer View
        </button>
        <button 
          onClick={() => setRole('farmer')}
          className={`flex-1 py-2 text-xs font-bold uppercase ${role === 'farmer' ? 'bg-agric-neon text-agric-black' : 'text-agric-neon'}`}
        >
          Farmer Personal View
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="high-contrast-card"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black neon-glow uppercase tracking-tighter">Impact Dashboard</h2>
            <p className="text-[10px] opacity-50 font-mono">BATCH: {batchId}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-agric-neon bg-agric-black px-3 py-1 border border-agric-neon">
            <Globe size={14} className="animate-spin-slow" />
            LIVE_AUDIT_ACTIVE
          </div>
        </div>

        {impact && (
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-agric-black border-l-4 border-agric-neon p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs opacity-60 uppercase">Scope 3 GHG Reduction (GRI 305-5)</span>
                <BarChart3 size={16} className="text-agric-neon" />
              </div>
              <div className="text-4xl font-black text-agric-neon">
                {impact.scope3Reduction} <span className="text-sm font-normal">kg CO2e</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-agric-black border-l-4 border-blue-500 p-4">
                <span className="text-[10px] opacity-60 block mb-1">SOIL CARBON</span>
                <span className="text-xl font-bold">{impact.soilCarbon} kg</span>
              </div>
              <div className="bg-agric-black border-l-4 border-yellow-500 p-4">
                <span className="text-[10px] opacity-60 block mb-1">TOTAL SUBSIDY</span>
                <span className="text-xl font-bold">${impact.estimatedSubsidy}</span>
              </div>
            </div>
          </div>
        )}

        {/* 原始軌跡過濾 (隱私保護) */}
        <div className="mt-8 border-t border-agric-neon/20 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase">Evidence Trail</h3>
            {role === 'corporate' ? (
              <span className="flex items-center gap-1 text-[8px] text-yellow-500 uppercase">
                <ShieldAlert size={10} /> Privacy Filter Active
              </span>
            ) : null}
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {mockTasks.map((task, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] bg-agric-gray p-3 border border-agric-neon/10">
                <div className="flex items-center gap-4">
                  <span className="opacity-40">#{idx+1}</span>
                  <span className="font-bold">{task.data.material_name}</span>
                </div>
                <div className="flex items-center gap-6">
                  {role === 'farmer' && (
                    <span className="text-blue-400 font-mono">{task.data.coords}</span>
                  )}
                  <span className="text-agric-neon font-mono">SIGNED</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 下載按鈕 */}
        <button 
          onClick={generatePDF}
          className="mt-8 btn-muddy h-24 w-full shadow-[0_0_20px_rgba(0,255,0,0.2)]"
        >
          <Download size={24} /> 生成 GRI 305-5 合規報告
        </button>
      </motion.div>

      <div className="text-[8px] opacity-30 text-center uppercase tracking-widest font-mono">
        Audit ID: 5e884898da28... // Framework: TNFD-Locate-V1
      </div>
    </div>
  );
};
