# Adnan's Blog

A modern, high-performance blog platform built with Next.js 15 and Supabase, featuring a custom rich-text editor, server-side authentication, and a complete admin panel.

## Features

- **Responsive Design**: Fluid typography, flex/grid layouts, and a clean reading experience.
- **Admin Dashboard**: Full CRUD interface for managing posts, users, and site settings.
- **Rich Text Editor**: Integrated Tiptap editor with inline image uploads and formatting.
- **Authentication**: Secure email/password and username login powered by Supabase Auth.
- **Comments & Reactions**: Built-in engagement tools for readers.
- **Role-Based Access**: Middleware-enforced route protection for readers vs admins.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Database & Auth:** [Supabase](https://supabase.com/) (Postgres)
- **Editor:** [Tiptap](https://tiptap.dev/)
- **Styling:** Vanilla CSS Modules with a custom Design System

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/mayazad/adnans-blog.git
cd adnans-blog
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the example environment file:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase project URL and Anon Key in `.env.local`.

### 4. Database Setup (Supabase)
Run the SQL migrations located in `supabase/migrations/` sequentially in your Supabase SQL Editor:
1. `001_initial_schema.sql` (Click "Run without RLS")
2. `002_rls_policies.sql`
3. `003_triggers.sql`
4. `004_username_login.sql`

Also, ensure you create a **public** storage bucket named `public-assets` in Supabase for image uploads.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Creating an Admin User
1. Sign up on the local site via `/signup`.
2. Go to your Supabase Dashboard -> Table Editor -> `profiles`.
3. Change your user's `role` from `reader` to `admin`.
4. You can now access the `/admin` dashboard.
