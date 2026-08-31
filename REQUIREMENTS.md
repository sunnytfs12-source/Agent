# MSCIT Todo App — Requirements & Installation Guide

## System Requirements

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Node.js  | **22.x or higher** (v26 recommended) | https://nodejs.org |
| npm      | 9.x or higher   | Comes with Node.js |

> **No database server, no C++ build tools needed.** The app uses Node.js's built-in `node:sqlite` module (available since Node 22, fully stable in Node 26). The database is a single file at `backend/data/mscit_todo.db`, created automatically on first run.

---

## Quick Install (Recommended)

Run the setup script from the project root — installs **all** frontend and backend dependencies in one go:

```bat
setup.bat
```

---

## Manual Install

```bash
# 1. Frontend
npm install

# 2. Backend
cd backend
npm install
```

---

## Frontend Dependencies (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^6.29.0 | Client-side routing |
| @tanstack/react-query | ^5.66.0 | Server state & caching |
| axios | ^1.7.9 | HTTP client |
| react-hot-toast | ^2.5.2 | Toast notifications |
| framer-motion | ^12.4.7 | Animations |
| @hello-pangea/dnd | ^17.0.0 | Drag and drop (Kanban) |
| idb | ^8.0.2 | IndexedDB offline cache |
| date-fns | ^4.1.0 | Date formatting |
| bootstrap-icons | ^1.11.3 | Icon set |

### Frontend Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.1.0 | Build tool & dev server |
| typescript | ^5.7.3 | TypeScript compiler |
| @vitejs/plugin-react | ^4.3.4 | Vite React plugin |
| tailwindcss | ^3.4.17 | Utility CSS framework |
| postcss | ^8.5.2 | CSS processing |
| autoprefixer | ^10.4.20 | CSS vendor prefixes |
| @types/react | ^18.3.18 | React TypeScript types |
| @types/react-dom | ^18.3.5 | ReactDOM TypeScript types |
| @types/node | ^22.13.4 | Node TypeScript types |

---

## Backend Dependencies (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.3 | Web server framework |
| `node:sqlite` | built-in | SQLite database — zero install, ships with Node 22+ |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT access & refresh tokens |
| cors | ^2.8.5 | Cross-origin resource sharing |
| helmet | ^7.1.0 | HTTP security headers |
| morgan | ^1.10.0 | HTTP request logger |
| express-rate-limit | ^7.2.0 | Rate limiting |
| express-validator | ^7.0.1 | Request input validation |
| dotenv | ^16.4.5 | Environment variable loader |
| uuid | ^9.0.1 | UUID generation |

### Backend Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.4.5 | TypeScript compiler |
| ts-node | ^10.9.2 | Run TypeScript directly |
| ts-node-dev | ^2.0.0 | Dev server with auto-restart |
| @types/better-sqlite3 | ^7.6.8 | SQLite TypeScript types |
| @types/express | ^4.17.21 | Express TypeScript types |
| @types/bcryptjs | ^2.4.6 | bcryptjs TypeScript types |
| @types/jsonwebtoken | ^9.0.6 | JWT TypeScript types |
| @types/cors | ^2.8.17 | cors TypeScript types |
| @types/morgan | ^1.9.9 | morgan TypeScript types |
| @types/uuid | ^9.0.8 | uuid TypeScript types |
| @types/node | ^22.0.0 | Node TypeScript types |

---

## Database Setup

SQLite requires **zero configuration**. The database file is created automatically when you first start the server.

### 1. Run migration (creates all tables)
```bash
cd backend
npm run db:migrate
```

### 2. Seed the database (creates default admin account)
```bash
npm run db:seed
```

Default admin credentials after seeding:
- **Email:** admin@mscit.dev
- **Password:** Admin@1234

The database file lives at: `backend/data/mscit_todo.db`

To reset everything, just delete that file and re-run migrate + seed.

---

## Running the App

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 — Frontend**
```bash
npm run dev
# App opens at http://localhost:5173
```

---

## Environment Variables

### Frontend (`.env` in project root)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development

# SQLite database file path
DB_PATH=./data/mscit_todo.db

JWT_ACCESS_SECRET=change_this_to_a_long_random_string
JWT_REFRESH_SECRET=change_this_to_another_long_random_string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new account |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/toggle | Toggle complete |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/reorder | Reorder tasks |
| GET | /api/tasks/export/snapshot | Export all tasks |
| GET | /api/tasks/:id/subtasks | List subtasks |
| POST | /api/tasks/:id/subtasks | Create subtask |
| PATCH | /api/tasks/:taskId/subtasks/:subId | Update subtask |
| DELETE | /api/tasks/:taskId/subtasks/:subId | Delete subtask |
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/tags | List tags |
| POST | /api/tags | Create tag |
| DELETE | /api/tags/:id | Delete tag |
| GET | /api/notifications | List notifications |
| PATCH | /api/notifications/:id/read | Mark one read |
| PATCH | /api/notifications/read-all | Mark all read |
| POST | /api/sync/bulk | Sync offline queue |
| GET | /api/admin/dashboard | Admin stats |
| GET | /api/admin/users | List all users |
| POST | /api/admin/users | Create user |
| PUT | /api/admin/users/:id | Update user |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/activity-logs | Activity logs |
| GET | /api/admin/export | System snapshot |
| GET | /api/health | Health check |
