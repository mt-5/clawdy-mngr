'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore, TaskStatus, Task, Project } from '@/lib/store';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectModal from '@/components/ProjectModal';
import TaskModal from '@/components/TaskModal';
import RequirementsModal from '@/components/RequirementsModal';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-zinc-500' },
  { id: 'todo', title: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <h3 className="font-medium text-sm">{task.title}</h3>
      {task.description && (
        <p className="text-zinc-500 text-xs mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      {task.aiModified === 1 && (
        <span className="inline-block mt-2 text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">
          🤖 AI
        </span>
      )}
    </div>
  );
}

function Column({
  id,
  title,
  color,
  tasks,
  onAddTask,
  onTaskClick,
}: {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h2 className="font-semibold">{title}</h2>
          <span className="text-zinc-500 text-sm">({tasks.length})</span>
        </div>
        <button
          onClick={onAddTask}
          className="text-zinc-400 hover:text-white text-xl leading-none"
        >
          +
        </button>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Home() {
  const { projects, tasks, currentProjectId, setProjects, setTasks, setCurrentProjectId, addTask, updateTask } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('backlog');
  const [showRequirements, setShowRequirements] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load projects
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

  // Load tasks when project changes
  useEffect(() => {
    async function loadTasks() {
      if (!currentProjectId) {
        setTasks([]);
        setIsLoading(false);
        return;
      }
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

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const tasksByColumn = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Find which column the task was dropped on
    let newStatus: TaskStatus = activeTask.status;
    let newPosition = activeTask.position;

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
      newPosition = overTask.position;
    } else if (COLUMNS.find((c) => c.id === over.id)) {
      // Dropped on column header
      newStatus = over.id as TaskStatus;
      const columnTasks = tasks.filter((t) => t.status === newStatus);
      newPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1 : 0;
    }

    if (activeTask.status === newStatus && activeTask.position === newPosition) return;

    // Optimistic update
    updateTask(activeTask.id, { status: newStatus, position: newPosition });

    // API call
    try {
      await fetch(`/api/tasks/${activeTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, position: newPosition }),
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      // Reload on error
      if (currentProjectId) {
        const tasksRes = await fetch(`/api/tasks?projectId=${currentProjectId}`);
        setTasks(await tasksRes.json());
      }
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(undefined);
    setDefaultTaskStatus(status);
    setShowTaskModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleCreateTask = async (title: string, description: string) => {
    if (!currentProjectId) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          title,
          description,
          status: defaultTaskStatus,
        }),
      });
      const newTask: Task = await res.json();
      addTask(newTask);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCreateProject = async (name: string, emoji: string, description: string) => {
    // Handled by modal
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

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
            <button
              onClick={() => {
                setEditingProject(undefined);
                setShowProjectModal(true);
              }}
              className="text-zinc-400 hover:text-white text-sm"
            >
              + New
            </button>
            {currentProject && (
              <button
                onClick={() => setShowRequirements(true)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Requirements
              </button>
            )}
            {currentProject && (
              <button
                onClick={() => {
                  setEditingProject(currentProject);
                  setShowProjectModal(true);
                }}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Edit
              </button>
            )}
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
        ) : !currentProjectId ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 mb-4">No project selected</p>
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
            >
              Create Project
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max">
              {COLUMNS.map((column) => (
                <Column
                  key={column.id}
                  {...column}
                  tasks={tasksByColumn[column.id]}
                  onAddTask={() => handleAddTask(column.id)}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl opacity-80">
                  <h3 className="font-medium text-sm">{activeTask.title}</h3>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        project={editingProject}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={editingTask}
        defaultStatus={defaultTaskStatus}
      />

      <RequirementsModal
        isOpen={showRequirements}
        onClose={() => setShowRequirements(false)}
      />
    </div>
  );
}
