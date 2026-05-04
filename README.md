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
| `npm run build` | Production build (static export → `out/`, then moved to `dist/`) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest unit tests |

> **Static export note:** `npm run build` runs `next build` (which, with `output: 'export'` configured in `next.config.js`, generates static HTML/CSS/JS into an `out/` directory) and then automatically moves `out/` to `dist/`. This means `npm run build` produces a `dist/` folder containing the fully static site ready for deployment.
>
> **Static export limitations:**
> - Server-side `redirect()` from `next/navigation` is **not supported** in static export — it generates HTML marked with `id="__next_error__"` which causes a "client-side exception" error overlay in the browser. The root page uses a client-side `useRouter().replace()` redirect instead.
> - **API routes (`/api/*`) have been removed.** They cannot run on static hosting. All data operations use the Firebase SDK directly from the browser via `lib/firestore.js`. An ESLint rule (`no-restricted-syntax`) will flag any future attempt to call `/api/` paths via `fetch()`.
> - Pages that require dynamic server-side features (SSR, middleware, cookies, etc.) are not supported.
> - **`NEXT_PUBLIC_FIREBASE_*` variables must be set at build time.** On Render (and other static hosts), configure them in the platform's Environment settings *before* triggering a build — Next.js embeds them into the static bundle at compile time and they cannot be injected at runtime. If they are missing, the app displays a "Configuration Error" banner instead of crashing with a blank screen.

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
│   └── tracking/page.js       # Live GPS tracking map
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
├── render.yaml                # Render.com deployment blueprint
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

### Render

1. Push your branch to GitHub.
2. In the [Render dashboard](https://dashboard.render.com), create a new **Static Site** and connect your repository.
3. Use the following settings:
   - **Build Command:** `npm install; npm run build`
   - **Publish Directory:** `dist`
4. Add the following environment variables in the Render dashboard under **Environment** (all are required):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
5. Click **Deploy**.

> **Critical — redeploy after setting env vars:** `NEXT_PUBLIC_FIREBASE_*` environment variables **must be set in Render's Environment settings before triggering a deploy**. Next.js embeds these values into the static bundle at **build time** — changing them after a deploy has no effect until you trigger a new deploy. If they are missing, the app shows a "Configuration Error" banner listing exactly which variables need to be added.
>
> **Troubleshooting: "Application error: a client-side exception has occurred"**
> The most common causes on static hosting:
> 1. **Missing Firebase env vars** — set all `NEXT_PUBLIC_FIREBASE_*` variables in Render → Environment and trigger a new deploy.
> 2. **Server-side redirect** — using `redirect()` from `next/navigation` in a Server Component generates `id="__next_error__"` HTML. The root page already uses `useRouter().replace()` instead.
> 3. **API routes called from client code** — `/api/*` routes don't exist on static hosting. Use Firebase SDK directly.

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
