'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'pending' | 'fulfilled' | 'failed';
  testResult: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequirementsModal({ isOpen, onClose }: Props) {
  const { currentProjectId } = useStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && currentProjectId) {
      loadRequirements();
    }
  }, [isOpen, currentProjectId]);

  const loadRequirements = async () => {
    if (!currentProjectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/requirements?projectId=${currentProjectId}`);
      const data: Requirement[] = await res.json();
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProjectId) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, title, description }),
      });
      const newReq: Requirement = await res.json();
      setRequirements([newReq, ...requirements]);
      setTitle('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create requirement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this requirement?')) return;
    
    try {
      await fetch(`/api/requirements/${id}`, { method: 'DELETE' });
      setRequirements(requirements.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete requirement:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-zinc-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Requirements</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Requirement title"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mb-2"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mb-3 h-20 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mb-4 w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg py-2 text-zinc-400"
          >
            + Add Requirement
          </button>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && requirements.length === 0 ? (
            <div className="text-center text-zinc-400 py-4">Loading...</div>
          ) : requirements.length === 0 ? (
            <div className="text-center text-zinc-500 py-4">No requirements yet</div>
          ) : (
            requirements.map((req) => (
              <div key={req.id} className="bg-zinc-800 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(req.status)}`} />
                      <span className="font-medium">{req.title}</span>
                    </div>
                    {req.description && (
                      <p className="text-zinc-500 text-sm mt-1">{req.description}</p>
                    )}
                    {req.testResult && (
                      <p className="text-zinc-400 text-xs mt-2 bg-zinc-900 p-2 rounded">
                        {req.testResult}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="text-zinc-500 hover:text-red-400 text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
