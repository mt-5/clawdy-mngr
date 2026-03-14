'use client';

import { useState } from 'react';

interface Props {
  projectId?: string;
}

export default function AITriggerButton({ projectId }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Reload tasks
        window.location.reload();
      } else {
        alert(data.error || 'Failed to trigger AI');
      }
    } catch (err) {
      console.error('AI trigger error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTrigger}
      disabled={isLoading || !projectId}
      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
    >
      <span>🤖</span>
      <span>{isLoading ? 'Starting...' : 'AI Work'}</span>
    </button>
  );
}
