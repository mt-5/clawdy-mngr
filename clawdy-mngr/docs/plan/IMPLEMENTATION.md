# Implementation Plan: clawdy-mngr

## Phase 1: Foundation (Steps 1-5)

**1. Initialize Next.js Project**
- Run `npx create-next-app@latest clawdy-mngr --typescript --tailwind --app`
- Add shadcn/ui: `npx shadcn@latest init`
- Acceptance: App runs on localhost:3000, Tailwind works, shadcn components available

**2. Setup SQLite + Drizzle**
- Install: `npm i drizzle-orm better-sqlite3` + `npm i -D drizzle-kit`
- Create `lib/db.ts` with schema from PDR
- Add seed script for initial data
- Acceptance: DB initializes, tables created, basic queries work

**3. Create API Routes**
- Setup: `/app/api/projects/route.ts`
- Endpoints: CRUD for projects, tasks, requirements, AI
- Acceptance: All API endpoints return valid JSON, work with curl

**4. Build Basic UI Layout**
- Header with project dropdown, settings icon
- Kanban board with 4 columns (Backlog, Todo, In Progress, Done)
- Responsive layout (mobile horizontal scroll)
- Acceptance: UI loads, shows columns, responsive on mobile

**5. Connect UI to API**
- Fetch projects/tasks from API
- Zustand store for state
- Acceptance: Data from DB shows in UI

## Phase 2: Core Features (Steps 6-12)

**6. Project Management**
- Create/delete/archive projects
- Project dropdown selector works
- Emoji picker for projects
- Acceptance: Can create project, switch between projects, delete works

**7. Task CRUD**
- Create task modal (title, description, requirement link)
- Edit task modal
- Delete task with confirmation
- Acceptance: Can create/edit/delete tasks, data persists

**8. Drag and Drop**
- Install @dnd-kit/core @dnd-kit/sortable
- Drag between columns
- Reorder within column
- Position saves to DB
- Acceptance: Can drag task between all columns, order persists after refresh

**9. Requirements System**
- Create/edit/delete requirements per project
- Link requirement to task in modal
- Requirement badge on task card
- Acceptance: Requirements show on tasks, badge displays status

**10. WYSIWYG Editor**
- Install: @tiptap/react or similar
- Markdown support in task description
- Clean, slick UI
- Acceptance: Can edit task description with rich text, saves to DB

**11. AI Status Display**
- Global status in header corner
- Per-task status on card
- Status states: Idle, Working, Error
- Acceptance: Status shows on UI, updates in real-time

**12. Offline Page**
- Detect offline via navigator.onLine
- Show nice offline page with illustration
- Auto-reconnect when online
- Acceptance: Offline shows custom page, returns to app when online

## Phase 3: AI Integration (Steps 13-16)

**13. AI Subagent Trigger**
- Manual trigger button
- Cron job checks Todo column periodically
- Picks highest priority task (lowest position)
- Acceptance: Subagent picks task from Todo, updates status to Working

**14. AI Context API**
- Endpoint returns project context for subagent
- Include: project info, all tasks, requirements, docs/plan content
- Acceptance: API returns full context JSON

**15. Stop Subagent**
- Kill button in UI
- API endpoint to stop running subagent
- Task stays in In Progress for manual review
- Acceptance: Can stop subagent mid-work

**16. Revert AI Task**
- Store snapshot before AI changes
- Revert button on AI-modified tasks
- Restores title/description, moves to Todo
- Acceptance: Revert restores task to pre-AI state

## Phase 4: AI Testing (Steps 17-18)

**17. AI Requirement Testing**
- When task moves to Done, trigger AI test
- AI checks if requirement fulfilled
- Update requirement status: pending → fulfilled/failed
- Block Done if requirement not fulfilled
- Acceptance: Task cannot move to Done without fulfilled requirement

**18. Test Results Display**
- Show test result on requirement
- Failed tests show reason
- Acceptance: Can see AI test results on requirements

## Phase 5: Polish (Steps 19-20)

**19. Slick Design**
- Polish with shadcn/ui components
- Smooth animations
- Dark theme as default
- Acceptance: UI looks modern, polished, matches PDR colors

**20. Dockerize**
- Dockerfile with Next.js build
- docker-compose.yml
- Volume for SQLite data
- Bind to 127.0.0.1:3000
- Acceptance: Builds to Docker image, runs on Pi via Tailscale

---

## Step Dependencies

- 1 → 2 → 3 → 4 → 5
- 5 → 6 → 7 → 8
- 6 → 9
- 7 → 10
- 8 + 10 → 11
- 11 → 12
- 5 + 9 → 13 → 14 → 15 → 16
- 16 → 17 → 18
- All → 19 → 20
