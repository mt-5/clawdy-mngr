'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, useStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  defaultStatus?: string;
}

export default function TaskModal({ isOpen, onClose, task, defaultStatus }: Props) {
  const { tasks, updateTask, addTask } = useStore();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      if (task) {
        // Update
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });
        const updated = await res.json();
        updateTask(task.id, updated);
      } else {
        // Create - handled by parent
        onClose();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task?')) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      useStore.getState().removeTask(task.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Title</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="Task title"
            />
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-zinc-400">Description</label>
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {isPreview ? (
              <div className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 min-h-[128px] prose prose-invert prose-sm">
                <ReactMarkdown>{description || '*No description*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 h-32 resize-none"
                placeholder="Supports Markdown"
              />
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 font-medium"
            >
              {isLoading ? 'Saving...' : task ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full mt-3 text-red-400 hover:text-red-300 text-sm py-2"
            >
              Delete Task
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
