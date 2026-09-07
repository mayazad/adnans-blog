# Supabase Migrations

This directory contains the database schema and policies for Adnan's Blog.

## Applying Migrations

If you are developing locally or want to push changes to your Supabase project, use the Supabase CLI.

### Local Development
To start the local Supabase stack and apply all migrations automatically:
```bash
npx supabase start
```

### Pushing to Production
To apply these migrations to your linked remote Supabase project:
```bash
npx supabase db push
```

## Migration Overview
- **001-006**: Core tables (posts, profiles, comments, reactions, settings, storage) and RLS policies.
- **007**: Introduced relational `tags` and `series` tables for advanced content taxonomy.
- **008**: Cleaned up deprecated columns, added profile bios, and created view tracking RPCs.
