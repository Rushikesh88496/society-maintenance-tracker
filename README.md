# Society Maintenance Tracker

A full-stack web application for apartment society management — complaint tracking, billing, visitor management, staff administration, document center, and analytics, all in one place.

---

## Tech Stack

| Layer      | Technology                                                                 |
|------------|---------------------------------------------------------------------------|
| Backend    | Node.js, Express, better-sqlite3, JWT (jsonwebtoken), bcryptjs, Nodemailer, Multer |
| Frontend   | React 18, Vite, React Router v6, Tailwind CSS, Recharts, Lucide Icons, Axios |
| Export     | jspdf, jspdf-autotable, xlsx (SheetJS)                                    |
| Deployment | Render.com (render.yaml), persistent SQLite + uploads via `/var/data`     |

---

## Features

1. **Authentication & Authorization** — Register/Login with role-based access (admin, resident, security). JWT tokens with 30-day expiry. Default admin seeded on first run.
2. **Complaint Management** — Full CRUD with status flow: `Open → Assigned → Work Started → In Progress → Resolved → Confirmed` (with `Reopened` from Resolved). Staff assignment, priority levels, photo upload, overdue detection, and SSE live updates on the detail page.
3. **Resident Management** — Admin CRUD for residents, profile view with complaint history, toggle active/disabled status.
4. **Staff Management** — Admin CRUD for staff (Plumber, Electrician, Cleaner, Security, Gardener), workload tracking per staff member, active/inactive toggle.
5. **Billing** — Single and bulk bill generation, payment recording with receipt numbers, CSV export, billing stats summary, cancel/delete bills, billing history.
6. **Visitor Management** — Residents register visitors, admin approves/rejects, security performs check-in/check-out. Full visitor timeline and history logging.
7. **Notifications** — Real-time bell icon with unread count, auto-generated on complaint/bill/notice/visitor events. Mark read, mark all read, delete.
8. **Document Center** — Admin file upload with category and description, search/filter by name/category/type, download.
9. **Analytics Dashboard** — Bar charts, pie charts, line charts (Recharts). Monthly complaint trends, category breakdown, priority breakdown, resolution time, resident growth. CSV/Excel/PDF export.
10. **Notice Board** — Admin posts notices, important notices auto-email all residents and notify via bell.
11. **Settings** — Configurable overdue days threshold.
12. **Dashboard** — Admin dashboard with complaint stats, progress metrics, staff workload. Resident dashboard with own complaints.

---

## Folder Structure

```
society/
├── backend/
│   ├── server.js              # All API routes (~2000 lines), SSE, email, middleware
│   ├── database.js            # Schema, migrations, seed
│   ├── package.json
│   ├── .env                   # Environment config (not committed)
│   └── uploads/               # Uploaded files (photos, documents)
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Route definitions
│   │   ├── index.css          # Tailwind + custom utility classes
│   │   ├── main.jsx           # Entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── constants.js   # Shared badges, colors, helpers
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ComplaintTimeline.jsx
│   │   │   ├── ProgressStepper.jsx
│   │   │   ├── Skeletons.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── charts/
│   │   │       ├── BarChart.jsx
│   │   │       ├── PieChart.jsx
│   │   │       └── LineChart.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── NotFound.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminComplaints.jsx
│   │       ├── AdminResidents.jsx
│   │       ├── AdminResidentProfile.jsx
│   │       ├── AdminStaff.jsx
│   │       ├── AdminStaffProfile.jsx
│   │       ├── AdminBilling.jsx
│   │       ├── AdminVisitors.jsx
│   │       ├── AdminAnalytics.jsx
│   │       ├── DocumentCenter.jsx
│   │       ├── ResidentDashboard.jsx
│   │       ├── ResidentBills.jsx
│   │       ├── ResidentVisitors.jsx
│   │       ├── ComplaintDetail.jsx
│   │       ├── RaiseComplaint.jsx
│   │       ├── NoticeBoard.jsx
│   │       ├── Receipt.jsx
│   │       └── SecurityVisitors.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .env.example
├── render.yaml
├── .gitignore
├── package.json                # Root scripts (concurrently)
└── README.md
```

---

## Installation

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **npm** v9+
- **Gmail App Password** (for email notifications — optional)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/society-maintenance-tracker.git
cd society-maintenance-tracker

# 2. Install root dependencies
npm install

# 3. Install all sub-dependencies at once
npm run install-all
# This runs: npm install && cd backend && npm install && cd ../frontend && npm install

# 4. Set up environment variables
cp .env.example backend/.env
# Edit backend/.env with your values (see Environment Variables below)

# 5. Done! Database initializes and admin seeds automatically on first start.
```

---

## Running Locally

```bash
# Start both backend and frontend in development mode
npm run dev
```

This runs concurrently:
- **Backend** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173` (Vite dev server with proxy)

### Individual Commands

```bash
# Backend only (with auto-restart)
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Production build
npm run build      # Builds frontend
npm start          # Starts backend server
```

---

## Default Admin Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@society.com` |
| Password | `admin123`          |

> **Important:** Change the admin password and `JWT_SECRET` before deploying to production.

---

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# JWT Secret — change this in production!
JWT_SECRET=your-super-secret-key-change-this-in-production

# Email Configuration (Nodemailer with Gmail)
# Get App Password from: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

| Variable    | Required | Default              | Description                              |
|-------------|----------|----------------------|------------------------------------------|
| `PORT`      | No       | `5000`               | Backend server port                      |
| `NODE_ENV`  | No       | `development`        | Environment mode                         |
| `JWT_SECRET`| **Yes**  | —                    | Secret key for JWT signing               |
| `SMTP_HOST` | No       | `smtp.gmail.com`     | SMTP server host                         |
| `SMTP_PORT` | No       | `587`                | SMTP server port                         |
| `SMTP_USER` | No       | —                    | SMTP username (email address)            |
| `SMTP_PASS` | No       | —                    | SMTP password (app password for Gmail)   |

---

## API Documentation

All endpoints are prefixed with `/api`. Most require a Bearer token in the `Authorization` header.

### Authentication

| Method | Endpoint                  | Auth  | Description                          |
|--------|---------------------------|-------|--------------------------------------|
| POST   | `/api/auth/register`      | None  | Register a new user (resident/security) |
| POST   | `/api/auth/login`         | None  | Login and receive JWT token          |
| GET    | `/api/auth/me`            | Token | Get current authenticated user       |

### Complaints

| Method | Endpoint                              | Auth  | Description                                      |
|--------|---------------------------------------|-------|--------------------------------------------------|
| POST   | `/api/complaints`                     | Token | Create a complaint (resident, with photo upload) |
| GET    | `/api/complaints`                     | Token | List complaints (own for resident, all for admin)|
| GET    | `/api/complaints/:id`                 | Token | Get single complaint with history                |
| PUT    | `/api/complaints/:id/status`          | Admin | Update status/priority/assignment                |
| PUT    | `/api/complaints/:id/confirm`         | Token | Resident confirms or rejects resolution          |
| POST   | `/api/complaints/check-overdue`       | Admin | Check and mark overdue complaints                |
| GET    | `/api/complaints/:id/available-staff` | Admin | Get list of active staff for assignment          |
| GET    | `/api/complaints/:id/stream`          | Token | SSE endpoint for live complaint updates          |

### Complaint Status Flow

```
Open → Assigned → Work Started → In Progress → Resolved → Confirmed
                                         ↑           ↓
                                     Reopened ←──────┘
```

### Notice Board

| Method | Endpoint           | Auth  | Description                             |
|--------|--------------------|-------|-----------------------------------------|
| GET    | `/api/notices`     | None  | Get all notices (public)                |
| POST   | `/api/notices`     | Admin | Create notice (important → emails all residents) |
| DELETE | `/api/notices/:id` | Admin | Delete a notice                        |

### Dashboard

| Method | Endpoint        | Auth  | Description                                |
|--------|-----------------|-------|--------------------------------------------|
| GET    | `/api/dashboard`| Admin | Dashboard stats, staff workload, trends    |

### Admin — Residents

| Method | Endpoint                           | Auth  | Description                         |
|--------|------------------------------------|-------|-------------------------------------|
| GET    | `/api/admin/residents`             | Admin | List residents with search/filters  |
| GET    | `/api/admin/residents/:id`         | Admin | Get resident profile with complaints|
| PUT    | `/api/admin/residents/:id`         | Admin | Edit resident details               |
| PUT    | `/api/admin/residents/:id/toggle-status` | Admin | Toggle active/disabled        |
| DELETE | `/api/admin/residents/:id`         | Admin | Delete a resident                   |

### Admin — Staff

| Method | Endpoint                       | Auth  | Description                           |
|--------|--------------------------------|-------|---------------------------------------|
| GET    | `/api/admin/staff`             | Admin | List staff with search/filters        |
| GET    | `/api/admin/staff/:id`         | Admin | Get staff profile with assigned complaints |
| POST   | `/api/admin/staff`             | Admin | Create staff member                   |
| PUT    | `/api/admin/staff/:id`         | Admin | Edit staff member                     |
| PUT    | `/api/admin/staff/:id/toggle-status` | Admin | Toggle active/disabled          |
| DELETE | `/api/admin/staff/:id`         | Admin | Delete staff member                   |

### Billing

| Method | Endpoint                    | Auth  | Description                                |
|--------|-----------------------------|-------|--------------------------------------------|
| GET    | `/api/bills`                | Token | List bills (own for resident, all for admin) |
| GET    | `/api/bills/stats/summary`  | Admin | Billing summary statistics                 |
| GET    | `/api/bills/export/csv`     | Admin | Export bills as CSV                         |
| GET    | `/api/bills/:id`            | Token | Get single bill with history               |
| POST   | `/api/bills`                | Admin | Generate bill(s) — single or bulk          |
| PUT    | `/api/bills/:id`            | Admin | Edit bill details                          |
| PUT    | `/api/bills/:id/pay`        | Admin | Mark bill as paid (generates receipt number)|
| PUT    | `/api/bills/:id/cancel`     | Admin | Cancel a bill                              |
| DELETE | `/api/bills/:id`            | Admin | Delete a bill                              |

### Visitors

| Method | Endpoint                        | Auth         | Description                        |
|--------|---------------------------------|--------------|------------------------------------|
| GET    | `/api/visitors`                 | Token        | List visitors (role-filtered)      |
| GET    | `/api/visitors/stats/summary`   | Admin/Security | Visitor statistics               |
| GET    | `/api/visitors/:id`             | Token        | Get single visitor with history    |
| POST   | `/api/visitors`                 | Token        | Register a visitor (resident)      |
| PUT    | `/api/visitors/:id/approve`     | Admin        | Approve a pending visitor          |
| PUT    | `/api/visitors/:id/reject`      | Admin        | Reject a pending visitor           |
| PUT    | `/api/visitors/:id/checkin`     | Security     | Check-in an approved visitor       |
| PUT    | `/api/visitors/:id/checkout`    | Security     | Check-out a checked-in visitor     |
| DELETE | `/api/visitors/:id`             | Token        | Delete visitor (pending only for residents) |

### Visitor Status Flow

```
Pending → Approved → Checked-In → Checked-Out
   ↓
Rejected
```

### Notifications

| Method | Endpoint                      | Auth  | Description                    |
|--------|-------------------------------|-------|--------------------------------|
| GET    | `/api/notifications`          | Token | Get notifications (50 latest)  |
| GET    | `/api/notifications/unread-count` | Token | Get unread count (lightweight) |
| PUT    | `/api/notifications/:id/read` | Token | Mark single notification read  |
| PUT    | `/api/notifications/read-all` | Token | Mark all as read               |
| DELETE | `/api/notifications/:id`      | Token | Delete a notification          |

### Document Center

| Method | Endpoint              | Auth  | Description                     |
|--------|-----------------------|-------|---------------------------------|
| POST   | `/api/documents`      | Admin | Upload document (file + metadata)|
| GET    | `/api/documents`      | Token | List/search documents           |
| GET    | `/api/documents/:id`  | Token | Get single document             |
| DELETE | `/api/documents/:id`  | Admin | Delete document and file        |

### Analytics

| Method | Endpoint                              | Auth  | Description                            |
|--------|---------------------------------------|-------|----------------------------------------|
| GET    | `/api/analytics/summary`              | Admin | Overall summary statistics             |
| GET    | `/api/analytics/monthly-complaints`   | Admin | Monthly complaint trend (12 months)    |
| GET    | `/api/analytics/category-breakdown`   | Admin | Complaints by category with resolution |
| GET    | `/api/analytics/priority-breakdown`   | Admin | Complaints by priority with avg time   |
| GET    | `/api/analytics/resolution-time`      | Admin | Resolution time by category/month      |
| GET    | `/api/analytics/resident-growth`      | Admin | Cumulative resident growth             |

### Settings

| Method | Endpoint            | Auth  | Description          |
|--------|---------------------|-------|----------------------|
| GET    | `/api/settings`     | Admin | Get all settings     |
| PUT    | `/api/settings/:key`| Admin | Update a setting     |

### System

| Method | Endpoint      | Auth | Description    |
|--------|---------------|------|----------------|
| GET    | `/api/health` | None | Health check   |

---

## Database Schema

All tables use `TEXT` primary keys (UUIDs) and `DATETIME` columns with SQLite defaults.

### `users`

| Column            | Type      | Constraints                          |
|-------------------|-----------|--------------------------------------|
| id                | TEXT      | PRIMARY KEY                          |
| email             | TEXT      | UNIQUE NOT NULL                      |
| name              | TEXT      | NOT NULL                             |
| password_hash     | TEXT      | NOT NULL                             |
| role              | TEXT      | NOT NULL, CHECK IN ('resident', 'admin', 'security') |
| apartment_number  | TEXT      |                                      |
| phone             | TEXT      |                                      |
| is_active         | INTEGER   | NOT NULL DEFAULT 1                   |
| created_at        | DATETIME  | DEFAULT CURRENT_TIMESTAMP            |
| updated_at        | DATETIME  | DEFAULT CURRENT_TIMESTAMP            |

### `complaints`

| Column               | Type      | Constraints                                         |
|----------------------|-----------|-----------------------------------------------------|
| id                   | TEXT      | PRIMARY KEY                                         |
| resident_id          | TEXT      | NOT NULL, FK → users(id) ON DELETE CASCADE          |
| category             | TEXT      | NOT NULL                                            |
| title                | TEXT      | NOT NULL                                            |
| description          | TEXT      | NOT NULL                                            |
| photo_path           | TEXT      |                                                     |
| status               | TEXT      | NOT NULL DEFAULT 'Open', CHECK IN ('Open','Assigned','Work Started','In Progress','Resolved','Confirmed','Reopened') |
| priority             | TEXT      | NOT NULL DEFAULT 'Medium', CHECK IN ('Low','Medium','High') |
| is_overdue           | INTEGER   | DEFAULT 0                                           |
| assigned_to          | TEXT      | FK → staff(id) ON DELETE SET NULL                   |
| assigned_date        | DATETIME  |                                                     |
| expected_completion  | DATETIME  |                                                     |
| work_started_at      | DATETIME  |                                                     |
| confirmed_at         | DATETIME  |                                                     |
| created_at           | DATETIME  | DEFAULT CURRENT_TIMESTAMP                           |
| resolved_at          | DATETIME  |                                                     |
| updated_at           | DATETIME  | DEFAULT CURRENT_TIMESTAMP                           |

### `complaint_history`

| Column          | Type      | Constraints                                  |
|-----------------|-----------|----------------------------------------------|
| id              | TEXT      | PRIMARY KEY                                  |
| complaint_id    | TEXT      | NOT NULL, FK → complaints(id) ON DELETE CASCADE |
| changed_by      | TEXT      | NOT NULL, FK → users(id) ON DELETE SET NULL  |
| action          | TEXT      | NOT NULL DEFAULT 'status_change'             |
| old_status      | TEXT      |                                              |
| new_status      | TEXT      | NOT NULL                                     |
| old_priority    | TEXT      |                                              |
| new_priority    | TEXT      |                                              |
| old_assigned_to | TEXT      |                                              |
| new_assigned_to | TEXT      |                                              |
| note            | TEXT      |                                              |
| timestamp       | DATETIME  | DEFAULT CURRENT_TIMESTAMP                    |

### `staff`

| Column     | Type     | Constraints                                              |
|------------|----------|----------------------------------------------------------|
| id         | TEXT     | PRIMARY KEY                                              |
| name       | TEXT     | NOT NULL                                                 |
| role       | TEXT     | NOT NULL, CHECK IN ('Electrician','Plumber','Cleaner','Security','Gardener') |
| phone      | TEXT     |                                                          |
| email      | TEXT     |                                                          |
| is_active  | INTEGER  | NOT NULL DEFAULT 1                                       |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |

### `bills`

| Column          | Type     | Constraints                                              |
|-----------------|----------|----------------------------------------------------------|
| id              | TEXT     | PRIMARY KEY                                              |
| resident_id     | TEXT     | NOT NULL, FK → users(id) ON DELETE CASCADE               |
| title           | TEXT     | NOT NULL                                                 |
| description     | TEXT     |                                                          |
| amount          | REAL     | NOT NULL                                                 |
| billing_period  | TEXT     | NOT NULL                                                 |
| due_date        | DATE     | NOT NULL                                                 |
| status          | TEXT     | NOT NULL DEFAULT 'Pending', CHECK IN ('Pending','Paid','Overdue','Cancelled') |
| paid_at         | DATETIME |                                                          |
| paid_amount     | REAL     |                                                          |
| payment_method  | TEXT     |                                                          |
| receipt_number  | TEXT     |                                                          |
| created_by      | TEXT     | NOT NULL, FK → users(id) ON DELETE SET NULL              |
| created_at      | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |
| updated_at      | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |

### `billing_history`

| Column     | Type     | Constraints                                  |
|------------|----------|----------------------------------------------|
| id         | TEXT     | PRIMARY KEY                                  |
| bill_id    | TEXT     | NOT NULL, FK → bills(id) ON DELETE CASCADE   |
| changed_by | TEXT     | NOT NULL, FK → users(id) ON DELETE SET NULL  |
| action     | TEXT     | NOT NULL                                     |
| old_status | TEXT     |                                              |
| new_status | TEXT     |                                              |
| old_amount | REAL     |                                              |
| new_amount | REAL     |                                              |
| note       | TEXT     |                                              |
| timestamp  | DATETIME | DEFAULT CURRENT_TIMESTAMP                    |

### `visitors`

| Column          | Type     | Constraints                                              |
|-----------------|----------|----------------------------------------------------------|
| id              | TEXT     | PRIMARY KEY                                              |
| resident_id     | TEXT     | NOT NULL, FK → users(id) ON DELETE CASCADE               |
| name            | TEXT     | NOT NULL                                                 |
| phone           | TEXT     |                                                          |
| vehicle_number  | TEXT     |                                                          |
| purpose         | TEXT     | NOT NULL                                                 |
| visit_date      | DATE     | NOT NULL                                                 |
| expected_time   | TEXT     |                                                          |
| status          | TEXT     | NOT NULL DEFAULT 'Pending', CHECK IN ('Pending','Approved','Rejected','Checked-In','Checked-Out') |
| approved_by     | TEXT     | FK → users(id) ON DELETE SET NULL                        |
| approved_at     | DATETIME |                                                          |
| rejected_by     | TEXT     | FK → users(id) ON DELETE SET NULL                        |
| rejected_at     | DATETIME |                                                          |
| rejection_reason| TEXT     |                                                          |
| checked_in_at   | DATETIME |                                                          |
| checked_in_by   | TEXT     | FK → users(id) ON DELETE SET NULL                        |
| checked_out_at  | DATETIME |                                                          |
| checked_out_by  | TEXT     | FK → users(id) ON DELETE SET NULL                        |
| created_at      | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |
| updated_at      | DATETIME | DEFAULT CURRENT_TIMESTAMP                                |

### `visitor_history`

| Column      | Type     | Constraints                                  |
|-------------|----------|----------------------------------------------|
| id          | TEXT     | PRIMARY KEY                                  |
| visitor_id  | TEXT     | NOT NULL, FK → visitors(id) ON DELETE CASCADE|
| changed_by  | TEXT     | NOT NULL, FK → users(id) ON DELETE SET NULL  |
| action      | TEXT     | NOT NULL                                     |
| old_status  | TEXT     |                                              |
| new_status  | TEXT     | NOT NULL                                     |
| note        | TEXT     |                                              |
| timestamp   | DATETIME | DEFAULT CURRENT_TIMESTAMP                    |

### `notices`

| Column      | Type     | Constraints                           |
|-------------|----------|---------------------------------------|
| id          | TEXT     | PRIMARY KEY                           |
| title       | TEXT     | NOT NULL                              |
| description | TEXT     | NOT NULL                              |
| is_important| INTEGER  | DEFAULT 0                             |
| created_by  | TEXT     | NOT NULL, FK → users(id) ON DELETE SET NULL |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP             |

### `notifications`

| Column         | Type     | Constraints                                  |
|----------------|----------|----------------------------------------------|
| id             | TEXT     | PRIMARY KEY                                  |
| user_id        | TEXT     | NOT NULL, FK → users(id) ON DELETE CASCADE   |
| type           | TEXT     | NOT NULL                                     |
| title          | TEXT     | NOT NULL                                     |
| message        | TEXT     | NOT NULL                                     |
| reference_id   | TEXT     |                                              |
| reference_type | TEXT     |                                              |
| is_read        | INTEGER  | DEFAULT 0                                    |
| created_at     | DATETIME | DEFAULT CURRENT_TIMESTAMP                    |

> Indexed on `(user_id, is_read, created_at DESC)`

### `documents`

| Column      | Type     | Constraints                           |
|-------------|----------|---------------------------------------|
| id          | TEXT     | PRIMARY KEY                           |
| uploaded_by | TEXT     | NOT NULL, FK → users(id) ON DELETE CASCADE |
| name        | TEXT     | NOT NULL                              |
| file_path   | TEXT     | NOT NULL                              |
| file_type   | TEXT     | NOT NULL                              |
| file_size   | INTEGER  | NOT NULL                              |
| category    | TEXT     | DEFAULT 'General'                     |
| description | TEXT     |                                       |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP             |

> Indexed on `(name, category, file_type)`

### `email_logs`

| Column          | Type     | Constraints                                  |
|-----------------|----------|----------------------------------------------|
| id              | TEXT     | PRIMARY KEY                                  |
| recipient_email | TEXT     | NOT NULL                                     |
| recipient_name  | TEXT     | NOT NULL                                     |
| subject         | TEXT     | NOT NULL                                     |
| type            | TEXT     | NOT NULL                                     |
| complaint_id    | TEXT     | FK → complaints(id) ON DELETE SET NULL       |
| created_at      | DATETIME | DEFAULT CURRENT_TIMESTAMP                    |
| status          | TEXT     | DEFAULT 'sent'                               |

### `settings`

| Column     | Type     | Constraints |
|------------|----------|-------------|
| key        | TEXT     | PRIMARY KEY |
| value      | TEXT     | NOT NULL    |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Default settings:

| Key             | Default Value |
|-----------------|---------------|
| `overdue_days`  | `7`           |
| `smtp_host`     | `smtp.gmail.com` |
| `smtp_port`     | `587`         |
| `smtp_user`     | (empty)       |
| `smtp_pass`     | (empty)       |

---

## Role-Based Access Control

| Feature                  | Admin | Resident | Security |
|--------------------------|:-----:|:--------:|:--------:|
| View dashboard           |   ✅  |    ✅    |    ❌    |
| Create complaint         |   ❌  |    ✅    |    ❌    |
| View own complaints      |   ❌  |    ✅    |    ❌    |
| View all complaints      |   ✅  |    ❌    |    ❌    |
| Update complaint status  |   ✅  |    ❌    |    ❌    |
| Assign staff to complaint|   ✅  |    ❌    |    ❌    |
| Confirm/reject resolution|   ❌  |    ✅    |    ❌    |
| Manage residents (CRUD)  |   ✅  |    ❌    |    ❌    |
| Manage staff (CRUD)      |   ✅  |    ❌    |    ❌    |
| Generate/manage bills    |   ✅  |    ❌    |    ❌    |
| View own bills           |   ❌  |    ✅    |    ❌    |
| View receipt             |   ✅  |    ✅    |    ❌    |
| Register visitor         |   ✅  |    ✅    |    ❌    |
| Approve/reject visitor   |   ✅  |    ❌    |    ❌    |
| Check-in/out visitor     |   ❌  |    ❌    |    ✅    |
| Post notices             |   ✅  |    ❌    |    ❌    |
| View notices             |   ✅  |    ✅    |    ✅    |
| Upload documents         |   ✅  |    ❌    |    ❌    |
| View/download documents  |   ✅  |    ✅    |    ✅    |
| View analytics           |   ✅  |    ❌    |    ❌    |
| Manage settings          |   ✅  |    ❌    |    ❌    |
| View/manage notifications|   ✅  |    ✅    |    ✅    |

---

## Deployment on Render.com

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Create a Render Blueprint (or Web Service)

The project includes a `render.yaml` for one-click deployment:

```yaml
services:
  - type: web
    name: society-maintenance-tracker
    runtime: node
    buildCommand: cd backend && npm install && cd ../frontend && npm run build
    startCommand: node backend/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        scope: secret
      - key: SMTP_USER
        scope: secret
      - key: SMTP_PASS
        scope: secret
      - key: SMTP_HOST
        value: smtp.gmail.com
      - key: SMTP_PORT
        value: "587"
      - key: PORT
        value: "5000"
      - key: DATABASE_PATH
        value: /var/data/society.db
      - key: UPLOADS_PATH
        value: /var/data/uploads
    persistedDirs:
      - path: /var/data
        description: "SQLite database and uploads"
```

### 3. Manual Setup on Render Dashboard

1. Create a new **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Build Command:** `cd backend && npm install && cd ../frontend && npm run build`
   - **Start Command:** `node backend/server.js`
4. Add environment variables in the **Environment** tab:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a strong secret)
   - `SMTP_USER` = (your email)
   - `SMTP_PASS` = (your app password)
5. Add a **Persistent Disk** mounted at `/var/data` for SQLite and uploads
6. Deploy

### 4. Post-Deploy

- The database and default admin account are created automatically on first boot.
- Access your app at `https://your-app-name.onrender.com`
- Login with `admin@society.com` / `admin123` and change the password immediately.

---

## License

MIT
