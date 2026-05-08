import React, { useState, useEffect } from 'react';
import { CameraModule } from './components/CameraModule';
import { DataAssuranceCard } from './components/DataAssuranceCard';
import { ComplianceManager } from './components/ComplianceManager';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { stitchApi } from './services/stitchApi';
import { User, ShieldCheck, ShoppingCart, Wifi, Database } from 'lucide-react';
import './styles/theme.css';

import liff from '@line/liff';

/**
 * App - ANTIGRAVITY 多角色狀態機中心
 */
function App() {
  const [systemRole, setSystemRole] = useState('FARMER'); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capturedData, setCapturedData] = useState(null);
  const [userProfile, setUserProfile] = useState({ displayName: '阿伯 (測試員)', userId: 'TEST_USER_001' });
  const { queue, addToQueue } = useOfflineQueue();

  useEffect(() => {
    // --- 1. LIFF 身分鎖定機制 ---
    const fetchProfile = async () => {
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        setUserProfile(profile);
        console.log('[LIFF] Identity Locked:', profile.userId);
      }
    };
    fetchProfile();

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleCapture = (evidence) => {
    setCapturedData(evidence);
  };

  const handleConfirm = async (manualData) => {
    // 注入 LIFF 身分與角色標籤
    const finalData = { 
      ...capturedData, 
      ...manualData, 
      farmer_uid: userProfile.userId,
      tenant_id: systemRole 
    };

    
    try {
      if (isOnline) {
        await stitchApi.submitData(finalData);
      } else {
        addToQueue(finalData);
      }
      setCapturedData(null);
    } catch (err) {
      addToQueue(finalData);
      setCapturedData(null);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-agric-black p-4">
      {/* LINE 身分歡迎語 */}
      {systemRole === 'FARMER' && (
        <div className="bg-agric-neon/10 border-l-4 border-agric-neon p-3 mb-6">
          <p className="text-[10px] font-bold text-agric-neon uppercase tracking-tighter">
            🟢 阿伯 {userProfile.displayName} 您好，系統已與您的產銷履歷帳號連線
          </p>
        </div>
      )}
      {/* 1. 角色切換器 (Dev/Demo Only) */}
      <nav className="flex bg-agric-gray border-2 border-agric-neon mb-6">
        <button onClick={() => setSystemRole('FARMER')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${systemRole === 'FARMER' ? 'bg-agric-neon text-black' : 'text-agric-neon opacity-40'}`}>
          <User size={18} /><span className="text-[8px] font-black uppercase">農民</span>
        </button>
        <button onClick={() => setSystemRole('BUYER')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${systemRole === 'BUYER' ? 'bg-agric-neon text-black' : 'text-agric-neon opacity-40'}`}>
          <ShoppingCart size={18} /><span className="text-[8px] font-black uppercase">採購</span>
        </button>
        <button onClick={() => setSystemRole('AUDITOR')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${systemRole === 'AUDITOR' ? 'bg-agric-neon text-black' : 'text-agric-neon opacity-40'}`}>
          <ShieldCheck size={18} /><span className="text-[8px] font-black uppercase">稽核</span>
        </button>
      </nav>

      {/* 2. 系統狀態條 */}
      <header className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-agric-neon shadow-[0_0_8px_#0F0]' : 'bg-red-600 animate-pulse'}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest">{isOnline ? 'Network_Secure' : 'Offline_Safe'}</span>
        </div>
        <div className="flex items-center gap-2 text-agric-neon text-[10px] font-mono">
          <Database size={12} /> 隊列: {queue.length}
        </div>
      </header>

      {/* 3. 角色功能鎖定邏輯 */}
      <main className="flex-grow">
        {systemRole === 'FARMER' && (
          <div className="space-y-6">
            {!capturedData ? (
              <CameraModule onCapture={handleCapture} />
            ) : (
              <DataAssuranceCard 
                data={capturedData} 
                onConfirm={handleConfirm} 
                onRetake={() => setCapturedData(null)} 
              />
            )}
          </div>
        )}

        {(systemRole === 'BUYER' || systemRole === 'AUDITOR') && (
          <ComplianceManager mode={systemRole} />
        )}
      </main>

      <footer className="mt-8 py-8 border-t border-agric-neon/20 text-center">
         <h1 className="text-xl font-black neon-glow tracking-tighter italic">ANTIGRAVITY STITCH</h1>
         <p className="text-[8px] opacity-30 mt-2 uppercase tracking-[0.3em]">Decoupled Architecture // GRI & SDG Framework</p>
      </footer>
    </div>
  );
}

export default App;
