

# Redstimber — Business Management Platform

A modern, hi-tech web app with warm earthy tones for managing tasks, projects, teams, and customer relationships.

## Design System
- **Palette**: Deep forest greens, warm amber/copper accents, soft cream backgrounds, charcoal text — blending earthy warmth with a sleek, modern feel
- **Typography**: Clean sans-serif (Inter), generous spacing
- **Components**: Glass-morphism cards, subtle gradients, smooth transitions
- **Dark/light mode support**

## Pages & Features

### 1. Authentication
- Login / Sign up pages (email + password via Lovable Cloud)
- Clean branded auth screens with the Redstimber logo

### 2. Dashboard (Home)
- Overview cards: open tasks, active projects, recent contacts, team activity
- Quick-action buttons (new task, new project, add contact)
- Activity feed showing recent changes across modules
- Charts: task completion trends, project progress

### 3. Tasks Module
- Kanban board view (To Do / In Progress / Done)
- List view toggle
- Create/edit tasks with title, description, priority, due date, assignee
- Filter by status, priority, assignee

### 4. Projects Module
- Project list with progress bars and status indicators
- Project detail page: linked tasks, team members, timeline
- Create/edit projects with name, description, deadline, team

### 5. CRM / Contacts
- Contact list with search and filters
- Contact detail: name, email, phone, company, notes, interaction history
- Add/edit contacts

### 6. Team Management
- View team members and their roles
- Invite members (future enhancement)

### 7. Sidebar Navigation
- Collapsible sidebar with icons: Dashboard, Tasks, Projects, Contacts, Team, Settings
- User avatar + logout at the bottom

## Backend (Lovable Cloud)
- Auth with email/password
- Database tables: profiles, tasks, projects, contacts, user_roles
- Row-level security so users only see their team's data

## Initial Build Scope
We'll start with auth, the dashboard, and the tasks module as the core — then layer on projects, CRM, and team features.

