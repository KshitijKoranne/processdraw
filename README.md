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
3. Choose sign-in methods (Google recommended)
4. Go to **API Keys** and copy your **Publishable Key** and **Secret Key**
5. Go to **Configure → Integrations → Convex** and activate it
6. Copy the **Frontend API URL** (format: `https://verb-noun-00.clerk.accounts.dev`)

### 3. Set up Convex (Database)

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev) and create a new project called "processdraw"
2. Copy your **Deployment URL** (format: `https://something.convex.cloud`)
3. Go to **Settings → Environment Variables** and add:
   - Key: `CLERK_JWT_ISSUER_DOMAIN`
   - Value: your Clerk Frontend API URL from step 2.6

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
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 5. Initialize Convex

```bash
npx convex dev
```

This syncs your schema and functions to the Convex backend.

### 6. Run locally

In a separate terminal:

```bash
npm run dev
```

### 7. Deploy to Vercel

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` to Vercel project settings
4. Deploy Convex to production: `npx convex deploy`

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
- Convex (real-time database)
- Clerk (authentication)
- SVG-based diagram renderer
- A4 auto-split export
