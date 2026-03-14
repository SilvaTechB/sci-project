# SCI Archive — Full Documentation

**Version:** 2.0  
**Platform:** Web (Replit Hosted) + Android APK  
**Stack:** React + Vite + Supabase + Capacitor

---

## Table of Contents

1. [What is SCI Archive?](#1-what-is-sci-archive)
2. [User Roles](#2-user-roles)
3. [Features](#3-features)
4. [How to Use the App](#4-how-to-use-the-app)
5. [Replit Hosting — Live Website](#5-replit-hosting--live-website)
6. [APK Download Procedure](#6-apk-download-procedure)
7. [App Icon](#7-app-icon)
8. [Project Structure](#8-project-structure)
9. [Environment Variables](#9-environment-variables)
10. [Database Schema](#10-database-schema)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What is SCI Archive?

SCI Archive is a secure academic project management system for the **School of Computing & Informatics**. It allows students to submit project documents and lecturers to review, approve, or reject them — accessible as both a **live website** and an **Android mobile app**.

---

## 2. User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Student** | 3rd-year or 5th-year student | Submit projects, view own submissions, upload documents |
| **Lecturer** | Academic staff | View all submissions, approve/reject projects, manage archive |

> Access is enforced at the database level (Row Level Security). Users cannot see or modify data they are not permitted to access.

---

## 3. Features

- **Project submission** with PDF/DOCX document upload
- **Status tracking** (pending → under review → approved / rejected)
- **File storage** via Supabase Storage with XHR progress tracking
- **Role-based dashboards** — students see their own projects; lecturers see all
- **Mobile-first UI** with bottom navigation bar, safe area insets, and dark theme
- **PWA support** — can be installed from Chrome browser on Android/iOS
- **Android APK** — native app via Capacitor wrapping the same web code

---

## 4. How to Use the App

### For Students

1. Open the app (website or APK)
2. Sign up using your institutional email
3. Complete your profile — select your year (3rd or 5th)
4. Tap **New Submission** to submit a project
5. Fill in: project title, description, department, supervisor name
6. Upload your project document (PDF or DOCX)
7. Track your submission status from the dashboard

### For Lecturers

1. Sign in with your lecturer account
2. The dashboard shows all student submissions
3. Tap any project to view full details and the uploaded document
4. Use **Approve** or **Reject** buttons to action submissions
5. Add feedback comments when rejecting

---

## 5. Replit Hosting — Live Website

The app is deployed as a **static site on Replit**. The built React app is served directly — no server needed since Supabase handles all backend logic.

### How to Publish / Update

1. Open your Replit project at [replit.com](https://replit.com)
2. Make sure the app is working (press **Run** and verify in the preview pane)
3. Click the **Deploy** button (ship icon) in the top toolbar
4. Replit builds the app automatically (`npm run build`) and publishes it
5. Your live URL will be: `https://sci-archive.YOUR-USERNAME.replit.app`

### Update an Already-Deployed Site

Every time you click **Deploy** again, Replit rebuilds and pushes the latest version. No extra steps needed.

### What "Static" Means

- The React app runs entirely in the browser
- Supabase (auth, database, storage) is accessed directly from the frontend
- There is no Node.js server running in production
- Fast, free, always-on hosting included with your Replit account

---

## 6. APK Download Procedure

Because Android apps require the full Android SDK/Gradle toolchain (which needs 2GB+ RAM), APKs cannot be compiled inside Replit. Use one of these two free methods:

---

### Method A — Codemagic (Recommended, No Setup Required)

**Codemagic** is a free cloud CI/CD service built specifically for mobile apps. It reads the `codemagic.yaml` already in this project.

**Steps:**

1. **Push your latest code to GitHub**
   - Go to your Replit project → click the **Git** icon (or Version Control tab)
   - Commit all changes and push to `SilvaTechB/sci-project`

2. **Sign up at Codemagic**
   - Go to [codemagic.io](https://codemagic.io/start/)
   - Sign up using your GitHub account (free tier available)

3. **Add your project**
   - Click **Add application**
   - Select **GitHub** → choose `SilvaTechB/sci-project`
   - When asked for configuration type, select **codemagic.yaml**

4. **Add environment variables** (one-time setup)
   - In Codemagic, go to your app → **Environment variables**
   - Add these three variables (get values from Replit Secrets):
     ```
     VITE_SUPABASE_URL          = https://ojpaaybtjzpuhfurdxom.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY  = (your anon key from Replit secrets)
     VITE_SUPABASE_PROJECT_ID   = ojpaaybtjzpuhfurdxom
     ```

5. **Start a build**
   - Click **Start new build** → select the `android-debug` workflow
   - Wait approximately 8–12 minutes

6. **Download the APK**
   - When the build turns green, click **Artifacts**
   - Download `app-debug.apk`
   - Codemagic also emails you the download link automatically

7. **Install on your Android device**
   - Transfer the APK to your phone (USB, Google Drive, email, etc.)
   - On your phone: **Settings → Security → Allow from Unknown Sources**
   - Open the APK file to install

---

### Method B — Local Build (Android Studio)

If you have Android Studio installed on your computer:

1. **Clone the repository**
   ```bash
   git clone https://github.com/SilvaTechB/sci-project
   cd sci-project
   ```

2. **Create a `.env` file** in the project root:
   ```
   VITE_SUPABASE_URL=https://ojpaaybtjzpuhfurdxom.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
   VITE_SUPABASE_PROJECT_ID=ojpaaybtjzpuhfurdxom
   ```

3. **Install dependencies and build web assets**
   ```bash
   npm install
   npm run build
   npx cap sync android
   ```

4. **Open Android Studio**
   - Open the `android/` folder (not the whole project — just the `android/` subfolder)
   - Wait for Gradle sync to complete (first time takes ~5 minutes)

5. **Build the APK**
   - Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Click the notification **locate** link when done

6. **Find your APK**
   - Path: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Tip: Using the Deployed Website as the App

For immediate testing without building an APK, users can install the website as a PWA:

1. Open Chrome on Android
2. Navigate to your deployed Replit URL
3. Tap the browser menu (⋮) → **Add to Home Screen**
4. The app appears on the home screen with the SCI Archive icon and opens in full-screen standalone mode — no browser UI

---

## 7. App Icon

The SCI Archive icon features:
- A graduation cap overlapping an open book
- Cyan-to-purple gradient symbol
- Deep dark navy background (#0A0F1E)

The icon is placed at all required Android densities:

| Directory | Size | Usage |
|-----------|------|-------|
| `mipmap-mdpi` | 48×48 px | Low density devices |
| `mipmap-hdpi` | 72×72 px | Medium density devices |
| `mipmap-xhdpi` | 96×96 px | High density devices |
| `mipmap-xxhdpi` | 144×144 px | Extra-high density |
| `mipmap-xxxhdpi` | 192×192 px | Extra-extra-high density |

Web icons:
- `public/favicon.png` — Browser tab icon
- `public/apple-touch-icon.png` (180×180) — iOS home screen
- `public/icon-192.png` + `public/icon-512.png` — PWA manifest

The master source icon is at `attached_assets/app-icon-master.png` (1024×1024).

---

## 8. Project Structure

```
sci-project/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── MobileNav.tsx  # Bottom navigation bar
│   ├── pages/             # Route pages (Dashboard, Login, Submit, etc.)
│   ├── lib/               # Supabase client, utilities
│   └── App.tsx            # Main router
├── public/
│   ├── favicon.png        # Browser / PWA icon
│   ├── icon-192.png       # PWA manifest icon
│   ├── icon-512.png       # PWA manifest icon (large)
│   ├── apple-touch-icon.png  # iOS home screen icon
│   └── manifest.json      # PWA manifest
├── android/               # Native Android project (Capacitor)
│   └── app/src/main/res/mipmap-*/  # App icons for each screen density
├── capacitor.config.ts    # Capacitor configuration (app ID, name, server)
├── codemagic.yaml         # Cloud APK build configuration (Codemagic CI)
├── index.html             # HTML entry point (meta tags, icons, manifest)
└── vite.config.ts         # Vite build configuration
```

---

## 9. Environment Variables

All variables are stored as **Replit Secrets** (never committed to git).

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

To view or update them in Replit: click the **Secrets** padlock icon in the left sidebar.

---

## 10. Database Schema

Tables are managed by Supabase PostgreSQL with Row Level Security (RLS) enabled.

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (FK → auth.users) | Supabase auth user ID |
| `full_name` | text | User's full name |
| `role` | text | `student` or `lecturer` |
| `year` | text | `3rd`, `5th` (students only) |
| `department` | text | Department name |

### `projects`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `student_id` | uuid (FK) | Submitting student |
| `title` | text | Project title |
| `description` | text | Project description |
| `supervisor` | text | Supervisor name |
| `status` | text | `pending`, `under_review`, `approved`, `rejected` |
| `created_at` | timestamp | Submission date |

### `documents`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid (FK) | Parent project |
| `file_name` | text | Original filename |
| `file_url` | text | Supabase Storage URL |
| `file_type` | text | MIME type |
| `uploaded_at` | timestamp | Upload date |

---

## 11. Troubleshooting

### App not loading after deployment
- Check that all three `VITE_*` environment variables are set in Replit Secrets
- Redeploy after setting them

### File upload failing on mobile
- The app uses XHR with Supabase SDK fallback — if both fail, check that the `documents` bucket exists in Supabase Storage with public read access

### APK build fails on Codemagic
- Verify all three environment variables are added under **Environment variables** in your Codemagic app settings
- Check the build log for "VITE_SUPABASE_URL is not defined" errors

### Login not working
- Ensure your Supabase project's **Authentication → URL Configuration** includes your Replit deployed URL as an allowed redirect URL

### Icon appears as default Capacitor icon
- After the `android/` folder was updated, the change takes effect on the next APK build — there is no "hot reload" for icons

---

*Documentation last updated: March 2026*
