import React, { useState, useEffect } from 'react';
import { CameraModule } from './components/CameraModule';
import { DataAssuranceCard } from './components/DataAssuranceCard';
import { ComplianceManager } from './components/ComplianceManager';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { stitchApi } from './services/stitchApi';
import { Wifi, WifiOff, Database, LayoutDashboard, Camera } from 'lucide-react';
import './styles/theme.css';

function App() {
  const [view, setView] = useState('capture'); // 'capture' | 'compliance'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capturedData, setCapturedData] = useState(null);
  const { queue, addToQueue, isSyncing } = useOfflineQueue();

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleCapture = (evidence) => {
    setCapturedData(evidence);
  };

  const handleConfirm = async () => {
    if (!capturedData) return;
    
    try {
      if (isOnline) {
        await stitchApi.submitData(capturedData);
      } else {
        addToQueue(capturedData);
      }
      setCapturedData(null);
    } catch (err) {
      addToQueue(capturedData);
      setCapturedData(null);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      {/* 全域系統導航 */}
      <nav className="flex border-b-2 border-agric-neon mb-6">
        <button 
          onClick={() => setView('capture')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest ${view === 'capture' ? 'bg-agric-neon text-agric-black' : 'text-agric-neon opacity-50'}`}
        >
          <Camera size={20} /> 採集端
        </button>
        <button 
          onClick={() => setView('compliance')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest ${view === 'compliance' ? 'bg-agric-neon text-agric-black' : 'text-agric-neon opacity-50'}`}
        >
          <LayoutDashboard size={20} /> 管理端
        </button>
      </nav>

      {/* 系統狀態條 */}
      <header className="mb-6">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-agric-neon"><Wifi size={12} /> SYSTEM_ONLINE</span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 animate-pulse"><WifiOff size={12} /> OFFLINE_RETRY_MODE</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-agric-neon">
            <Database size={12} /> 待同步隊列: {queue.length}
          </div>
        </div>
      </header>

      {/* 視圖切換區域 */}
      <main className="flex-grow">
        {view === 'capture' ? (
          <div className="space-y-6">
            {!capturedData ? (
              <CameraModule onCapture={handleCapture} />
            ) : (
              <DataAssuranceCard 
                data={capturedData} 
                onConfirm={handleConfirm} 
              />
            )}
          </div>
        ) : (
          <ComplianceManager />
        )}
      </main>

      {/* 頁腳：系統資訊 */}
      <footer className="mt-8 py-6 border-t border-agric-neon/20 flex flex-col items-center gap-2">
        <h1 className="text-xl font-black neon-glow tracking-tighter uppercase">Antigravity STITCH Layer</h1>
        <div className="text-[8px] opacity-30 text-center uppercase tracking-widest leading-loose">
          Secure Multi-Agent Infrastructure<br/>
          Decoupled ESG Evidence Engine v1.5<br/>
          © 2026 AGRIC AI SYSTEMS
        </div>
      </footer>
    </div>
  );
}

export default App;
