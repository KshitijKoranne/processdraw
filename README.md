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

### 2. Set up Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Enable **Username** and **Password** sign-in (employees sign in with an employee code)
4. Go to **API Keys** and copy your **Publishable Key** and **Secret Key**

### 3. Set up Neon (Database)

1. Go to [console.neon.tech](https://console.neon.tech) and create a project called "processdraw"
2. Copy the **pooled connection string** (Connection Details → the URL ending in `-pooler`)

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXX
CLERK_SECRET_KEY=sk_test_XXXX
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL=postgresql://...your-neon-pooled-url...
```

### 5. Create the database tables

```bash
npm run db:push
```

This creates all tables in your Neon database from the Drizzle schema
(`src/db/schema.ts`). Re-run it whenever the schema changes.
`npm run db:studio` opens a local browser UI to inspect your data.

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy to Vercel

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` to Vercel project settings
   (plus `CRON_SECRET` if you use demo accounts — see `vercel.json`)
4. Deploy — no separate backend deploy step needed

## Roles

| Role | Permissions |
|------|------------|
| **IT Admin** | Full access, manage users, see all diagrams, assign roles |
| **User** | Create/edit/delete own diagrams, submit for approval |
| **Approver** | Review submitted diagrams, approve/reject |
| **Viewer** | View approved diagrams only (read-only) |

The first user to sign up automatically becomes IT Admin.

## Tech Stack

- Next.js 16 + TypeScript
- Neon Postgres + Drizzle ORM
- Clerk (authentication)
- SVG-based diagram renderer
- A4 auto-split PNG/PDF export with signature footer on every page
- Watermarked exports for unapproved diagrams (DRAFT / PENDING APPROVAL / REJECTED)
- In-app notifications for submissions, approvals, reverts, and rejections
- Immutable audit trail and e-sign confirmations for all workflow actions
