# ⚡ ProjectFlow — Full Stack Project Management App

**Stack:** Node.js + Express · MongoDB Atlas · React + Vite · Tailwind CSS  
**Auth:** JWT · **Roles:** Admin / Member · **Deploy:** Railway

---

## 📁 Project Structure

\`\`\`
projectflow/
├── backend/
│   ├── middleware/auth.js        # JWT verify + role guards
│   ├── models/User.js            # User schema
│   ├── models/Project.js         # Project schema (members[])
│   ├── models/Task.js            # Task schema
│   ├── routes/auth.js            # signup, login, /me
│   ├── routes/projects.js        # CRUD + members
│   ├── routes/tasks.js           # CRUD + comments + dashboard
│   ├── routes/users.js           # list, role change, deactivate
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
├── frontend/
│   ├── src/
│   │   ├── components/Layout.jsx
│   │   ├── components/ui/Modal.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/LoginPage.jsx
│   │   ├── pages/SignupPage.jsx
│   │   ├── pages/DashboardPage.jsx
│   │   ├── pages/ProjectsPage.jsx
│   │   ├── pages/ProjectDetailPage.jsx
│   │   ├── pages/TasksPage.jsx
│   │   ├── pages/TeamPage.jsx
│   │   ├── pages/ProfilePage.jsx
│   │   ├── utils/api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── railway.toml
│
└── README.md
\`\`\`

---

## 🔐 Environment Variables

### Backend — `backend/.env`

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/projectflow?retryWrites=true&w=majority
JWT_SECRET=any_random_string_minimum_32_characters_long_abc123
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
\`\`\`

| Variable | What it does |
|---|---|
| `PORT` | Port Express runs on. Railway sets this automatically in production. |
| `NODE_ENV` | `development` locally, `production` on Railway |
| `MONGODB_URI` | Full Atlas connection string including DB name `projectflow` |
| `JWT_SECRET` | Secret to sign tokens. Never share. Any long random string. |
| `JWT_EXPIRES_IN` | How long a login session lasts. `7d` = 7 days. |
| `CLIENT_URL` | Your React app URL. Used for CORS. No trailing slash. |

### Frontend — `frontend/.env`

\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`



## 🚀 Local Setup

\`\`\`bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env       # then fill in your values
npm run dev                # http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                # http://localhost:5173
\`\`\`

Go to `http://localhost:5173/signup` — first account = Admin.

---

## 🌐 Railway Deployment — Step by Step

### Step 1 — MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. **Create cluster** → Choose M0 Free → Any region → Click Create
3. **Database Access** → Add New User → Username + Password → Atlas Admin role → Save password
4. **Network Access** → Add IP Address → Allow Access From Anywhere (`0.0.0.0/0`) → Confirm
5. **Database** → Connect → Drivers → Copy connection string:
   \`\`\`
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/projectflow?retryWrites=true&w=majority
   \`\`\`


### Step 3 — Deploy Backend on Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → Select your repo
2. Click the service → **Settings** → **Root Directory** → type `backend`
3. **Variables** tab → Add:


4. **Settings** → **Domains** → Generate Domain → Copy URL (e.g. `https://xxx.up.railway.app`)
5. Test: visit `https://your-backend.up.railway.app/api/health`


\`\`\`
VITE_API_URL = https://YOUR-BACKEND-URL.up.railway.app/api
\`\`\`

4. **Settings** → **Domains** → Generate Domain → Copy URL

### Step 5 — Fix CORS

Go back to **backend service** → **Variables** → Update:
\`\`\`
CLIENT_URL = https://YOUR-FRONTEND-URL.up.railway.app
\`\`\`
Railway redeploys automatically.

### Step 6 — Done!

Visit your frontend URL → Sign up → First account is Admin automatically.

---

## 🔌 API Reference

\`\`\`
POST   /api/auth/signup              Register (first user = admin)
POST   /api/auth/login               Login, returns JWT
GET    /api/auth/me                  Get current user
PATCH  /api/auth/update-profile      Update name
PATCH  /api/auth/change-password     Change password

GET    /api/projects                 List projects
POST   /api/projects                 Create project
GET    /api/projects/:id             Get project + task counts
PATCH  /api/projects/:id             Edit project (project admin)
DELETE /api/projects/:id             Delete project (project admin)
POST   /api/projects/:id/members     Add member by email
DELETE /api/projects/:id/members/:uid Remove member
GET    /api/projects/:id/stats       Task breakdown stats

GET    /api/tasks                    List tasks (with ?filters)
GET    /api/tasks/dashboard          Dashboard aggregated data
POST   /api/tasks                    Create task
GET    /api/tasks/:id                Get task + comments
PATCH  /api/tasks/:id                Update task
DELETE /api/tasks/:id                Delete task
POST   /api/tasks/:id/comments       Add comment

GET    /api/users                    List all users
GET    /api/users/search             Search by name/email
PATCH  /api/users/:id/role           Change role (admin only)
DELETE /api/users/:id                Deactivate user (admin only)
\`\`\`
