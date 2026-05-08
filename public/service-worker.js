/**
 * ANTIGRAVITY STITCH - Service Worker
 * 實作背景同步 (Background Sync) 與離線快取
 */

const CACHE_NAME = 'ag-stitch-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// --- 背景同步 (Background Sync) ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'ag-sync-data') {
    event.waitUntil(syncFarmerRecords());
  }
});

/**
 * 自動同步邏輯：從 IndexedDB 或 Storage 讀取任務並回傳
 */
async function syncFarmerRecords() {
  console.log('[SW] Background Sync Triggered: Attempting to flush offline queue...');
  // 這裡會觸發與前端 useOfflineQueue 的連動邏輯
}
