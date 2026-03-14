# SCI Archive — Student Project Archive System

A modern, secure platform for submitting, reviewing, and archiving academic project documents, built for the **School of Computing & Informatics (SCI)**. Available as a **Progressive Web App (PWA)**, an **Android APK**, and an **iOS app** via Capacitor.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started (Web Dev)](#getting-started-web-dev)
- [Environment Variables](#environment-variables)
- [Building for Production (Web/PWA)](#building-for-production-webpwa)
- [Building for Android](#building-for-android)
- [Building for iOS](#building-for-ios)
- [Installing on Android (APK)](#installing-on-android-apk)
- [App Navigation Guide](#app-navigation-guide)
- [Roles & Permissions](#roles--permissions)
- [Document Types](#document-types)
- [File Upload Rules](#file-upload-rules)
- [Project Structure](#project-structure)
- [Supabase Setup](#supabase-setup)

---

## Features

- **Student submissions** — Create projects and upload required/optional documents
- **Lecturer review** — Approve or reject submissions with written feedback
- **Project archive** — Browse all approved projects (searchable, filterable)
- **Role-based access** — Students vs. Lecturers with separate dashboards
- **Smart eligibility** — Only 3rd and 5th year students can submit (auto-detected from reg. number)
- **Document versioning** — Upload new versions; full version history is preserved
- **In-app notifications** — @mention system for comments on projects
- **Deadlines** — Lecturers can set per-project submission deadlines
- **PWA installable** — Add to home screen on any device
- **Capacitor native** — Full Android + iOS support via Capacitor

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Backend/Auth/DB | Supabase (PostgreSQL + Row Level Security) |
| File storage | Supabase Storage (`project-documents` bucket) |
| Mobile | Capacitor v6 (Android + iOS) |
| PWA | Web App Manifest + mobile meta tags |

---

## Getting Started (Web Dev)

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
# Clone the repo
git clone <repo-url>
cd sci-archive

# Install dependencies
npm install

# Start the dev server (http://localhost:5000)
npm run dev
```

---

## Environment Variables

Create a `.env` file (or set these in your hosting platform):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

All `VITE_` prefixed variables are bundled into the frontend at build time. **Never put secret keys here** — only the public `anon` key.

---

## Building for Production (Web/PWA)

```bash
npm run build
```

Output goes to `dist/`. Deploy this folder to any static host (Vercel, Netlify, Supabase hosting, Cloudflare Pages, etc.).

The app is fully installable as a PWA. Users can tap **"Add to Home Screen"** in their browser.

---

## Building for Android

### Prerequisites

- [Android Studio](https://developer.android.com/studio) (with Android SDK)
- JDK 17+

### Steps

```bash
# 1. Build the web bundle
npm run build

# 2. Sync web assets to the native project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

Inside Android Studio:
- Connect a physical device OR launch an emulator
- Click **Run ▶** to build and install

### Generate a release APK

In Android Studio: **Build → Generate Signed Bundle / APK → APK → Release**

Or from command line:

```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## Building for iOS

### Prerequisites

- macOS with [Xcode 15+](https://developer.apple.com/xcode/)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer account (for device/TestFlight deployment)

### Steps

```bash
# 1. Build the web bundle
npm run build

# 2. Sync web assets + install CocoaPods
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

Inside Xcode:
- Select a simulator or a connected device
- Press **Cmd + R** to run

### Archive for App Store / TestFlight

In Xcode: **Product → Archive**, then distribute via Organizer.

---

## Installing on Android (APK)

To sideload the APK directly (without Google Play):

1. On your Android device, go to **Settings → Apps → Special app access → Install unknown apps**
2. Allow your file manager or browser to install apps
3. Transfer the `.apk` file to your device
4. Open it and follow the prompts

---

## App Navigation Guide

The app uses a **bottom tab bar** for navigation on mobile:

### Student tabs

| Tab | What it does |
|-----|-------------|
| **Home** | Your project dashboard — view, create, and manage your submissions |
| **Archive** | Browse all approved projects from all students |
| **Settings** | Update your profile, change password, delete account |

### Lecturer tabs

| Tab | What it does |
|-----|-------------|
| **Home** | Lecturer dashboard — review pending projects, approve/reject with feedback |
| **Archive** | Browse all approved projects |
| **Users** | View all registered students and lecturers |
| **Settings** | Account settings |

---

## Roles & Permissions

| Action | Student | Lecturer |
|--------|---------|----------|
| Create a project | Only 3rd/5th year | No |
| Upload documents | Own projects only | No |
| Edit/delete a pending project | Own, pending only | No |
| Approve / reject projects | No | Assigned projects |
| Set project deadlines | No | Yes |
| View archive | Yes | Yes |
| View user list | No | Yes |
| Comment on projects | Yes | Yes |

---

## Document Types

Each project can contain the following documents:

| Type | Required? | Description |
|------|-----------|-------------|
| PRD | Yes | Product Requirements Document |
| SDD | Yes | Software Design Document |
| Final Report | Yes | Final project report |
| Supporting Files | No | Any additional files |

A project must have all three required documents before it can be fully reviewed.

---

## File Upload Rules

- **Max size**: 10 MB per file
- **Allowed formats**: PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel (xls/xlsx), ZIP/RAR/7z, images (PNG/JPG/GIF/WebP/SVG), text (TXT/MD/CSV)
- Mobile uploads are fully supported — MIME type validation is lenient for files uploaded from mobile camera rolls or file pickers

---

## Project Structure

```
sci-archive/
├── src/
│   ├── components/
│   │   ├── MobileNav.tsx              # Bottom tab navigation
│   │   ├── UploadCenter.tsx           # Document upload UI
│   │   ├── DocumentPreview.tsx
│   │   ├── DocumentVersionHistory.tsx
│   │   ├── ProjectComments.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useAuth.ts                 # Auth context + Supabase session
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts              # Supabase client
│   ├── lib/
│   │   ├── storageUploadWithProgress.ts  # XHR upload + SDK fallback
│   │   ├── fileValidation.ts             # File type/size checks
│   │   └── regNoValidation.ts            # Registration number parsing
│   └── pages/
│       ├── Index.tsx                  # Landing page
│       ├── Login.tsx
│       ├── Register.tsx
│       ├── StudentDashboard.tsx
│       ├── LecturerDashboard.tsx
│       ├── Archive.tsx
│       ├── Settings.tsx
│       └── UserManagement.tsx
├── public/
│   └── manifest.json                  # PWA manifest
├── capacitor.config.ts                # Capacitor config
├── android/                           # Android native project
├── ios/                               # iOS native project
└── vite.config.ts
```

---

## Supabase Setup

The app uses the following Supabase resources:

### Database tables (managed by RLS)

- `profiles` — User profiles (name, role, reg. number, course, year)
- `projects` — Student project submissions
- `project_documents` — Uploaded files per project
- `project_comments` — Comment threads per project

### Storage

- Bucket: `project-documents` (private, authenticated access only)
- Files stored at: `{userId}/{projectId}/{documentType}/{fileName}`

### Authentication

- Email/password authentication
- Password reset via email link
- Session managed client-side with Supabase JS SDK

### Row Level Security

All tables have RLS enabled:
- Students can only read/write their own data
- Lecturers can read all student projects assigned to them
- The archive (approved projects) is readable by all authenticated users

---

## License

Developed for the School of Computing & Informatics. All rights reserved.
