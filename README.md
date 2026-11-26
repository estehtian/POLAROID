# FEBRIA CORE 3000

Next.js App Router starter for the FEBRIA workspace.

## Requirements

- Node.js 20.9 or newer
- npm

## Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The workspace is at `/workspace`; DXF tools are at `/workspace/dxf-studio`.

## Verification commands

```bash
npm run typecheck
npm run build
```

The repository snapshot includes prototype functionality only. DXF import/export currently supports a limited ASCII DXF subset and must be checked for unit and 1:1 scale in CAD. Do not treat generated drafts or visual previews as production-validated patterns.

No dependency lockfile is included yet; run `npm install` in the complete project checkout to create and commit `package-lock.json` for reproducible installs.
