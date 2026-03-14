'use client';

import { useState, useEffect } from 'react';

type AIStatus = 'idle' | 'working' | 'error';

interface Props {
  projectId?: string;
}

export default function AIStatusIndicator({ projectId }: Props) {
  const [status, setStatus] = useState<AIStatus>('idle');
  const [currentTask, setCurrentTask] = useState<string | null>(null);

  useEffect(() => {
    // Poll for AI status
    const checkStatus = async () => {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/ai/status?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setCurrentTask(data.taskTitle || null);
        }
      } catch {
        // Ignore errors
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const statusConfig = {
    idle: { color: 'bg-zinc-500', text: 'AI Idle', icon: '💤' },
    working: { color: 'bg-blue-500 animate-pulse', text: 'AI Working', icon: '⚡' },
    error: { color: 'bg-red-500', text: 'AI Error', icon: '❌' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-zinc-400">{config.icon} {config.text}</span>
      {currentTask && status === 'working' && (
        <span className="text-zinc-500 text-xs ml-1 truncate max-w-[150px]">
          → {currentTask}
        </span>
      )}
    </div>
  );
}
