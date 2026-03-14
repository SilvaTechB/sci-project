# SCI Archive — Student Project Archive System

> **Live App:** [sci-project.replit.app](https://sci-project.replit.app)  
> **Install Page:** [sci-project.replit.app/install](https://sci-project.replit.app/install)  
> **Full Documentation:** [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)

---

## Overview

**SCI Archive** is a full-stack academic project management platform built for the **School of Computing & Informatics (SCI)**. It digitises the entire project submission and review workflow — from initial student submission through lecturer review to final archiving.

Students can register, create project submissions, and upload documents (PRD, SDD, Final Report, Poster) with real-time upload progress tracking. Lecturers see all submissions on a unified dashboard and can approve or reject them with written feedback. Approved projects are permanently archived and searchable by all users.

The system is deployed as a **Progressive Web App** at [sci-project.replit.app](https://sci-project.replit.app) and packaged as a **native Android app** via Capacitor.

---

## Screenshots

| Home | Login | Register |
|------|-------|----------|
| ![Home](docs/screenshots/home.png) | ![Login](docs/screenshots/login.png) | ![Register](docs/screenshots/register.png) |

| Student Dashboard | Upload Center | Lecturer Dashboard |
|-------------------|---------------|-------------------|
| ![Student](docs/screenshots/student-dashboard.png) | ![Upload](docs/screenshots/upload.png) | ![Lecturer](docs/screenshots/lecturer-dashboard.png) |

> See the live app at [sci-project.replit.app](https://sci-project.replit.app) for the full experience.

---

## How the App Works

### Student Flow
1. **Register** at `/register` — choose Student role, enter full name, registration number (e.g. `ITE/D/01-06605/2023`), year of study (3rd or 5th), and department. The system automatically validates eligibility based on year.
2. **Dashboard** at `/student` — view all your project submissions with status badges (Pending · Under Review · Approved · Rejected).
3. **Create a Project** — fill in project title, description, department, and supervisor name.
4. **Upload Documents** — open Upload Center from any project card and upload required documents (Project Proposal, SDD) and optional documents (Final Report, Poster). Files are uploaded via XHR with live progress percentage, with automatic SDK fallback on mobile.
5. **Track Status** — check back as your lecturer reviews your submission.

### Lecturer Flow
1. **Register or sign in** as Lecturer.
2. **Dashboard** at `/lecturer` — see every student submission across all departments, filterable by status.
3. **Review a Project** — tap a project card to see full details, uploaded documents, and student comments.
4. **Approve or Reject** — add written feedback when rejecting. Approved projects move to the Archive.
5. **User Management** at `/users` — view all registered users.

### Archive
The `/archive` route is accessible to all authenticated users. It displays all approved projects with search and filter capabilities, providing an institutional reference library.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 (BrowserRouter) |
| UI | shadcn/ui + Tailwind CSS |
| State / Data | TanStack Query v5 |
| Backend / DB | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (project-documents bucket) |
| Mobile | Capacitor v7 (Android + iOS shell) |
| Hosting | Replit Static Deployment |
| CI / APK Build | Codemagic (codemagic.yaml) |

---

## Running Locally

### Prerequisites
- Node.js v22+
- A Supabase project with the schema from [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)

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

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

---

## Deployment on Replit

The app is deployed as a **static site** on Replit — no server required at runtime (Supabase handles all backend logic).

1. Open the Replit project
2. Click the **Deploy** button (ship icon) in the top toolbar
3. Replit runs `npm run build` and publishes the `dist/` folder
4. Live at `https://sci-project.replit.app`

To update: click **Deploy** again after making changes.

---

## APK Download

Visit [sci-project.replit.app/install](https://sci-project.replit.app/install) for the APK download page with step-by-step installation instructions.

### Building the APK (Free — Codemagic)

APK compilation requires the Android SDK toolchain which is not available in Replit. Use **Codemagic**, a free cloud CI service:

1. Push latest code to GitHub (`SilvaTechB/sci-project`)
2. Sign up at [codemagic.io](https://codemagic.io) with your GitHub account
3. Add application → select your repo → choose **codemagic.yaml**
4. Add three environment variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_PROJECT_ID
   ```
5. Click **Start new build** — wait ~10 minutes
6. Download `app-debug.apk` from **Artifacts**
7. Optionally: add `VITE_APK_DOWNLOAD_URL=<your-apk-url>` to Replit Secrets to activate the direct download button on `/install`

### Installing on Android

1. Transfer the APK to your Android phone (USB, Google Drive, email)
2. Settings → Security → **Allow from Unknown Sources**
3. Tap the APK file to install
4. Open **SCI Archive** and sign in

### Alternatively: Local Build with Android Studio

```bash
npm run build
npx cap sync android
# Open android/ folder in Android Studio
# Build → Build APK(s)
```

The APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Project Structure

```
sci-project/
├── src/
│   ├── components/           # Reusable components
│   │   ├── MobileNav.tsx     # Bottom navigation (student/lecturer)
│   │   ├── UploadCenter.tsx  # Document upload sheet
│   │   ├── DashboardStats.tsx
│   │   └── ui/               # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx         # Landing page (/)
│   │   ├── Install.tsx       # APK download page (/install)
│   │   ├── Login.tsx         # Sign in (/login)
│   │   ├── Register.tsx      # Create account (/register)
│   │   ├── StudentDashboard.tsx  # Student home (/student)
│   │   ├── LecturerDashboard.tsx # Lecturer home (/lecturer)
│   │   ├── Archive.tsx       # Approved projects (/archive)
│   │   ├── Settings.tsx      # Profile settings (/settings)
│   │   └── UserManagement.tsx    # User list (/users)
│   ├── hooks/
│   │   ├── useAuth.tsx       # Auth context + Supabase session
│   │   └── useUploadQueue.tsx # Upload queue with XHR progress
│   ├── lib/
│   │   ├── storageUploadWithProgress.ts  # XHR + SDK fallback upload
│   │   └── fileValidation.ts  # MIME and size checks
│   └── App.tsx               # Router and layout
├── public/
│   ├── favicon.png           # App icon (1024px master)
│   ├── icon-192.png / icon-512.png  # PWA manifest icons
│   ├── apple-touch-icon.png  # iOS home screen
│   └── manifest.json         # PWA manifest
├── android/                  # Capacitor Android project
│   └── app/src/main/res/mipmap-*/  # App icons (mdpi → xxxhdpi)
├── capacitor.config.ts       # Capacitor: appId, webDir, plugins
├── codemagic.yaml            # CI config for APK builds
├── index.html                # HTML entry with PWA meta tags
└── docs/
    └── DOCUMENTATION.md      # Full user + technical documentation
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `VITE_APK_DOWNLOAD_URL` | No | Direct URL to the compiled APK (activates download button on `/install`) |

---

## Media Upload

Documents are uploaded to the **Supabase Storage** `project-documents` bucket using:

1. **XHR with progress events** — provides real-time percentage feedback
2. **Supabase SDK fallback** — automatically used if XHR fails (e.g. on restricted networks)

Accepted formats: PDF, DOCX, DOC, PPT, PPTX, ZIP (up to 50MB).

File paths follow the pattern: `{userId}/{projectId}/{docType}-{timestamp}-{fileName}`

---

## Roles & Permissions

| Action | Student | Lecturer |
|--------|---------|----------|
| Submit project | ✅ (3rd/5th year only) | ❌ |
| Upload documents | ✅ (own projects only) | ❌ |
| View own projects | ✅ | — |
| View all projects | ❌ | ✅ |
| Approve / Reject | ❌ | ✅ |
| View archive | ✅ | ✅ |
| Manage users | ❌ | ✅ |

All permissions are enforced by **Row Level Security** policies in Supabase PostgreSQL.

---

## Registration Number Format

Students must enter their registration number in the format:

```
COURSE/LEVEL/NUMBER/YEAR
```

Example: `ITE/D/01-06605/2023`

The system uses the registration number to:
- Validate the student's year of study (3rd year = enrolled 2 years ago, 5th year = enrolled 4 years ago)
- Detect the course code automatically

---

## App Icon

The SCI Archive icon shows a **graduation cap over an open book** with a cyan-to-purple gradient on a dark navy background.

Icon files are at all required Android densities:

| Folder | Size | Density |
|--------|------|---------|
| `mipmap-mdpi` | 48×48 px | ~160 dpi |
| `mipmap-hdpi` | 72×72 px | ~240 dpi |
| `mipmap-xhdpi` | 96×96 px | ~320 dpi |
| `mipmap-xxhdpi` | 144×144 px | ~480 dpi |
| `mipmap-xxxhdpi` | 192×192 px | ~640 dpi |

Master source: `attached_assets/app-icon-master.png` (1024×1024).

---

*Built for SCI Final Year Projects · Hosted on Replit · March 2026*
