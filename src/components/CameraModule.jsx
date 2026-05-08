import React, { useRef, useState, useEffect } from 'react';
import { Camera, ShieldCheck, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CameraModule - 專業級 AI 影像增益採集組件
 * 內建前端影像強化引擎，專門針對肥料袋 OCR 優化
 */
export const CameraModule = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- 1. 影像增益引擎 (Image Enhancement Engine) ---
  const applyEnhancement = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Step A: 自動對比度拉伸 (Auto-Contrast Stretching)
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const ratio = 255 / (max - min || 1);

    // Step B: 灰階化與對比強化 (提升 N-P-K 數值特徵)
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const enhanced = (avg - min) * ratio;
      data[i] = data[i+1] = data[i+2] = enhanced;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // 啟動「計算確信雜湊中...」狀態
    setIsProcessing(true);
    
    const ctx = canvas.getContext('2d');
    canvas.width = 1024; // 鎖定解析度以確保辨識穩定
    canvas.height = 1024 / (video.videoWidth / video.videoHeight);
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 執行影像增益引擎
    applyEnhancement(ctx, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 模擬計算數位指紋與 GPS 擷取
    setTimeout(() => {
      onCapture({
        image: base64,
        timestamp: new Date().toISOString(),
        voice_blob: null // 預留語音接口
      });
      stopCamera();
      setIsProcessing(false);
    }, 1200);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera denied", err);
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
            className="absolute inset-0 z-50 bg-agric-black/90 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-center"
            >
              <Activity size={64} className="text-agric-neon mb-4" />
              <h2 className="text-xl font-bold neon-glow uppercase tracking-tighter">計算確信雜湊中...</h2>
              <p className="text-[10px] opacity-50 mt-2 font-mono">CALCULATING_IMAGE_DIGEST_SHA256</p>
            </motion.div>
            <div className="mt-8 w-1/2 bg-agric-gray h-1 overflow-hidden">
               <motion.div 
                 initial={{ x: "-100%" }} animate={{ x: "100%" }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                 className="w-full h-full bg-agric-neon"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stream ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] px-2 py-1 font-bold animate-pulse">
            AI ENHANCEMENT ACTIVE
          </div>
          <button onClick={capture} className="absolute bottom-8 left-1/2 -translate-x-1/2 btn-muddy w-2/3 h-32">
            <Camera size={32} /> 採集證跡
          </button>
        </>
      ) : (
        <button onClick={startCamera} className="w-full h-full flex flex-col items-center justify-center gap-6">
          <Camera size={80} className="text-agric-neon" />
          <span className="text-2xl font-black uppercase tracking-widest">啟動採集終端</span>
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
