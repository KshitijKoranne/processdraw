# ProcessDraw

Process flow diagram builder for Pharma API manufacturing — by KJR Labs.

Create clean, standardized process flow diagrams without design skills. Built for GMP/BPCR documentation.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/KshitijKoranne/processdraw.git
cd processdraw
npm install
```

### 2. Set up Neon (Database)

1. Go to [console.neon.tech](https://console.neon.tech) and create a project called "processdraw"
2. Copy the **pooled connection string** (Connection Details → the URL ending in `-pooler`)

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local` — only two values are required:

```
DATABASE_URL=postgresql://...your-neon-pooled-url...
AUTH_SECRET=any-long-random-string
```

Generate a strong `AUTH_SECRET` with `openssl rand -base64 33` (or `npx auth secret`).

### 4. Run locally

```bash
npm run dev
```

Database tables are created automatically the first time you run this —
`npm run dev` and `npm run build` both apply any pending migrations from
`./drizzle` against `DATABASE_URL` before starting. Nothing to run by hand.

`npm run db:studio` opens a local browser UI to inspect your data.

### 5. First-run setup

Open the app and click **Sign In**. On a fresh database the sign-in page
becomes a one-time setup form that creates the first account as **IT Admin**.
After that, the admin creates all further accounts from the Admin Panel
(employees sign in with their employee code; they must set their own
password at first login).

### 6. Deploy to Vercel

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add `DATABASE_URL` and `AUTH_SECRET` to Vercel project settings
   (plus `CRON_SECRET` if you use demo accounts — see `vercel.json`)
4. Deploy. Every build runs the pending database migrations automatically
   (`prebuild` in `package.json`) before building the app — the very first
   deploy creates all tables, later deploys apply only what changed. No
   separate backend deploy step, no manual `db:push`.

### Changing the schema later

Edit `src/db/schema.ts`, then run `npm run db:generate` locally to create
a new migration file and commit it. The next `npm run dev`, `npm run build`,
or Vercel deploy applies it automatically. (`npm run db:push` still exists
for quick, throwaway local prototyping, but committed migrations are what
actually ships to production.)

## Roles

| Role | Permissions |
|------|------------|
| **IT Admin** | Full access, manage users, see all diagrams, assign roles |
| **User** | Create/edit/delete own diagrams, submit for approval |
| **Approver** | Review submitted diagrams, approve/reject |
| **Viewer** | View approved diagrams only (read-only) |

The first account (created via the one-time setup form) is the IT Admin.
Admins can create employees, change roles, disable accounts, and reset
passwords; users change their own password from the account menu.

## Tech Stack

- Next.js 16 + TypeScript
- Neon Postgres + Drizzle ORM
- Auth.js (credentials sign-in, bcrypt-hashed passwords, JWT sessions)
- SVG-based diagram renderer
- A4 auto-split PNG/PDF export with signature footer on every page
- Watermarked exports for unapproved diagrams (DRAFT / PENDING APPROVAL / REJECTED)
- In-app notifications for submissions, approvals, reverts, and rejections
- Immutable audit trail and e-sign confirmations for all workflow actions
