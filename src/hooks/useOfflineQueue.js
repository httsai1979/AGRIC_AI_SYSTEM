import { useState, useEffect, useCallback } from 'react';

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('ag_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('ag_offline_queue', JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback((data) => {
    const taskId = `TASK-${Date.now()}`;
    setQueue(prev => [...prev, { id: taskId, data, timestamp: new Date().toISOString() }]);
    return taskId;
  }, []);

  const removeFromQueue = useCallback((taskId) => {
    setQueue(prev => prev.filter(task => task.id !== taskId));
  }, []);

  return { queue, addToQueue, removeFromQueue, isProcessing, setIsProcessing };
};
