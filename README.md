# GUD RMIS

**GUD Road Management Information System** — a Next.js 14 + Firebase web platform for managing drivers, loads, invoices, and operational tasks.

## Features

- 🔐 **Firebase Authentication** — email/password login with protected routes
- 🚗 **Drivers** — create, edit, and track driver roster with status badges
- 📦 **Loads** — manage shipments with origin, destination, driver assignment, and status
- 🧾 **Invoices** — billing management with amount tracking and payment status
- 📋 **Task Board** — Kanban-style task management (To Do / In Progress / Done)
- 📊 **Dashboard** — overview stats and task board at a glance
- 🔒 **Firestore Security Rules** — authenticated access only

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth & Database | Firebase Auth + Firestore |
| Styling | Tailwind CSS 3 |
| Language | JavaScript (ES Modules) |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Firebase project credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** `.env.local` is gitignored and must never be committed.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

### 4. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout with AuthProvider
│   ├── page.js            # Redirects to /dashboard
│   ├── login/page.js      # Login page
│   ├── dashboard/page.js  # Stats + Task Board
│   ├── drivers/page.js    # Driver CRUD
│   ├── loads/page.js      # Load CRUD
│   ├── invoices/page.js   # Invoice CRUD
│   └── api/               # REST API routes (drivers, loads, invoices, tasks)
├── components/            # Reusable UI components
├── lib/
│   ├── firebase.js        # Firebase app initialisation
│   ├── auth.js            # Auth context & helpers
│   ├── firestore.js       # Firestore CRUD helpers
│   ├── constants.js       # Collection names, status values, nav links
│   └── utils.js           # Formatting utilities
└── firestore.rules        # Security rules
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
