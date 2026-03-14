# Project Design Record: clawdy-mngr

**Project Name:** clawdy-mngr  
**Type:** Full-stack Web Application  
**Version:** 1.0.0  
**Status:** Draft  
**Date:** 2026-03-14

---

## 1. Overview

### Summary

A self-hosted project management dashboard running on a Raspberry Pi within the Tailscale network. It enables AI-assisted project planning with a Kanban-style interface for mid-to-large projects, featuring automatic task completion via subagents.

### Problem Statement

Planning mid and large projects requires structure, but existing tools lack AI integration for automation and context-aware assistance. Users need a simple, self-hosted solution that combines project management with AI support.

### Goals

1. Provide a visual Kanban-based project tracker
2. Enable multi-project management with easy switching
3. Support drag-and-drop task organization
4. Automate "Todo" tasks via AI subagents
5. Offer PWA capabilities for mobile use
6. Run entirely on local infrastructure (Raspberry Pi)

---

## 2. Technical Stack

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Drag & Drop:** @dnd-kit/core
- **PWA:** next-pwa

### Backend

- **Framework:** Next.js API Routes (Route Handlers)
- **Database:** SQLite with better-sqlite3
- **ORM:** Prisma or Drizzle ORM

### DevOps

- **Containerization:** Docker + Docker Compose
- **Network:** Tailscale (existing setup on Raspberry Pi)

---

## 3. UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ [Logo] clawdy-mngr    [Project Dropdown] [⚙️]  │  <- Header (fixed)
├─────────────────────────────────────────────────┤
│ [Emoji Status Badge]                            │  <- Status Bar
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐ │
│  │ Backlog │ │  Todo   │ │In Progress│ │ Done │ │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├──────┤ │
│  │ [Card]  │ │ [Card]  │ │  [Card]  │ │[Card]│ │
│  │ [Card]  │ │ [Card]  │ │          │ │[Card]│ │
│  │         │ │ [AI 🎯] │ │          │ │      │ │
│  └─────────┘ └─────────┘ └──────────┘ └──────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, horizontal scroll Kanban |
| Tablet | 640-1024px | 2 columns visible |
| Desktop | > 1024px | All 4 columns visible |

### Visual Design

**Color Palette:**

| Role | Color | Hex |
|------|-------|-----|
| Background | Slate 900 | #0f172a |
| Surface | Slate 800 | #1e293b |
| Primary | Amber 500 | #f59e0b |
| Accent | Emerald 500 | #10b981 |
| Text Primary | Slate 100 | #f1f5f9 |
| Text Secondary | Slate 400 | #94a3b8 |
| Danger | Rose 500 | #f43f5e |

**Typography:**

- Font: Inter (sans-serif)
- Headings: 700 weight
- Body: 400 weight
- Sizes: xs (12px), sm (14px), base (16px), lg (20px), xl (24px)

**Spacing:**

- Base unit: 4px
- Card padding: 16px
- Column gap: 16px
- Section margin: 24px

### Components

#### Header

- Logo/App name (left)
- Project dropdown selector (center)
- Settings icon button (right)

#### Project Selector

- Dropdown with search
- Shows project name + emoji
- "Create New Project" option at bottom

#### Status Emoji Badge

- Corner position (top-right of Kanban area)
- Shows current AI status: 🟢 Idle | 🟡 Working | 🔴 Error | ⚪ Offline
- Click to set status manually

#### Kanban Column

- Header with count badge
- Scrollable card container
- Drop zone highlight on drag-over

#### Task Card

- Title (truncated if long)
- Priority indicator (colored left border)
- Tags (optional)
- Drag handle
- Click to expand/edit

#### Task Modal

- Title input
- Description (markdown supported)
- Priority selector (Low/Medium/High/Critical)
- Tags input
- Due date (optional)
- AI task toggle
- Save/Cancel buttons

---

## 4. Data Model

### Database Schema (SQLite)

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  description TEXT,
  status TEXT DEFAULT 'active', -- active, archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog', -- backlog, todo, in_progress, done
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  position INTEGER DEFAULT 0,
  tags TEXT, -- JSON array
  due_date DATETIME,
  is_ai_task INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## 5. API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create new project |
| GET | /api/projects/[id] | Get project details |
| PUT | /api/projects/[id] | Update project |
| DELETE | /api/projects/[id] | Delete project |
| POST | /api/projects/[id]/archive | Archive project |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/[id]/tasks | List tasks for project |
| POST | /api/projects/[id]/tasks | Create new task |
| PUT | /api/tasks/[id] | Update task |
| DELETE | /api/tasks/[id] | Delete task |
| PUT | /api/tasks/reorder | Reorder tasks (bulk) |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/status | Get AI subagent status |
| POST | /api/ai/trigger | Manually trigger subagent |
| GET | /api/ai/context/[projectId] | Get project context for subagent |

---

## 6. Functionality Specification

### 6.1 Project Management

**Create Project:**
- Modal form: name (required), emoji picker, description
- Auto-redirect to new project after creation

**View Projects:**
- Dropdown shows all active projects
- Search/filter by name
- Archived projects hidden by default (toggle to show)

**Delete Project:**
- Confirmation dialog
- Cascades to delete all tasks

**Archive Project:**
- Soft-delete; moves to archived status
- Archived projects don't appear in dropdown

### 6.2 Kanban Board

**Columns:**
1. Backlog - Ideas and unrefined tasks
2. Todo - Refined tasks ready for work
3. In Progress - Currently being worked on
4. Done - Completed tasks

**Drag & Drop:**
- Cards draggable between columns
- Reorder within same column
- Visual feedback: drop zones highlight
- Position saved automatically

### 6.3 Task Management

**Create Task:**
- Quick-add: title only, defaults to Backlog
- Full-add: all fields via modal

**Edit Task:**
- Click card to open modal
- All fields editable

**Delete Task:**
- Delete button in modal
- Confirmation required

**Task Properties:**
- Title (string, required)
- Description (markdown)
- Priority (low/medium/high/critical)
- Tags (array of strings)
- Due date (optional)
- AI task flag (boolean)

### 6.4 AI Subagent Integration

**Automatic Pickup:**
- Cron job checks "Todo" column every X minutes
- Tasks with `is_ai_task = true` are eligible
- Subagent picks up oldest eligible task

**Context Provision:**
- `/api/ai/context/[projectId]` returns:
  - Project name + description
  - Task details
  - Recent completed tasks (for context)
  - Any relevant notes/docs from `/docs/plan/`

**Status Tracking:**
- Subagent updates task status → In Progress
- On completion → Done with timestamp
- Status emoji updates in real-time

**Manual Trigger:**
- Button to force subagent run
- Useful for testing or immediate processing

### 6.5 PWA Features

- Manifest.json with app name, icons
- Service worker for offline caching
- Install prompt on mobile
- Works offline (read-only or queue changes)

---

## 7. Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/db.sqlite
    restart: unless-stopped
```

### Tailscale Access

- App runs on Raspberry Pi (already on Tailscale)
- Access via `http://raspberrypi.local:3000` or Tailscale IP
- No additional config needed

### Development

```bash
# Local dev
npm run dev

# Build for production
npm run build
docker build -t clawdy-mngr .
docker run -p 3000:3000 -v $(pwd)/data:/app/data clawdy-mngr
```

---

## 8. Acceptance Criteria

### Must Have (MVP)

- [ ] Create/select/delete projects via UI
- [ ] Kanban board with 4 columns
- [ ] Create/edit/delete tasks
- [ ] Drag and drop between columns
- [ ] Project dropdown selector works
- [ ] Emoji status badge displays
- [ ] Mobile responsive layout
- [ ] Docker build succeeds
- [ ] App runs on Raspberry Pi

### Should Have

- [ ] PWA installable on mobile
- [ ] AI subagent picks up Todo tasks
- [ ] Drag reorder within column
- [ ] Archive project functionality

### Nice to Have

- [ ] Dark/light theme toggle
- [ ] Task search
- [ ] Keyboard shortcuts
- [ ] Activity log

---

## 9. Future Considerations

- Add subtasks checkboxes
- Time tracking per task
- File attachments
- Comments on tasks
- Email/push notifications
- Multiple board views per project
- Integration with external APIs

---

## 10. Open Questions

1. **AI Task Assignment:** Should subagent pick randomly or by priority?
2. **Context Refresh:** How often should subagent re-fetch project context?
3. **Offline Queue:** How to handle task updates when offline?
4. **Security:** Should there be authentication for local-only access?

---

*PDR Owner: Maciek*  
*Last Updated: 2026-03-14*
