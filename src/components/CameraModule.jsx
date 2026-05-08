import React, { useRef, useState, useEffect } from 'react';
import { Camera, ShieldCheck, Activity, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CameraModule - 金融級確信影像採集組件
 * 專為戶外強光、低頻寬農村環境設計
 */
export const CameraModule = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // --- 1. 影像預處理引擎：灰階化與拉伸對比 ---
  const applyImagePreProcessing = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let min = 255, max = 0;

    // 計算亮度極值
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg < min) min = avg;
      if (avg > max) max = avg;
    }

    // 執行拉伸對比與灰階化，提升 N-P-K 數值辨識率
    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // 對比拉伸公式: (v - min) * (255 / (max - min))
      avg = (avg - min) * (255 / (max - min || 1));
      data[i] = data[i+1] = data[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // --- 2. 地理空間標記與數位指紋 ---
  const generateAuditEvidence = async (base64) => {
    setProgress(30);
    // 生成影像數位指紋
    const msgUint8 = new TextEncoder().encode(base64);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    setProgress(60);
    // 獲取精確經緯度 (6位小數)
    const coords = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        () => resolve("0.000000, 0.000000"),
        { enableHighAccuracy: true }
      );
    });
    
    setProgress(100);
    return { hash, coords };
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsProcessing(true);
    
    // 3. 智慧壓縮邏輯：離線或訊號弱時自動優化
    const quality = isOnline ? 0.8 : 0.6;
    const targetWidth = isOnline ? 1200 : 800;
    const ratio = video.videoWidth / video.videoHeight;
    
    canvas.width = targetWidth;
    canvas.height = targetWidth / ratio;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 套用預處理引擎
    applyImagePreProcessing(ctx, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', quality);
    const evidence = await generateAuditEvidence(base64);

    onCapture({
      image: base64,
      ...evidence,
      timestamp: new Date().toISOString()
    });

    stopCamera();
    setIsProcessing(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("[SYSTEM] Camera error", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] border-4 border-agric-neon bg-agric-black overflow-hidden">
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-agric-black/95 flex flex-col items-center justify-center p-8"
          >
            <ShieldCheck size={64} className="text-agric-neon mb-4 animate-pulse" />
            <h2 className="text-xl font-bold neon-glow mb-2 uppercase tracking-tighter">正在生成 ESG 數位證跡...</h2>
            <div className="w-full bg-agric-gray h-3 mt-4 border border-agric-neon/30">
              <motion.div 
                className="h-full bg-agric-neon"
                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-6 text-[10px] flex gap-4 opacity-50">
              <span className="flex items-center gap-1 font-mono">
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? 'ONLINE_MODE' : 'OFFLINE_RESILIENCY'}
              </span>
              <span className="flex items-center gap-1 font-mono"><Activity size={10}/> SHA256_HASHING</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stream ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
          <div className="absolute top-4 right-4 text-[10px] bg-red-600 text-white px-2 py-1 font-bold animate-pulse">
            REC ● SECURED FEED
          </div>
          {/* 泥巴手指按鈕：高度固定 120px */}
          <button 
            onClick={capture} 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 btn-muddy w-5/6 h-[120px] shadow-[0_10px_40px_rgba(0,255,0,0.4)]"
          >
            <Camera size={40} /> 採集農事證跡
          </button>
        </>
      ) : (
        <button 
          onClick={startCamera} 
          className="w-full h-full flex flex-col items-center justify-center gap-8"
        >
          <div className="relative">
            <Camera size={100} className="text-agric-neon" />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 border-2 border-agric-neon rounded-full" 
            />
          </div>
          <div className="text-center">
            <span className="text-3xl font-black block tracking-tighter">啟動採集終端</span>
            <span className="text-xs opacity-40 uppercase tracking-widest mt-2 block">Secured by ANTIGRAVITY STITCH Layer</span>
          </div>
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
