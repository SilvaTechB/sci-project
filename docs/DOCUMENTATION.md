# SCI Archive — Full Documentation

**Version:** 3.0
**Last Updated:** March 2026
**Platform:** Installable App (Android + iOS + Desktop) + Android APK
**Stack:** React 18 · Vite · Supabase · Capacitor · Service Worker

---

## Table of Contents

1. [What is SCI Archive?](#1-what-is-sci-archive)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Features](#3-features)
4. [Installing the App](#4-installing-the-app)
5. [How to Use the App](#5-how-to-use-the-app)
6. [Registration & Login](#6-registration--login)
7. [Hosting & Deployment](#7-hosting--deployment)
8. [Building the Android APK](#8-building-the-android-apk)
9. [Project Structure](#9-project-structure)
10. [Environment Variables](#10-environment-variables)
11. [Database Schema](#11-database-schema)
12. [Security — Row Level Security](#12-security--row-level-security)
13. [App Icon & Assets](#13-app-icon--assets)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What is SCI Archive?

SCI Archive is a secure academic project management system for the **School of Computing & Informatics**. It allows students to submit project documents digitally, and lecturers to review, approve, or reject submissions — all from a single unified platform.

The app is available as:
- An **installable app** at [sci-project.replit.app](https://sci-project.replit.app) (works on Android, iPhone, iPad, and desktop)
- A **native Android APK** built with Capacitor

When someone opens the link in a browser, an install prompt appears immediately. The app must be added to the home screen before it can be used — this ensures students and lecturers always have a consistent, full-screen experience.

---

## 2. User Roles & Permissions

| Action | Student | Lecturer |
|--------|:-------:|:--------:|
| Register / sign in | ✅ | ✅ |
| Create a project submission | ✅ (3rd/5th year) | ❌ |
| Upload documents to a project | ✅ (own projects) | ❌ |
| View own project submissions | ✅ | — |
| View all student submissions | ❌ | ✅ |
| Approve or reject a submission | ❌ | ✅ |
| Add review feedback | ❌ | ✅ |
| View the archive (approved projects) | ✅ | ✅ |
| Manage registered users | ❌ | ✅ |
| Settings (profile, password) | ✅ | ✅ |

> All permissions are enforced at the **database level** using Supabase Row Level Security. The frontend UI reflects these rules, but they are independently enforced server-side — users cannot bypass them by modifying requests.

---

## 3. Features

- **Mandatory install wall** — first-time visitors are shown a full-screen install prompt before accessing the app
- **Project submission** — students create submissions with title, description, and assigned lecturer
- **Multi-document upload** — upload PRD, SDD, Final Report, and Poster with live progress bars
- **Real-time status tracking** — submissions move through Pending → Approved / Rejected with visual badges
- **Lecturer review dashboard** — view all submissions, filter by status, read documents, add feedback
- **Archive** — all approved projects are browsable and searchable by any signed-in user
- **Role-based routing** — students and lecturers see different dashboards automatically
- **Inline profile completion** — if a user's profile was not created during registration, they are prompted to complete it on first login (no dead-end errors)
- **Offline support** — service worker caches the app shell for offline access after first install
- **Settings page** — update full name, password; students can see their registration details
- **User management** — lecturers can view all registered users

---

## 4. Installing the App

### Android (Chrome)

1. Open [sci-project.replit.app](https://sci-project.replit.app) in **Chrome**
2. The install screen appears immediately — tap **Install App**
3. Chrome shows a native install dialog — tap **Install**
4. The app icon appears on your home screen — open it from there

If the Install App button doesn't trigger the dialog, tap the browser menu (⋮) and choose **Add to Home Screen** or **Install app**.

### iPhone / iPad (Safari)

1. Open [sci-project.replit.app](https://sci-project.replit.app) in **Safari** (not Chrome — iOS requires Safari for home screen installation)
2. The install screen shows step-by-step instructions:
   - Tap the **Share** button (box with upward arrow) at the bottom of Safari
   - Tap **Add to Home Screen**
   - Tap **Add** in the top-right corner
3. Open the app from your home screen

### Desktop (Chrome / Edge)

1. Open [sci-project.replit.app](https://sci-project.replit.app)
2. Tap **Install App** — a dialog appears to confirm installation
3. Or click the **install icon (⊕)** in the browser's address bar
4. The app opens in its own window without any browser interface

---

## 5. How to Use the App

### For Students

1. **Register** — choose Student role, enter your full name, email, password, and registration number (format: `COURSE/LEVEL/NUMBER/YEAR`, e.g. `ITE/D/01-06605/2023`). The system validates your registration number and determines your eligibility to submit based on your year of study.
2. **Dashboard** — after signing in, you land on the Student Dashboard. Your submissions are listed with status badges.
3. **Create a Project** — tap **New Project**, enter the title, description, and select the lecturer you want to assign.
4. **Upload Documents** — tap a project card to open it, then tap **Upload Center**. Upload:
   - **PRD** (Project Requirements Document) — required
   - **SDD** (Software Design Document) — required
   - **Final Report** — optional
   - **Poster** — optional
5. **Track Status** — check the status badge on each project card. When a lecturer reviews your submission, the status updates and any feedback appears.
6. **Settings** — update your name or password from the Settings page.

### For Lecturers

1. **Register** — choose Lecturer role, enter full name, email, password, and Staff ID (4–10 digits).
2. **Dashboard** — the Lecturer Dashboard shows all student submissions. Filter by status using the tabs at the top.
3. **Review a Project** — tap any project card to expand it. View the student's details, uploaded documents, and any existing comments.
4. **Approve or Reject** — use the action buttons to approve a submission (moves it to the Archive) or reject it (returns it to the student with feedback).
5. **User Management** — accessible from the navigation bar. Shows all registered students and lecturers.

---

## 6. Registration & Login

### Registration Number Format (Students)

Students must use the exact registration number issued by the university:

```
COURSE/LEVEL/NUMBER/YEAR
```

| Part | Example | Description |
|------|---------|-------------|
| COURSE | `ITE` | Course code |
| LEVEL | `D` | Diploma (`D`) or Degree (`B`) |
| NUMBER | `01-06605` | Student index number |
| YEAR | `2023` | Year of enrolment |

Full example: `ITE/D/01-06605/2023`

The system uses the enrolment year to calculate the student's year of study. Only **3rd-year** and **5th-year** students are permitted to submit projects.

### Staff ID Format (Lecturers)

Staff ID must be **4–10 digits only** (no letters or special characters). Example: `123456`.

### Email Confirmation

Supabase email confirmation is enabled by default on new projects. If your Supabase project has email confirmation enabled:
- After registering, check your email for a confirmation link
- Once confirmed, sign in — the app will complete your profile setup automatically
- If you see "Your account exists but profile setup is incomplete", your email was confirmed but profile data was not saved — sign in again and the app will prompt you to fill in your details

**For administrators:** To disable email confirmation (recommended for a university intranet), go to Supabase Dashboard → Authentication → Providers → Email → uncheck **Confirm email**.

---

## 7. Hosting & Deployment

The app is deployed as a **static site on Replit**. The built React bundle is served from Replit's CDN — no server runs at runtime because Supabase handles all backend logic (authentication, database, file storage).

### Publishing / Updating

1. Make changes in Replit
2. Click the **Deploy** button (ship icon) in the toolbar
3. Replit runs `npm run build` and publishes the `dist/` folder
4. Live at: `https://sci-project.replit.app`

To update the live app, click **Deploy** again — the previous version is replaced immediately.

### Running in Development

```bash
npm run dev
```

Opens at `http://localhost:5000`. The install wall is present but you can test the normal app by simulating standalone mode (open DevTools → Application → Manifest → Add to home screen).

---

## 8. Building the Android APK

APK compilation requires the full Android SDK (2GB+ toolchain) which cannot run inside Replit. Use **Codemagic** (free) or **Android Studio** locally.

### Method A — Codemagic (Recommended, No Local Setup)

1. **Push code to GitHub**
   - In Replit → Git tab → commit all changes → push to `SilvaTechB/sci-project`

2. **Set up Codemagic**
   - Go to [codemagic.io](https://codemagic.io) → sign up with GitHub (free)
   - Click **Add application** → GitHub → select `SilvaTechB/sci-project`
   - Choose **codemagic.yaml** as the configuration file

3. **Add environment variables** (one-time)
   - In Codemagic → your app → **Environment variables**
   - Add (values from Replit Secrets):
     ```
     VITE_SUPABASE_URL          = https://ojpaaybtjzpuhfurdxom.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY  = (your anon key)
     VITE_SUPABASE_PROJECT_ID   = ojpaaybtjzpuhfurdxom
     ```

4. **Start the build**
   - Click **Start new build** → select `android-debug` workflow
   - Wait ~8–12 minutes

5. **Download the APK**
   - When build is green → click **Artifacts** → download `app-debug.apk`
   - Codemagic also emails you the download link

6. **Install on device**
   - Transfer APK to your Android phone
   - Settings → Security → **Allow from Unknown Sources** (or **Install unknown apps**)
   - Tap the APK → Install → Open SCI Archive

7. **Activate download button on /install** (optional)
   - In Replit Secrets, add: `VITE_APK_DOWNLOAD_URL = <direct URL to your APK>`
   - Redeploy — the download button on the `/install` page becomes active

---

### Method B — Android Studio (Local)

```bash
git clone https://github.com/SilvaTechB/sci-project
cd sci-project
npm install
npm run build
npx cap sync android
# Open the android/ folder in Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Requirements: Node.js 22+, Java 21, Android Studio with SDK 36.

---

## 9. Project Structure

```
sci-project/
├── src/
│   ├── components/
│   │   ├── PWAInstallWall.tsx          # Mandatory install screen (blocks browser access)
│   │   ├── MobileNav.tsx               # Bottom navigation bar
│   │   ├── UploadCenter.tsx            # Document upload sheet with progress
│   │   ├── ProjectComments.tsx         # Project comment threads
│   │   ├── MentionNotifications.tsx    # @mention notification badge
│   │   ├── DashboardStats.tsx          # Stats cards for lecturer dashboard
│   │   ├── AppLoader.tsx               # Auth-aware loading wrapper
│   │   ├── ProtectedRoute.tsx          # Role-based route guard
│   │   └── ui/                         # shadcn/ui component library
│   ├── hooks/
│   │   ├── useAuth.tsx                 # Auth context, session, profile
│   │   ├── usePWAInstall.tsx           # PWA install prompt + standalone detection
│   │   └── useMentions.ts             # @mention resolution
│   ├── pages/
│   │   ├── Index.tsx                   # Landing / home page (/)
│   │   ├── Install.tsx                 # APK download page (/install)
│   │   ├── Login.tsx                   # Sign in (/login)
│   │   ├── Register.tsx                # Create account (/register)
│   │   ├── ForgotPassword.tsx          # Password reset request
│   │   ├── ResetPassword.tsx           # Password reset confirmation
│   │   ├── StudentDashboard.tsx        # Student home (/student)
│   │   ├── LecturerDashboard.tsx       # Lecturer home (/lecturer)
│   │   ├── Archive.tsx                 # Approved projects (/archive)
│   │   ├── Settings.tsx                # Profile & password (/settings)
│   │   └── UserManagement.tsx          # User list (/users)
│   ├── lib/
│   │   ├── storageUploadWithProgress.ts  # XHR upload with progress + SDK fallback
│   │   ├── fileValidation.ts             # File type and size checks
│   │   └── regNoValidation.ts            # Registration number parser + validator
│   └── App.tsx                          # Root component, routes, providers
├── public/
│   ├── sw.js                   # Service worker (cache, offline, installability)
│   ├── manifest.json           # PWA manifest (name, icons, display mode)
│   ├── favicon.png             # Browser tab icon
│   ├── icon-192.png            # PWA icon — small
│   ├── icon-512.png            # PWA icon — large (maskable)
│   └── apple-touch-icon.png    # iOS home screen icon (180×180)
├── android/                    # Capacitor Android project
│   └── app/src/main/res/
│       └── mipmap-*/           # Android launcher icons (mdpi → xxxhdpi)
├── supabase/
│   └── migrations/             # Database schema SQL migrations
├── capacitor.config.ts         # Capacitor: appId, server URL, plugins
├── codemagic.yaml              # Codemagic CI: Android APK build workflow
├── index.html                  # HTML entry (PWA meta tags, manifest link)
├── vite.config.ts              # Vite config (aliases, server settings)
└── docs/
    └── DOCUMENTATION.md        # This file
```

---

## 10. Environment Variables

Stored as **Replit Secrets** — never committed to git.

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anonymous/public API key |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Supabase project reference ID |
| `VITE_APK_DOWNLOAD_URL` | ❌ | Direct URL to the compiled APK file — activates the download button on `/install` |

To view or edit: in Replit, click the **Secrets** (padlock) icon in the left sidebar.

---

## 11. Database Schema

Managed by Supabase PostgreSQL with migrations in `supabase/migrations/`.

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key (auto-generated) |
| `user_id` | `uuid` | Foreign key → `auth.users.id` (cascade delete) |
| `full_name` | `text` | User's full name |
| `email` | `text` | User's email address |
| `role` | `user_role` | Enum: `student` or `lecturer` |
| `registration_number` | `text` | Student reg number or staff ID |
| `course_name` | `text` | Derived from registration number (students) |
| `year_of_study` | `integer` | Calculated year (students only) |
| `can_submit` | `boolean` | `true` if 3rd or 5th year student |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed timestamps |

### `projects`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `student_id` | `uuid` | FK → `profiles.id` |
| `title` | `text` | Project title |
| `description` | `text` | Project description |
| `status` | `submission_status` | Enum: `pending`, `approved`, `rejected` |
| `feedback` | `text` | Lecturer feedback (on rejection) |
| `reviewed_by` | `uuid` | FK → `profiles.id` (lecturer who reviewed) |
| `reviewed_at` | `timestamptz` | Review timestamp |
| `assigned_lecturer_id` | `uuid` | FK → `profiles.id` |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed timestamps |

### `project_documents`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → `projects.id` (cascade delete) |
| `document_type` | `text` | `prd`, `sdd`, `final_report`, `poster` |
| `file_name` | `text` | Original filename |
| `file_path` | `text` | Path in Supabase Storage |
| `file_size` | `integer` | File size in bytes |
| `uploaded_at` | `timestamptz` | Upload timestamp |

---

## 12. Security — Row Level Security

All three tables have RLS enabled. Policies use `SECURITY DEFINER` functions to avoid recursive RLS issues:

- `get_user_role(uuid)` — returns the role of a given user
- `is_lecturer(uuid)` — returns true if the user is a lecturer
- `get_profile_id(uuid)` — returns the profile UUID for an auth user

**Profile policies:**
- Students can only read and update their own profile
- Lecturers can read all profiles
- Any authenticated user can insert their own profile (enforced: `auth.uid() = user_id`)

**Project policies:**
- Students can read/create/update only their own projects
- Students can only create projects if `can_submit = true`
- Lecturers can read and update all projects

**Document policies:**
- Students can read/upload documents to their own projects
- Lecturers can read all documents

**Storage policies (`project-documents` bucket):**
- Upload: user folder must match `auth.uid()`
- Download: own files only (students) or all files (lecturers)

---

## 13. App Icon & Assets

The SCI Archive icon shows a **graduation cap over an open book** with a cyan-to-purple gradient on a dark navy background (`#0A0F1E`).

Master source: `attached_assets/app-icon-master.png` (1024×1024 px)

### Android Launcher Icons

| Directory | Icon size | Adaptive icon bg |
|-----------|-----------|-----------------|
| `mipmap-mdpi` | 48×48 px | `#0A0F1E` |
| `mipmap-hdpi` | 72×72 px | `#0A0F1E` |
| `mipmap-xhdpi` | 96×96 px | `#0A0F1E` |
| `mipmap-xxhdpi` | 144×144 px | `#0A0F1E` |
| `mipmap-xxxhdpi` | 192×192 px | `#0A0F1E` |

### Web Icons

| File | Size | Usage |
|------|------|-------|
| `public/favicon.png` | 64×64 px | Browser tab |
| `public/apple-touch-icon.png` | 180×180 px | iOS home screen |
| `public/icon-192.png` | 192×192 px | PWA install icon |
| `public/icon-512.png` | 512×512 px | PWA splash / maskable |

---

## 14. Troubleshooting

### Install button does nothing (Android)

The browser needs a few seconds to validate the app before enabling the native install dialog. If tapping **Install App** has no effect:
- Wait 2–3 seconds and try again
- Or use the browser menu (⋮) → **Add to Home Screen**
- Make sure you're using **Chrome** on Android (Firefox and Samsung Browser may not support the install dialog)

### "Email not confirmed" error on login

Your Supabase project has email confirmation enabled. Check your inbox for an email from Supabase and click the confirmation link, then sign in.

Administrators can disable this: Supabase Dashboard → Authentication → Providers → Email → uncheck **Confirm email**.

### "Account profile not found" or "Profile setup incomplete"

This happens when your auth account was created but the profile row was not saved (common when email confirmation is enabled). After signing in, the app shows an inline **Complete Your Profile** form — fill in your details to continue.

### File upload failing on mobile

- Check the `project-documents` bucket exists in Supabase Storage
- Check the bucket's RLS policies are applied (run the latest migration)
- The app tries XHR upload first, then falls back to the Supabase SDK — both need a valid session

### APK build fails on Codemagic

- Verify all three `VITE_SUPABASE_*` environment variables are set in Codemagic → your app → Environment variables
- Check the build log for Java version errors — the build requires **Java 21**
- Ensure the `codemagic.yaml` is at the root of the repository

### App not loading after Replit deployment

- Confirm all three `VITE_*` Replit Secrets are set (padlock icon → Secrets)
- Redeploy after adding or changing secrets
- Check the browser console for `supabase` network errors (usually a wrong URL or key)

### Logout seems slow

Logout now clears the local session immediately — the screen changes to login at once. The Supabase sign-out API call runs in the background. If you still see a delay, check your network connection.

---

*SCI Archive · School of Computing & Informatics · March 2026*
