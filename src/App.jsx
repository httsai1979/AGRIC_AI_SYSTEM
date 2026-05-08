import React, { useState, useEffect } from 'react';
import { CameraModule } from './components/CameraModule';
import { DataAssuranceCard } from './components/DataAssuranceCard';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { stitchApi } from './services/stitchApi';
import { Wifi, WifiOff, Database } from 'lucide-react';
import './styles/theme.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { queue, addToQueue, removeFromQueue } = useOfflineQueue();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCapture = (base64) => {
    setCapturedImage(base64);
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;
    
    setIsSyncing(true);
    try {
      if (isOnline) {
        await stitchApi.submitData(capturedImage, "FARMER_001");
        alert("數據同步成功！");
      } else {
        addToQueue(capturedImage);
        alert("離線存檔成功，待網路恢復後自動同步。");
      }
      setCapturedImage(null);
    } catch (err) {
      addToQueue(capturedImage);
      alert("同步失敗，已轉入離線隊列。");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      <header className="py-6 border-b-4 border-agric-neon mb-6">
        <h1 className="text-4xl font-black tracking-tighter neon-glow">
          ANTIGRAVITY<br/>
          <span className="text-lg bg-agric-neon text-agric-black px-2 py-0.5 uppercase">Stitch Terminal</span>
        </h1>
        <div className="mt-4 flex justify-between text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} className="text-red-500" />}
            <span>{isOnline ? "在線模式" : "離線韌性模式"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={14} />
            <span>隊列: {queue.length}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {!capturedImage ? (
          <CameraModule onCapture={handleCapture} />
        ) : (
          <div className="space-y-4">
            <div className="border-4 border-agric-neon aspect-square overflow-hidden">
              <img src={capturedImage} className="w-full h-full object-cover grayscale" />
            </div>
            <DataAssuranceCard 
              data={{ 
                material_name: "台肥43號有機肥", 
                usage_amount: 5, 
                original_unit: "包",
                hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" 
              }} 
              onConfirm={handleConfirm} 
            />
            <button 
              onClick={() => setCapturedImage(null)}
              className="w-full py-4 text-agric-neon opacity-60 underline"
            >
              重新拍攝
            </button>
          </div>
        )}
      </main>

      <footer className="mt-8 py-4 border-t border-agric-neon/20 text-[10px] opacity-40 uppercase tracking-widest">
        SYSTEM DECOUPLED ARCHITECTURE V1.0 // 2026 ANTIGRAVITY
      </footer>
    </div>
  );
}

export default App;
