# GUD RMIS

**GUD Road Management Information System** — a Next.js + Firebase web platform for managing drivers, vehicles, loads, invoices, and risk events for trucking operations.

## Features

- 🔐 **Firebase Authentication** — email/password login with protected routes
- 🚗 **Drivers** — create, edit, and track driver roster with status badges; CSV export
- 🚛 **Vehicles** — full fleet management (VIN, make/model, insurance & registration expiry); CSV export
- 📦 **Loads** — manage shipments with origin, destination, driver assignment, and status; CSV export
- 🧾 **Invoices** — billing management with amount tracking and payment status; CSV export
- 🚨 **Incidents** — report and track accidents, violations, and risk events with severity levels; CSV export
- 📋 **Task Board** — Kanban-style task management (To Do / In Progress / Done)
- 📊 **Dashboard** — overview stats and task board at a glance
- 📍 **Live Tracking** — real-time GPS truck tracking on an interactive map (Leaflet + OpenStreetMap) with smooth marker animation, snap-to-route, camera follow, and dev-console GPS logging
- 🔒 **Firestore Security Rules** — least-privilege, per-collection rules with admin-role enforcement

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth & Database | Firebase Auth + Firestore |
| Styling | Tailwind CSS 3 |
| Language | JavaScript (ES Modules) |
| Testing | Jest |
| CI/CD | GitHub Actions |

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Firebase project with **Firestore** and **Authentication** (email/password) enabled

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase project credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Security:** `.env.local` is gitignored and must never be committed to source control.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

### 5. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest unit tests |

## Project Structure

```
├── .github/
│   └── workflows/ci.yml       # GitHub Actions: lint, build, and test
├── __tests__/
│   └── utils.test.js          # Unit tests for utility functions
├── app/
│   ├── layout.js              # Root layout with AuthProvider
│   ├── page.js                # Redirects to /dashboard
│   ├── login/page.js          # Login page
│   ├── dashboard/page.js      # Stats + Task Board
│   ├── drivers/page.js        # Driver CRUD + CSV export
│   ├── vehicles/page.js       # Vehicle CRUD + CSV export
│   ├── loads/page.js          # Load CRUD + CSV export
│   ├── invoices/page.js       # Invoice CRUD + CSV export
│   ├── incidents/page.js      # Incident CRUD + CSV export
│   ├── tracking/page.js       # Live GPS tracking map
│   └── api/                   # REST API routes
├── components/                # Reusable UI components
│   └── LiveTracker.js         # Real-time GPS map component
├── lib/
│   ├── firebase.js            # Firebase app initialisation
│   ├── auth.js                # Auth context & helpers
│   ├── firestore.js           # Firestore CRUD helpers
│   ├── constants.js           # Collection names, status values, nav links
│   ├── exportCsv.js           # CSV export utilities
│   ├── gps.js                 # GPS math utilities (distance, filtering, snap, interpolation)
│   └── utils.js               # Formatting utilities
├── firestore.rules            # Least-privilege Firestore security rules
├── jest.config.js             # Jest configuration
└── vercel.json                # Vercel deployment configuration
```

## Live GPS Tracking

Navigate to `/tracking` to open the real-time truck tracking map.

### How it works

| Concern | Implementation |
|---|---|
| Location stream | `navigator.geolocation.watchPosition` with `enableHighAccuracy: true` |
| Single source of truth | One `acceptedPosition` ref drives the marker, speed display, and camera |
| GPS filtering | `isValidGpsUpdate` in `lib/gps.js` – relaxed while speed > 5 mph; rejects bad accuracy or huge jumps only |
| Snap-to-route | `snapToRoute` in `lib/gps.js` – forward-only window (never big backward resets) |
| Route progress lock | `currentRouteIndex` only moves forward (small back-tolerance for GPS jitter) |
| Smooth animation | `requestAnimationFrame` interpolation via `interpolatePosition` over 800 ms |
| Camera follow | `map.panTo` on every accepted fix when follow mode is active |
| Dev logging | Every accepted fix logged to `console.info` with lat, lng, speed, accuracy, heading, routeIndex, and timestamp |

### Providing a route

Pass an array of `[lat, lng]` pairs as `routeCoords` to `<LiveTracker />` to enable snap-to-route.  
In production, fetch the active load's waypoints from Firestore and pass them in.

```jsx
<LiveTracker routeCoords={[[37.77, -122.41], [37.78, -122.42], /* … */]} />
```

## Deployment

### Vercel (recommended)

1. Push your branch to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard.
4. Vercel will auto-detect Next.js and use the `vercel.json` configuration.

### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in the Netlify dashboard.
4. Install the [Next.js Netlify plugin](https://docs.netlify.com/integrations/frameworks/next-js/overview/).

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t gud-rmis .
docker run -p 3000:3000 --env-file .env.local gud-rmis
```

## Firestore Security Rules

The `firestore.rules` file implements least-privilege rules:

- **All authenticated users** can read drivers, vehicles, loads, incidents, invoices, and tasks.
- **Admins only** (custom claim `admin: true`) can create/update/delete drivers and vehicles, and delete loads, invoices, incidents, and tasks.
- **Any authenticated user** can create loads, invoices, incidents, and tasks.
- All other paths are **denied by default**.

To grant admin access to a user, set the custom claim via Firebase Admin SDK:
```js
admin.auth().setCustomUserClaims(uid, { admin: true });
```

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. **Lint** — `npm run lint`
2. **Build** — `npm run build` (with stub Firebase env vars)
3. **Test** — `npm test`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

This project is proprietary. All rights reserved.
