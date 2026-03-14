# SCI Archive - Student Project Archive System

## Overview
A full-stack web application for submitting, reviewing, and archiving academic project documents. Built for students and lecturers at the School of Computing & Informatics.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend/Auth/DB**: Supabase (auth, PostgreSQL database, file storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

## Key Features
- Student registration and login (with registration number validation)
- Lecturer registration and login (with staff ID validation)
- Students can create projects and upload documents (PRD, SDD, Final Report, Supporting Files)
- Lecturers can review, approve, or reject projects with feedback
- Document versioning — re-uploading a document type creates a new version
- Project comments with @mentions and notifications
- Project deadlines
- User management (lecturers can manage students)
- Archive view for completed projects

## User Roles
- **Student**: Can submit/manage projects, upload documents, view feedback
- **Lecturer**: Can review all assigned projects, approve/reject, add comments and deadlines

## Environment Variables (Replit Env Vars)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

## Running the Project
```
npm run dev
```
Runs on port 5000.

## Database
Managed entirely by Supabase. Migration files are in `supabase/migrations/`. The Supabase project ID is `ojpaaybtjzpuhfurdxom`.

## File Storage
Supabase Storage bucket `project-documents` (private). Files are stored as `{userId}/{projectId}/{docType}-{timestamp}-{filename}`.

## Project Structure
```
src/
  components/      # Reusable UI components
  hooks/           # Custom React hooks (useAuth, useUploadQueue, etc.)
  integrations/    # Supabase client and types
  lib/             # Utility functions (file validation, reg number validation)
  pages/           # Route-level page components
supabase/
  migrations/      # All DB schema migrations
```
