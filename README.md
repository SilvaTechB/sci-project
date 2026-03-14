# SCI Archive — Student Project Archive System

> **Live App:** [sci-project.replit.app](https://sci-project.replit.app)
> **Install Page:** [sci-project.replit.app/install](https://sci-project.replit.app/install)
> **Full Documentation:** [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)

---

## Overview

**SCI Archive** is an academic project management platform built for the **School of Computing & Informatics (SCI)**. It digitises the entire project submission and review workflow — from student submission through lecturer review to final archiving.

Students register, create project submissions, and upload documents (PRD, SDD, Final Report, Poster) with real-time progress tracking. Lecturers see all submissions on a unified dashboard and can approve or reject them with written feedback. Approved projects are permanently archived and searchable by all users.

The app is distributed as an **installable app** hosted at [sci-project.replit.app](https://sci-project.replit.app) and as a **native Android APK** built via Capacitor. Opening the link in a browser shows a mandatory install prompt — the app must be installed to the home screen before it can be used.

---

## How the App Works

### Student Flow
1. **Install** the app from [sci-project.replit.app](https://sci-project.replit.app) (tap Install App or follow the on-screen guide for your device)
2. **Register** at `/register` — choose Student role, enter full name, email, and registration number (e.g. `ITE/D/01-06605/2023`). The system validates eligibility based on year automatically.
3. **Dashboard** at `/student` — view all project submissions with status badges (Pending · Approved · Rejected).
4. **Create a Project** — enter project title, description, and assign a lecturer.
5. **Upload Documents** — open the Upload Center from any project card and upload required documents (PRD, SDD) and optional ones (Final Report, Poster). Files upload with live progress percentage.
6. **Track Status** — check back as your lecturer reviews and actions your submission.

### Lecturer Flow
1. **Install** the app and register or sign in as Lecturer.
2. **Dashboard** at `/lecturer` — see every student submission filterable by status.
3. **Review a Project** — tap a project card to see full details, uploaded documents, and comments.
4. **Approve or Reject** — add written feedback when rejecting. Approved projects move to the Archive.
5. **User Management** at `/users` — view all registered students and staff.

### Archive
The `/archive` route is accessible to all signed-in users. It displays all approved projects with search and filter capabilities.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| UI | shadcn/ui + Tailwind CSS |
| State / Data | TanStack Query v5 |
| Backend / DB | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email + password) |
| File Storage | Supabase Storage (`project-documents` bucket) |
| Install / Offline | Service Worker + PWA Manifest |
| Mobile shell | Capacitor v8 (Android APK) |
| Hosting | Replit Static Deployment |
| APK CI | Codemagic (`codemagic.yaml`) |

---

## Running Locally

### Prerequisites
- Node.js v22+
- A Supabase project with the schema from [`supabase/migrations/`](supabase/migrations/)

### Setup

```bash
git clone https://github.com/SilvaTechB/sci-project
cd sci-project
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://ojpaaybtjzpuhfurdxom.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=ojpaaybtjzpuhfurdxom
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). The install wall is bypassed in dev mode when opened in a browser tab (standalone check only triggers after a real PWA install).

---

## Deployment on Replit

1. Open the Replit project
2. Click the **Deploy** button (ship icon) in the toolbar
3. Replit runs `npm run build` and publishes `dist/`
4. Live at `https://sci-project.replit.app`

To update: click **Deploy** again after making changes.

---

## APK Build (Android)

Visit [sci-project.replit.app/install](https://sci-project.replit.app/install) for the APK page.

### Codemagic (Recommended — Free)

1. Push code to GitHub (`SilvaTechB/sci-project`)
2. Sign up at [codemagic.io](https://codemagic.io) → Add application → select this repo → choose **codemagic.yaml**
3. Add three environment variables in Codemagic → Environment variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_PROJECT_ID
   ```
4. Click **Start new build** — wait ~10 minutes
5. Download `app-debug.apk` from Artifacts
6. Optionally set `VITE_APK_DOWNLOAD_URL` in Replit Secrets to activate the direct download button on `/install`

### Installing the APK on Android

1. Transfer the APK to your phone (USB, Google Drive, email)
2. Settings → Security → **Allow from Unknown Sources**
3. Tap the APK file → Install → Open **SCI Archive**

---

## Project Structure

```
sci-project/
├── src/
│   ├── components/
│   │   ├── PWAInstallWall.tsx     # Mandatory install screen
│   │   ├── MobileNav.tsx          # Bottom navigation
│   │   ├── UploadCenter.tsx       # Document upload sheet
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.tsx            # Auth context + Supabase session
│   │   └── usePWAInstall.tsx      # PWA install prompt hook
│   ├── pages/
│   │   ├── Index.tsx              # Landing page (/)
│   │   ├── Install.tsx            # APK download (/install)
│   │   ├── Login.tsx              # Sign in (/login)
│   │   ├── Register.tsx           # Create account (/register)
│   │   ├── StudentDashboard.tsx   # Student home (/student)
│   │   ├── LecturerDashboard.tsx  # Lecturer home (/lecturer)
│   │   ├── Archive.tsx            # Approved projects (/archive)
│   │   ├── Settings.tsx           # Profile settings (/settings)
│   │   └── UserManagement.tsx     # User list (/users)
│   ├── lib/
│   │   ├── storageUploadWithProgress.ts  # XHR + SDK fallback upload
│   │   ├── fileValidation.ts             # MIME and size checks
│   │   └── regNoValidation.ts            # Registration number validator
│   └── App.tsx
├── public/
│   ├── sw.js                  # Service worker (offline + installability)
│   ├── manifest.json          # PWA manifest
│   ├── favicon.png            # Browser icon
│   ├── icon-192.png           # PWA icon (small)
│   ├── icon-512.png           # PWA icon (large)
│   └── apple-touch-icon.png   # iOS home screen
├── android/                   # Capacitor Android project
├── capacitor.config.ts
├── codemagic.yaml             # Codemagic APK CI config
├── index.html
└── docs/
    └── DOCUMENTATION.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `VITE_APK_DOWNLOAD_URL` | No | Direct APK download URL (activates button on `/install`) |

---

## Roles & Permissions

| Action | Student | Lecturer |
|--------|---------|----------|
| Submit project | ✅ 3rd/5th year only | ❌ |
| Upload documents | ✅ own projects only | ❌ |
| View own projects | ✅ | — |
| View all projects | ❌ | ✅ |
| Approve / Reject | ❌ | ✅ |
| Add feedback | ❌ | ✅ |
| View archive | ✅ | ✅ |
| Manage users | ❌ | ✅ |

All permissions are enforced by **Row Level Security** in Supabase PostgreSQL.

---

## Registration Number Format

```
COURSE/LEVEL/NUMBER/YEAR
```

Example: `ITE/D/01-06605/2023`

The year segment is used to calculate year of study and submission eligibility (3rd-year or 5th-year students only).

---

*Built for SCI Final Year Projects · Hosted on Replit · March 2026*
