'use client';

interface Props {
  taskId: string;
  onRevert: () => void;
}

export default function RevertAIButton({ taskId, onRevert }: Props) {
  const handleRevert = async () => {
    if (!confirm('Revert AI changes and move to Todo?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/revert`, { method: 'POST' });
      if (res.ok) {
        onRevert();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revert');
      }
    } catch (err) {
      console.error('Revert error:', err);
    }
  };

  return (
    <button
      onClick={handleRevert}
      className="text-xs text-purple-400 hover:text-purple-300"
    >
      ↩ Revert AI
    </button>
  );
}
