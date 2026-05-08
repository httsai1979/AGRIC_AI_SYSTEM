import { useState, useEffect, useCallback } from 'react';
import { stitchApi } from '../services/stitchApi';

/**
 * useOfflineQueue - 安全確信持久化隊列
 * 具備數據完整性檢查 (Integrity Check) 機制
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('ag_persistent_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('ag_persistent_queue', JSON.stringify(queue));
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
   * 核心同步引擎：包含數據防竄改檢查
   */
  const processQueue = async () => {
    if (isSyncing || queue.length === 0) return;
    setIsSyncing(true);
    
    const task = queue[0];

    try {
      // 1. 執行數據完整性二次校驗 (防竄改檢查)
      const isValid = await stitchApi.verifyIntegrity(task.data);
      
      if (!isValid) {
        console.error(`[SECURITY_ALERT] Task ${task.id} data tampered! Locking record.`);
        // 標註為竄改並從主隊列移除
        const tampered = JSON.parse(localStorage.getItem('ag_tampered_vault') || '[]');
        localStorage.setItem('ag_tampered_vault', JSON.stringify([...tampered, { ...task, status: 'DATA_TAMPERED' }]));
        setQueue(prev => prev.filter(t => t.id !== task.id));
        setIsSyncing(false);
        return;
      }

      // 2. 只有校驗通過才允許上傳
      const result = await stitchApi.submitData(task.data);
      if (result.success) {
        setQueue(prev => prev.filter(t => t.id !== task.id));
      }
    } catch (err) {
      console.warn("[OFFLINE_QUEUE] Sync suspended due to error.");
    } finally {
      setIsSyncing(false);
    }
  };

  return { queue, addToQueue, processQueue, isSyncing };
};
