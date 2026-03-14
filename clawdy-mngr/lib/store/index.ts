import { create } from 'zustand';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  requirementId: string | null;
  aiModified: number;
  aiSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface StoreState {
  projects: Project[];
  currentProjectId: string | null;
  tasks: Task[];
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  projects: [],
  currentProjectId: null,
  tasks: [],
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
