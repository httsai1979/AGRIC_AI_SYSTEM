import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import liff from '@line/liff'
import './index.css'

// --- LIFF 初始化系統（Production-Grade）---
const initLiff = async () => {
  const liffId = import.meta.env.VITE_LIFF_ID;

  // 若 LIFF ID 為佔位符或未設定，跳過初始化（開發環境 Fallback）
  if (!liffId || liffId.includes('Xxxxxxxx') || liffId === 'undefined') {
    console.warn('[LIFF] VITE_LIFF_ID not configured. Running in Dev/Fallback mode.');
    return;
  }

  try {
    await liff.init({ liffId });
    console.log('[LIFF] ✅ Initialization success. InClient:', liff.isInClient());
    if (!liff.isLoggedIn() && !liff.isInClient()) {
      // 外部瀏覽器未登入：可選擇強制登入（生產環境取消註解）
      // liff.login();
      console.warn('[LIFF] Not logged in. Running in external browser mode.');
    }
  } catch (err) {
    // LIFF 初始化失敗不阻斷 App 啟動（確保 Offline 可用性）
    console.error('[LIFF] Initialization failed:', err.message);
  }
};

// 先初始化 LIFF，再掛載 React（確保 getProfile() 可在 App 中安全呼叫）
initLiff().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
