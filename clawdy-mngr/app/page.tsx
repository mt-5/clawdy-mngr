'use client';

import { useEffect, useState } from 'react';
import { useStore, TaskStatus, Task, Project } from '@/lib/store';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-zinc-500' },
  { id: 'todo', title: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

export default function Home() {
  const { projects, tasks, currentProjectId, setProjects, setTasks, setCurrentProjectId, addTask } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const projectsRes = await fetch('/api/projects');
        const projectsData: Project[] = await projectsRes.json();
        setProjects(projectsData);
        
        if (projectsData.length > 0 && !currentProjectId) {
          setCurrentProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!currentProjectId) return;
      setIsLoading(true);
      try {
        const tasksRes = await fetch(`/api/tasks?projectId=${currentProjectId}`);
        const tasksData: Task[] = await tasksRes.json();
        setTasks(tasksData);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, [currentProjectId]);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter(t => t.status === col.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleAddTask = async (status: TaskStatus) => {
    if (!currentProjectId) return;
    const title = prompt('Task title:');
    if (!title) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          title,
          status,
        }),
      });
      const newTask: Task = await res.json();
      addTask(newTask);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">🦞 clawdy-mngr</h1>
            <select
              value={currentProjectId || ''}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-zinc-400">
            {currentProject ? `${tasks.length} tasks` : 'No project selected'}
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="p-6 overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-20 text-zinc-400">Loading...</div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                className="w-72 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <h2 className="font-semibold">{column.title}</h2>
                    <span className="text-zinc-500 text-sm">
                      ({tasksByColumn[column.id]?.length || 0})
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="text-zinc-400 hover:text-white text-xl leading-none"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {tasksByColumn[column.id]?.map((task) => (
                    <div
                      key={task.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 cursor-pointer transition-colors"
                    >
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      {task.description && (
                        <p className="text-zinc-500 text-xs mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
