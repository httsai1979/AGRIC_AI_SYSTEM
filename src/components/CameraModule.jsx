import React, { useRef, useState } from 'react';
import { Camera, Mic, Activity, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CameraModule - AI 系統集成版 (影像＋語音融合)
 */
export const CameraModule = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const capture = async () => {
    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 1024 / (video.videoWidth / video.videoHeight);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 模擬影像增益處理
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 傳送數據 (含語音 Blob 預留)
    setTimeout(() => {
      onCapture({
        image: base64,
        voice_blob: null, // 多模態語音接口
        timestamp: new Date().toISOString()
      });
      setIsProcessing(false);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }, 1500);
  };

  const startCamera = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    setStream(s);
    if (videoRef.current) videoRef.current.srcObject = s;
  };

  return (
    <div className="relative w-full aspect-[3/4] border-4 border-agric-neon bg-agric-black overflow-hidden">
      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-agric-black/90 flex flex-col items-center justify-center">
            <Activity size={64} className="text-agric-neon mb-4 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tighter">數據融合確信中...</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {stream ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
          <div className="absolute bottom-8 w-full flex justify-center gap-6 px-6">
            <button 
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              className={`h-24 flex-1 flex flex-col items-center justify-center border-4 ${isRecording ? 'bg-red-600 border-white' : 'bg-agric-gray border-agric-neon'}`}
            >
              <Mic size={24} />
              <span className="text-[10px] font-bold mt-1 uppercase">{isRecording ? '正在錄音' : '按住說明數量'}</span>
            </button>
            <button onClick={capture} className="h-24 flex-1 btn-muddy">
              <Camera size={32} />
              <span className="text-[10px] font-bold mt-1 uppercase">拍照採集</span>
            </button>
          </div>
        </>
      ) : (
        <button onClick={startCamera} className="w-full h-full flex flex-col items-center justify-center gap-6">
          <RefreshCw size={60} className="text-agric-neon" />
          <span className="text-2xl font-black uppercase tracking-widest">啟動採集終端</span>
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
