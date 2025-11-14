# Syrian PHC GIS Platform

Full-stack web client for the Syrian National Health Facilities Geographic Location Platform.  
Built with React, Tailwind, Leaflet, Recharts, and Appwrite to deliver a public map, analytics dashboard, editor workflow, and admin approvals.

## Features

- **Explore map** – Leaflet map with marker clustering, typed markers, and quick popups for facility metadata.
- **Advanced filtering** – Multi-select filtering on governorate, type, owner, classification, status plus free‑text search.
- **Analytics dashboard** – KPI cards, governorate bar chart, type & status pies, and monthly trend line synced to filters.
- **Editor console** – Role‑gated, validated facility form with remote Appwrite Function validation and change logging.
- **Admin queue** – Approve/reject pending edits, with decisions written back to Appwrite and mirrored in the activity feed.
- **Realtime updates** – Facilities context listens for Appwrite realtime events and invalidates cached data automatically.

## Tech Stack

- **Frontend:** React 19, React Router 7, Tailwind 4, @tanstack/react-query 5
- **Mapping:** Leaflet 1.9 + markercluster
- **Charts:** Recharts 3
- **Backend services:** Appwrite (Auth, Databases, Functions, Teams, Realtime)

## Getting Started

1. **Clone & install**
   ```bash
   git clone <your fork>
   cd starter-for-react
   npm install
   ```
2. **Configure Appwrite**
   - Create the following resources (names can differ, but map them via env vars):
     - Database + `facilities`, `governorates`, `edits_log` collections.
     - Teams for `editors` and `admins`.
     - Cloud Function `validate-facility-edit` to run server-side checks.
   - Grant roles (visitor/read, editor create/update own, admin full access) as described in the tech spec.
3. **Set environment variables**  
   Duplicate `.env.example` to `.env` (or `.env.local`) and fill with your Appwrite IDs:

   | Variable | Description |
   | --- | --- |
   | `VITE_APPWRITE_ENDPOINT` | Appwrite REST endpoint |
   | `VITE_APPWRITE_PROJECT_ID` | Project ID |
   | `VITE_APPWRITE_DATABASE_ID` | Database containing facilities |
   | `VITE_APPWRITE_FACILITIES_COLLECTION_ID` | Facilities collection ID |
   | `VITE_APPWRITE_GOVERNORATES_COLLECTION_ID` | Governorates reference collection |
   | `VITE_APPWRITE_EDITS_COLLECTION_ID` | Audit/edits collection |
   | `VITE_APPWRITE_VALIDATE_FUNCTION_ID` | Function ID for remote validation |
   | `VITE_APPWRITE_EDITORS_TEAM_ID` | Team ID used to grant editor role |
   | `VITE_APPWRITE_ADMINS_TEAM_ID` | Team ID for admins |
   | `VITE_APPWRITE_LIST_LIMIT` | (Optional) listDocuments limit override |

4. **Run locally**
   ```bash
   npm run dev
   ```
   Visit the URL from Vite (usually http://localhost:5173). Without valid Appwrite credentials the app falls back to sample data for exploration.

5. **Production build**
   ```bash
   npm run build
   npm run preview # optional
   ```
   Deploy the `dist/` output to Vercel/Netlify or another static host, ensuring the same env vars are present.

## Project Structure

```
src/
├─ Components/
│  ├─ Activity/RecentActivity.jsx
│  ├─ Auth/AuthPanel.jsx
│  ├─ Dashboard/Dashboard.jsx
│  ├─ Facility/FacilityForm.jsx
│  ├─ Filter/FilterPanel.jsx
│  ├─ Layout/{AppHeader,ProtectedRoute}.jsx
│  └─ Map/{MapContainer,FacilityPopup}.jsx
├─ context/{AuthContext,FiltersContext,FacilitiesContext}.jsx
├─ hooks/{useAuth,useFilters,useFacilities,useAppwrite}.js
├─ pages/{Explore,EditorConsole,AdminPanel}.jsx
├─ services/appwriteService.js
├─ data/sampleFacilities.js
└─ utils/{constants,env,validator}.js
```

## Testing & Validation

- `npm run build` ensures the Vite bundle compiles (current build succeeds; expect a chunk-size warning until we split map/chart bundles).
- Facility submissions run through both client-side validation (`src/utils/validator.js`) and the Appwrite Function referenced by `VITE_APPWRITE_VALIDATE_FUNCTION_ID`.

## Deployment Notes

- When hosting on Vercel/Netlify, add the same env vars under project settings.
- Because the app consumes Appwrite’s Realtime API, ensure the frontend origin is whitelisted in your Appwrite CORS settings.
- Marker clustering pulls icons from GitHub-hosted assets; fork/host locally if an offline or air-gapped deployment is required.

## Contributing

Please open an issue or pull request describing the feature or fix. Keep linting (`npm run lint`) and formatting consistent with the repo defaults. Feel free to extend the mock dataset under `src/data/` for UX demos without live access.
