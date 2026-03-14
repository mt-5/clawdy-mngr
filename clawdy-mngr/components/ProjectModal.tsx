'use client';

import { useState, useEffect, useRef } from 'react';
import { Project, useStore } from '@/lib/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

const EMOJI_OPTIONS = ['📁', '🚀', '💡', '🎯', '🔧', '📝', '🎨', '⚡', '🔥', '💻', '🌟', '🎮'];

export default function ProjectModal({ isOpen, onClose, project }: Props) {
  const { setProjects, projects } = useStore();
  const [name, setName] = useState(project?.name || '');
  const [emoji, setEmoji] = useState(project?.emoji || '📁');
  const [description, setDescription] = useState(project?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setEmoji(project.emoji);
      setDescription(project.description || '');
    } else {
      setName('');
      setEmoji('📁');
      setDescription('');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (project) {
        // Update
        const res = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, emoji, description }),
        });
        const updated = await res.json();
        setProjects(projects.map(p => p.id === project.id ? updated : p));
      } else {
        // Create
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, emoji, description }),
        });
        const newProject: Project = await res.json();
        setProjects([...projects, newProject]);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !confirm('Delete this project? All tasks will be lost.')) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== project.id));
      onClose();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
              placeholder="Project name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg ${
                    emoji === e ? 'bg-zinc-700 ring-2 ring-blue-500' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 h-20 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2 font-medium"
            >
              {isLoading ? 'Saving...' : project ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
          {project && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full mt-3 text-red-400 hover:text-red-300 text-sm py-2"
            >
              Delete Project
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
