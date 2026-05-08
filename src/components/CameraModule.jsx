import React, { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export const CameraModule = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // 影像處理：灰階化以應對低光/強光 OCR
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
      }
      ctx.putImageData(imageData, 0, 0);

      const base64 = canvas.toDataURL('image/jpeg', 0.7); // 壓縮至 0.7
      onCapture(base64);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="relative w-full aspect-square border-4 border-agric-neon bg-agric-gray overflow-hidden">
      {stream ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button onClick={capture} className="absolute bottom-4 left-1/2 -translate-x-1/2 btn-muddy w-2/3 h-24">
            <Camera size={32} /> 拍攝
          </button>
        </>
      ) : (
        <button onClick={startCamera} className="w-full h-full flex flex-col items-center justify-center gap-4 text-agric-neon">
          <Camera size={64} />
          <span className="text-xl">開啟相機</span>
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
