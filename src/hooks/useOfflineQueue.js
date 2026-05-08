import { useState, useEffect, useCallback } from 'react';
import { stitchApi } from '../services/stitchApi';

/**
 * useOfflineQueue - 斷點續傳與離線同步引擎
 * 採用 FIFO 隊列，確保數據在斷電或瀏覽器重啟後能自動回傳
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState(() => {
    // 從持久化空間讀取未完成任務
    const saved = localStorage.getItem('ag_persistent_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // 當隊列變動時，同步回 localStorage
  useEffect(() => {
    localStorage.setItem('ag_persistent_queue', JSON.stringify(queue));
    
    // 若網路恢復且隊列有資料，自動啟動同步
    if (navigator.onLine && queue.length > 0) {
      processQueue();
    }
  }, [queue]);

  const addToQueue = useCallback((captureData) => {
    const taskId = `TASK-${Date.now()}`;
    const newTask = { 
      id: taskId, 
      data: captureData, 
      status: 'pending',
      retryCount: 0 
    };
    setQueue(prev => [...prev, newTask]);
    return taskId;
  }, []);

  /**
   * 核心同步引擎：逐條處理隊列 (FIFO)
   */
  const processQueue = async () => {
    if (isSyncing || queue.length === 0) return;
    
    setIsSyncing(true);
    const activeQueue = [...queue];

    for (const task of activeQueue) {
      try {
        console.log(`[OFFLINE_ENGINE] Attempting Sync: ${task.id}`);
        const result = await stitchApi.submitData(task.data);
        
        if (result.success) {
          // 同步成功，移出隊列
          setQueue(prev => prev.filter(t => t.id !== task.id));
        }
      } catch (err) {
        console.error(`[OFFLINE_ENGINE] Sync Failed for ${task.id}, waiting for next retry.`);
        // 保留任務在隊列中，待下一次網路變化或重啟後重試
        break; 
      }
    }
    setIsSyncing(false);
  };

  return { queue, addToQueue, processQueue, isSyncing };
};
