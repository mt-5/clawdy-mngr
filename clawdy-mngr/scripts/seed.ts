import { db } from '../lib/db-connection';
import { projects, tasks } from '../lib/db';

const seed = async () => {
  // Create a demo project
  const [project] = await db
    .insert(projects)
    .values({
      id: 'demo-1',
      name: 'Demo Project',
      emoji: '🚀',
      description: 'A demo project to get started',
    })
    .returning();

  console.log('Created project:', project);

  // Create some demo tasks
  const demoTasks = await db
    .insert(tasks)
    .values([
      {
        id: 'task-1',
        projectId: project.id,
        title: 'Welcome to clawdy-mngr!',
        description: 'This is your first task. Drag me to another column!',
        status: 'backlog',
        position: 0,
      },
      {
        id: 'task-2',
        projectId: project.id,
        title: 'Try creating a new task',
        description: 'Click the + button to add more tasks',
        status: 'todo',
        position: 0,
      },
      {
        id: 'task-3',
        projectId: project.id,
        title: 'AI will work on me',
        description: 'Tasks in Todo will be picked up by AI',
        status: 'todo',
        position: 1,
      },
      {
        id: 'task-4',
        projectId: project.id,
        title: 'Completed task example',
        status: 'done',
        position: 0,
        completedAt: new Date(),
      },
    ])
    .returning();

  console.log('Created tasks:', demoTasks);
  console.log('Seed completed!');
};

seed().catch(console.error);
