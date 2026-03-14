# SCI Archive - Student Project Archive System

## Overview
A full-stack web application for submitting, reviewing, and archiving academic project documents. Built for students and lecturers at the School of Computing & Informatics. Also deployable as a native Android/iOS app via Capacitor, and installable as a PWA.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend/Auth/DB**: Supabase (auth, PostgreSQL database, file storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Mobile (Android/iOS)**: Capacitor v6
- **PWA**: Web App Manifest + mobile meta tags

## Key Features
- Student registration and login (with registration number validation)
- Lecturer registration and login (with staff ID validation)
- Students can create projects and upload documents (PRD, SDD, Final Report, Supporting Files)
- Lecturers can review, approve, or reject projects with feedback
- Document versioning — re-uploading a document type creates a new version
- Project comments with @mentions and notifications
- Project deadlines (set by lecturers)
- User management (lecturers can view all users)
- Archive view for all approved projects
- **Mobile bottom navigation** (tab bar for Home/Archive/Users/Settings)
- **PWA installable** — Add to Home Screen on any device
- **Capacitor native** — Android + iOS via `npx cap sync && npx cap open android/ios`

## User Roles
- **Student**: Can submit/manage projects, upload documents, view feedback
- **Lecturer**: Can review all assigned projects, approve/reject, add comments and deadlines

## Eligibility
- Only 3rd and 5th year students can submit projects (auto-detected from reg. number)
- 1st, 2nd, 4th year students can view but not submit

## Environment Variables (Replit Env Vars)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

## Running the Project
```
npm run dev
```
Runs on port 5000.

## Building for Production
```
npm run build
```
Output in `dist/`. Can be deployed to any static host.

## Capacitor (Android/iOS)
```bash
npm run build
npx cap sync android   # or ios
npx cap open android   # or ios
```
App ID: `com.sciarchive.app`

## Database
Managed entirely by Supabase. Migration files are in `supabase/migrations/`. The Supabase project ID is `ojpaaybtjzpuhfurdxom`.

## File Storage
Supabase Storage bucket `project-documents` (private). Files uploaded via XHR (with progress) + Supabase SDK fallback. MIME validation is lenient for mobile uploads.

## Project Structure
```
src/
  components/
    MobileNav.tsx        # Bottom tab navigation (mobile-first)
    UploadCenter.tsx     # Document upload UI
    DashboardStats.tsx
    DocumentPreview.tsx
    DocumentVersionHistory.tsx
    ProjectComments.tsx
    MentionNotifications.tsx
    ProjectDeadline.tsx
  hooks/                 # Custom React hooks (useAuth, useUploadQueue, etc.)
  integrations/          # Supabase client and types
  lib/
    storageUploadWithProgress.ts  # XHR upload + SDK fallback
    fileValidation.ts             # File type/size checks (mobile-lenient)
    regNoValidation.ts            # Registration number parsing
  pages/
    Index.tsx            # Landing page
    Login.tsx
    Register.tsx
    StudentDashboard.tsx
    LecturerDashboard.tsx
    Archive.tsx
    Settings.tsx
    UserManagement.tsx
public/
  manifest.json          # PWA manifest
capacitor.config.ts      # Capacitor config (Android/iOS)
supabase/
  migrations/            # All DB schema migrations
```

## Design System
- Dark navy theme (`--background: 222 47% 6%`)
- Cyan primary (`--primary: 199 89% 48%`)
- Purple accent (`--accent: 280 65% 60%`)
- Glassmorphism cards (`glass-card` class)
- Mobile bottom nav (`mobile-nav` / `mobile-nav-item` classes)
- Safe area insets for notched devices (`env(safe-area-inset-*)`)
- All touch targets ≥ 44px
- Font: Inter (body) + Space Grotesk (headings)
