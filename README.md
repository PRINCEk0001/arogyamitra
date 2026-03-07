# 🌿 ArogyaMitra — AI Health Coaching Platform

> A full-stack AI-powered personal health assistant that generates personalized workout plans, nutrition advice, and real-time coaching. Built with React, Node.js, Groq LLaMA 3, and SQLite.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Coach Chat** | Real-time coaching powered by Groq LLaMA 3 |
| 🏋️ **Workout Generator** | Personalized AI workout plans with YouTube tutorials |
| 🥗 **Nutrition Planner** | Macro-optimized meal plans via AI |
| 📊 **Health Dashboard** | BMI, BMR, TDEE tracking with visualizations |
| 📈 **Progress Tracking** | Historical weight and workout records |
| 🔐 **Auth** | Email/password + Google OAuth + GitHub OAuth |
| 📅 **Google Calendar** | Schedule workouts directly to your calendar |
| 🎥 **YouTube Integration** | Auto-fetched exercise tutorial videos |

---

## 🏗 Architecture

```
Frontend (React + Vite)  →  Backend API (Node.js + Express)  →  Groq LLaMA API
       ↕                             ↕                               
  React Router              SQLite (better-sqlite3)
  TailwindCSS               JWT Authentication
  Lucide Icons              Google + GitHub OAuth
```

**Core Principle:** The frontend never calls AI APIs directly. All AI and external API calls go through the backend, keeping API keys secure.

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS** for styling
- **React Router v7** for navigation
- **Recharts** + **Chart.js** for data visualization
- **Framer Motion** for animations

### Backend
- **Node.js** + **Express** + **TypeScript**
- **better-sqlite3** for database
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT auth
- **googleapis** for Google Calendar & OAuth

### AI & External
- **Groq LLaMA 3.3 70B** for AI features
- **YouTube Data API v3** for exercise videos
- **Google OAuth 2.0**
- **GitHub OAuth**

---

## 📁 Project Structure

```
arogyamitra/
├── backend/
│   ├── database/       # SQLite schema and connection
│   ├── middleware/     # JWT auth middleware
│   ├── routes/         # API route handlers
│   └── services/       # AI, YouTube integrations
├── frontend/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── services/       # Frontend API service layer
│   └── types.ts        # TypeScript type definitions
├── .env.example        # Environment variable template
├── package.json        # Root package configuration
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js **v20+**
- npm **v9+**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/arogyamitra.git
cd arogyamitra
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Then edit `.env` and fill in your keys:

```env
GROQ_API_KEY=your_groq_api_key
YOUTUBE_API_KEY=your_youtube_api_key
JWT_SECRET=your_strong_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 4. Run Locally
```bash
npm run dev
```

This starts both the backend and frontend on **http://localhost:3001**

---

## 🔑 Getting API Keys

### Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Create an account → API Keys → Create New Key

### YouTube Data API
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3** → Create credentials → API Key

### Google OAuth
1. Google Cloud Console → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. Set Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`

### GitHub OAuth
1. GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Set callback URL: `http://localhost:3001/api/auth/github/callback`

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/logout` | Logout (client clears token) |
| GET | `/api/auth/google/url` | Get Google OAuth URL |
| GET | `/api/auth/github/url` | Get GitHub OAuth URL |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| POST | `/api/users/profile` | Update user profile |

### AI Features *(Requires JWT)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workout/plan` | Generate AI workout plan |
| POST | `/api/nutrition/plan` | Generate AI nutrition plan |
| POST | `/api/coach/chat` | Chat with AI health coach |

### Calendar *(Requires JWT)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/google/calendar/schedule` | Create workout event |

---

## 🚀 Deployment

### Option 1: Render (Recommended)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repository
4. Set Build Command: `npm install`
5. Set Start Command: `npm run start`
6. Add all environment variables from `.env.example` in the Render dashboard
7. Deploy!

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add environment variables in the Railway dashboard
4. Railway auto-detects the start command

> **Note for all platforms:** The app uses SQLite, which requires persistent disk storage. On Render, use a **Persistent Disk** add-on. For production at scale, consider migrating to PostgreSQL.

---

## 🔒 Security Notes

- Never commit your `.env` file (it's gitignored)
- Use a strong random `JWT_SECRET` (min 32 characters): `openssl rand -hex 32`
- All AI API calls happen server-side — API keys are never exposed to the browser
- Passwords are hashed with bcrypt (10 salt rounds)
- `password_hash` is never returned in API responses

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Developer

**Developed & Crafted by PRINCE KORI**
