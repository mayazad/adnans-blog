<div align="center">

# Adnan's Blog

**A minimal, fast, and elegant personal blog platform.**  
Built for writers who care about the reading experience.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖊️ **Rich Editor** | Tiptap-powered WYSIWYG with inline image uploads |
| 🔐 **Auth** | Email & username login via Supabase Auth |
| 💬 **Comments** | Threaded reader comments on each post |
| ❤️ **Reactions** | Like, Insightful, and Love reactions per post |
| 🛡️ **Admin Panel** | Full post management, comment moderation, site settings |
| 📖 **Reading Progress** | Live reading progress bar on articles |
| 📑 **Table of Contents** | Auto-generated TOC from article headings |
| 🎨 **Design System** | Custom CSS design system with dark-mode-ready tokens |
| ⚡ **SSR** | Server-side rendered pages via Next.js App Router |

---

## 🛠 Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Database & Auth** — [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
- **Editor** — [Tiptap](https://tiptap.dev/)
- **Styling** — Vanilla CSS Modules with a custom design token system
- **Deployment** — [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/mayazad/adnans-blog.git
cd adnans-blog
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Run the SQL migrations in your **Supabase SQL Editor** in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_triggers.sql
supabase/migrations/004_username_login.sql
```

Also create a **public** Storage bucket named `public-assets` for image uploads.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Creating an Admin Account

1. Sign up at `/signup`
2. In your **Supabase Dashboard** → **Table Editor** → `profiles`
3. Change your user's `role` from `reader` → `admin`
4. Access the admin panel at `/admin`

---

## 📁 Project Structure

```
adnans-blog/
├── app/
│   ├── (public)/          # Public-facing pages (home, post, about)
│   ├── (auth)/            # Login & signup pages
│   └── admin/             # Admin dashboard (protected)
├── components/
│   ├── public/            # Public UI components
│   ├── admin/             # Admin UI components (PostEditor, TiptapEditor)
│   └── ui/                # Shared UI (AuthModal)
├── lib/
│   ├── supabase/          # Supabase client, server, and types
│   └── utils.ts           # Shared utilities
└── supabase/
    └── migrations/        # SQL migration files
```

---

<div align="center">

Made by [Adnan](https://github.com/mayazad)

</div>
