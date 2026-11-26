# Supabase setup for FEBRIA

This branch adds the first authentication and data foundation. It is not yet connected to a live Supabase project and has not been integration-tested.

## 1. Create or select a Supabase project

In the Supabase dashboard, create a project for FEBRIA or select an existing project only after confirming it is not shared with an unrelated production app.

## 2. Configure local environment

Copy .env.example to .env.local and fill in:
- NEXT_PUBLIC_SUPABASE_URL: Project URL.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable key (or legacy anon key).
- NEXT_PUBLIC_SITE_URL: http://localhost:3000 locally; use the deployed application origin in production.

Never put the service-role key in a NEXT_PUBLIC_* variable or browser code. This first phase does not require a service-role key.

## 3. Apply the database migration

Run supabase/migrations/202611260001_initial_profiles_projects.sql in the Supabase SQL Editor, or apply it with the Supabase CLI.

It creates profiles linked to auth.users, projects owned by one authenticated user, owner-scoped RLS policies, and a trigger to create a profile when a new auth user is created.

## 4. Configure Auth URLs

In Supabase Authentication URL configuration:
- Set the Site URL to the deployed app origin.
- Add http://localhost:3000/auth/callback to Redirect URLs for local development.
- Add the production https://YOUR-DOMAIN/auth/callback URL when deploying.
- Enable email confirmation according to the account policy.

## 5. Install and verify locally

```powershell
npm.cmd install
Copy-Item .env.example .env.local
# Edit .env.local with your own project values
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Then test signup, email confirmation, login, protected workspace access, and logout using two separate test accounts. Verify that one account cannot read or update the other account's rows in projects.

## Current scope and limitations

- Homepage and existing engineering modules are preserved.
- Workspace routes are protected by Supabase session middleware.
- Signup, login, callback, and logout actions are included.
- Profile/project database schema and RLS are included but require applying the migration.
- Existing measurement/project/task data still uses browser localStorage. No automatic cloud migration is performed in this phase.
- Password reset, role administration, project CRUD against Supabase, storage uploads, AI provider/worker execution, and production deployment are not included yet.
- GitHub Pages is static hosting and cannot run this server-side Next.js authentication architecture. Deploy this application to a Next.js-capable host after local verification.

Do not describe authentication or database as active until the environment is configured, the migration is applied, and the integration tests pass.