# Shravs Teleradiology  README

## 🚀 Quick Deploy (Google Workspace/Cloud Run)

1. **Repo Structure**
```
/
├── Dockerfile       # Backend (Node/Express)
├── package.json     # Backend deps
├── server.js        # Full-stack server
|--- README.md
├── routes/          # API endpoints
├── middleware/
├── db/schema.sql    # Run in Supabase
├── public/          # Frontend HTML/JS
└── .env             # Secrets (gitignore)
```

2. **Supabase Setup**
   - New project → Run `db/schema.sql`
   - Copy DATABASE_URL (%40 encode `@` in password)
   - Update .env with Supabase creds

3. **.env Required**
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@host:port/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... # From dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... # From dashboard
JWT_SECRET=generate-32-random-chars-here
PORT=8080
```

4. **Git Push → Auto-Deploy**
   - Google Workspace/Cloud Build detects Dockerfile
   - Deploys full-stack: `/` serves public/, `/api/*` backend
   - api.js relative paths work (no frontend changes)

## 🛠 Local Dev
```bash
cd backend/  # Or root
npm install
npm start    # http://localhost:8080
```

## 📋 Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/team?role=employee` | Admin | List users |
| POST | `/api/admin-create-employee` | Admin | Create employee |
| POST | `/api/tasks` | Admin | Assign task |
| GET | `/api/queries` | Admin | Contact queries |
| POST | `/api/auth/change-password` | User | First login |

## 🔒 Security
- RLS disabled (backend middleware handles auth)
- JWT from Supabase tokens
- Service role key for server-side ops
- Never commit .env

## 🐛 Troubleshooting
- **Build fails**: URL-encode password `%40`
- **Auth errors**: Check Supabase service key
- **CORS**: `cors({ origin: '*' })` in server.js
- Logs: Cloud Run → Logs Explorer

Full-stack ready! 🚀

[1]employee-profile.html
[2]employee.html
[3]index-1.html
[4]employees-chat.html
[5]reset-password.html
[6]teleradiology.html
[7]login.html
[8]change-password.html
[9]ecare.html
[10]api.js)
[11]admin.html
[12]file.env
[13] logo.jpg
