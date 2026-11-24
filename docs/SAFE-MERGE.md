# Safe merge notes

This ZIP intentionally does not contain:
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `proxy.ts`
- `lib/supabase/*`
- `package.json` / `package-lock.json`
- `.env.local`
- Vercel or GitHub workflow configuration

These files are left untouched to protect the existing project. The dynamic route `app/workspace/[module]/page.tsx` handles module routes from `lib/febria/store.ts`.
