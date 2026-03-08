# ArogyaMitra

Your personal health companion — built to help you eat better, train smarter, and stay consistent.

ArogyaMitra brings together workout planning, nutrition tracking, and real-time coaching into one clean interface. It uses large language models under the hood so the advice adapts to your goals, body metrics, and preferences — not generic templates.

---

## What It Does

- **Coach Chat** — Talk to an AI coach that understands your fitness context and gives actionable advice.
- **Workout Plans** — Get personalized routines with embedded YouTube tutorial videos for every exercise.
- **Nutrition Plans** — Receive macro-balanced meal plans tailored to your calorie targets.
- **Health Dashboard** — See your BMI, BMR, and TDEE at a glance with clean visualizations.
- **Progress Tracking** — Log your weight and workouts over time to track trends.
- **Authentication** — Sign up with email, Google, or GitHub. Sessions are handled with JWTs.
- **Calendar Sync** — Push workout sessions directly to Google Calendar.

---

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, TailwindCSS, Recharts, Chart.js, Framer Motion

**Backend:** Node.js, Express, TypeScript, better-sqlite3, JWT auth, bcrypt

**External Services:** Groq (LLaMA 3.3 70B), Gemini, YouTube Data API, Google OAuth, GitHub OAuth, Clerk

---

## Project Layout

```
arogyamitra/
├── backend/
│   ├── database/        # SQLite schema and connection
│   ├── middleware/       # Auth middleware
│   ├── routes/           # Express route handlers
│   ├── services/         # AI integrations, YouTube, email
│   └── server.ts         # App entry point
├── frontend/
│   ├── components/       # UI components
│   ├── pages/            # Route-level views
│   ├── services/         # API client layer
│   ├── App.tsx           # Root component with routing
│   └── main.tsx          # Vite entry
├── .env.example          # Environment variable template
├── render.yaml           # Render deployment config
├── package.json
└── README.md
```

---

## Getting Started

### Requirements

- Node.js v20 or later
- npm v9 or later

### Setup

```bash
git clone https://github.com/PRINCEk0001/arogyamitra.git
cd arogyamitra
npm install
cp .env.example .env
```

Open `.env` and fill in your API keys (see the section below for where to get them).

### Run Locally

```bash
npm run dev
```

The app starts at **http://localhost:3000**.

---

## API Keys You'll Need

| Service | Where to Get It |
|---------|-----------------|
| **Groq** | [console.groq.com](https://console.groq.com) → API Keys → Create New Key |
| **Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) → Create API Key |
| **YouTube Data API** | [Google Cloud Console](https://console.cloud.google.com) → Enable YouTube Data API v3 → Credentials → API Key |
| **Google OAuth** | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID |
| **GitHub OAuth** | GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App |
| **Clerk** | [clerk.com](https://clerk.com) → Create Application → Copy keys |

For Google OAuth, set the redirect URI to `http://localhost:3000/api/auth/google/callback`.
For GitHub OAuth, set the callback URL to `http://localhost:3000/api/auth/github/callback`.

---

## API Endpoints

### Auth

| Method | Route | What It Does |
|--------|-------|--------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in, receive a JWT |
| GET | `/api/auth/google/url` | Start Google OAuth flow |
| GET | `/api/auth/github/url` | Start GitHub OAuth flow |

### User

| Method | Route | What It Does |
|--------|-------|--------------|
| GET | `/api/users/profile` | Fetch your profile |
| POST | `/api/users/profile` | Update your profile |

### AI Features (auth required)

| Method | Route | What It Does |
|--------|-------|--------------|
| POST | `/api/workout/plan` | Generate a workout plan |
| POST | `/api/nutrition/plan` | Generate a meal plan |
| POST | `/api/coach/chat` | Chat with the AI coach |

### Calendar (auth required)

| Method | Route | What It Does |
|--------|-------|--------------|
| POST | `/api/google/calendar/schedule` | Add a workout to Google Calendar |

---

## Deploying to Render

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → New Web Service → connect this repo.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add your environment variables in the Render dashboard (refer to `.env.example`).
6. Deploy.

A `render.yaml` is included to speed up the configuration.

> **Note:** This app uses SQLite. On Render, attach a Persistent Disk so the database survives redeployments. For heavier production workloads, consider switching to PostgreSQL.

---

## Security

- The `.env` file is gitignored and never committed.
- All AI and third-party API calls run server-side — no keys reach the browser.
- Passwords are hashed with bcrypt (10 rounds).
- `password_hash` is stripped from every API response.
- Use a strong `JWT_SECRET` (at least 32 characters). Generate one with: `openssl rand -hex 32`

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by **Prince Kori**
