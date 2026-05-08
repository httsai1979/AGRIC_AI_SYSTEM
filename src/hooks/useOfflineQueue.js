import { useState, useEffect, useCallback } from 'react';
import { stitchApi } from '../services/stitchApi';

/**
 * useOfflineQueue - 安全持久化隊列
 * 確保具備數位簽章的數據在離線狀態下依然安全
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
    
    // 數據隔離：若地理風險過高，記錄於本地隔離區
    if (captureData.geofence_risk === "LOCATION_MISMATCH") {
      const isolated = JSON.parse(localStorage.getItem('ag_quarantine_queue') || '[]');
      localStorage.setItem('ag_quarantine_queue', JSON.stringify([...isolated, { id: taskId, data: captureData }]));
    }

    const newTask = { 
      id: taskId, 
      data: captureData, 
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    setQueue(prev => [...prev, newTask]);
    return taskId;
  }, []);

  const processQueue = async () => {
    if (isSyncing || queue.length === 0) return;
    setIsSyncing(true);
    
    const task = queue[0];
    try {
      const result = await stitchApi.submitData(task.data);
      if (result.success) {
        setQueue(prev => prev.filter(t => t.id !== task.id));
      }
    } catch (err) {
      console.warn("[OFFLINE_QUEUE] Retry suspended due to network error.");
    } finally {
      setIsSyncing(false);
    }
  };

  return { queue, addToQueue, processQueue, isSyncing };
};
