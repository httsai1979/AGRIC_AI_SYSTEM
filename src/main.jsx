import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import liff from '@line/liff'
import './index.css'

// --- LIFF 初始化系統 ---
const initLiff = async () => {
  try {
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
    console.log('[LIFF] Initialization success');
    if (!liff.isLoggedIn() && !liff.isInClient()) {
      // 若在外部瀏覽器且未登入，可選擇是否強制登入 (Demo 環境暫不強制)
      console.warn('[LIFF] Not logged in, running in Fallback mode');
    }
  } catch (err) {
    console.error('[LIFF] Initialization failed', err);
  }
};

// 先初始化 LIFF 再掛載 React
initLiff().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});
