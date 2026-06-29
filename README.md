# AI Resume Screener 🤖

An AI-powered recruitment assistant that automatically screens, scores, and ranks candidates against job requirements.

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Database Setup](#database-setup)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [How Scoring Works](#how-scoring-works)

---

## 🛠 Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS       |
| Backend  | FastAPI (Python 3.10+)               |
| Database | MongoDB (via Motor async driver)     |
| AI/NLP   | pdfminer, regex NER, Jaccard similarity |
| Auth     | JWT (python-jose) + bcrypt           |

---

## 🗄 Database Setup (MongoDB)

This project uses **MongoDB** as its database.

### Option A — MongoDB Atlas (Cloud, Recommended for Teams)
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a **Free Tier (M0)** cluster
3. Under **Database Access** → Add a user with a username and password
4. Under **Network Access** → Add IP `0.0.0.0/0` (or your specific IP)
5. Click **Connect** → **Drivers** → copy the connection string
6. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
7. Paste it into your `backend/.env` as `MONGODB_URL`

### Option B — Local MongoDB
1. Install MongoDB Community: https://www.mongodb.com/try/download/community
2. Start it: `mongod --dbpath /your/data/path`
3. Use `MONGODB_URL=mongodb://localhost:27017` in `.env`

### What MongoDB stores:
- **`users`** collection — recruiter accounts (email, hashed password, name)
- **`jobs`** collection — job postings (title, description, skills, experience)
- **`candidates`** collection — resume analysis results (scores, skills, status)

Indexes are auto-created when the app starts.

---

## ✅ Prerequisites

Make sure you have installed:
- **Python 3.10+** → https://python.org
- **Node.js 18+** → https://nodejs.org
- **MongoDB** (Atlas or local, see above)
- **pip** and **npm** (come with Python/Node)

---

## 🐍 Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and configure environment variables
cp .env.example .env
# Now open .env and fill in your MongoDB URL and a secret key
```

### Edit `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017        # or your Atlas URL
DB_NAME=ai_resume_screener
SECRET_KEY=your-random-secret-key-here       # change this!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## ⚛️ Frontend Setup

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install
```

No `.env` needed for frontend — Vite proxies `/api` requests to the backend automatically.

---

## 🚀 Running the App

You need **two terminals** running simultaneously.

### Terminal 1 — Backend
```bash
cd backend
source venv/bin/activate    # (or venv\Scripts\activate on Windows)
uvicorn main:app --reload --port 8000
```
Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

Open http://localhost:5173 in your browser.

---

## 📁 Project Structure

```
ai-resume-screener/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings from .env
│   ├── database.py          # MongoDB connection
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── routers/
│   │   ├── auth.py          # Register / Login
│   │   ├── jobs.py          # CRUD for job postings
│   │   └── candidates.py    # Upload, rank, status, export
│   ├── services/
│   │   └── ai_service.py    # PDF extraction + scoring pipeline
│   └── utils/
│       ├── auth.py          # JWT + password hashing
│       └── dependencies.py  # Auth middleware
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx           # Router setup
        ├── main.jsx          # Entry point
        ├── index.css         # Tailwind + global styles
        ├── hooks/
        │   └── useAuth.jsx   # Auth context
        ├── services/
        │   └── api.js        # Axios API calls
        ├── components/
        │   ├── Layout.jsx    # Sidebar + nav
        │   └── ScoreBar.jsx  # Score visualization bar
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx  # Job listing
            ├── CreateJob.jsx  # Job creation form
            └── JobDetail.jsx  # Candidates + ranking
```

---

## 🧠 How Scoring Works

Each resume is scored using a weighted formula:

| Component      | Weight | Source                              |
|----------------|--------|-------------------------------------|
| Skills Match   | 40%    | Required skills found in resume     |
| Experience     | 25%    | Years of experience vs requirement  |
| Semantic Match | 35%    | Jaccard similarity vs job description |

```
Final Score = (Skills × 0.40) + (Experience × 0.25) + (Semantic × 0.35)
```

### Pipeline Steps:
1. **PDF Text Extraction** — pdfminer extracts raw text
2. **NER** — Regex patterns extract name, email, phone, experience years
3. **Skill Detection** — Keyword matching against 60+ known tech skills
4. **Scoring** — Three-component weighted score
5. **Ranking** — All candidates sorted by final score (highest → lowest)

---

## 🔮 Future Upgrades
- BERT NER for more accurate entity extraction
- Sentence Transformers for better semantic similarity
- Side-by-side candidate comparison view
- Multi-language resume support
- ATS integration export formats

---

## 👥 Team Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work, commit, push
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name

# Open Pull Request → peer review → merge to main
# No direct commits to main branch
```
