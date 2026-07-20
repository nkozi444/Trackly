# Budget & Savings Tracker

Full-stack budget tracking app: transactions, category budgets, and savings goals.

**Stack:** React (Vite) + Express + PostgreSQL + JWT auth

## Project structure
```
budget-tracker/
  backend/     Express API
  frontend/    React app (Vite)
```

## 1. Database setup
1. Create a PostgreSQL database (locally, or free tier on Supabase/Railway/Neon).
2. Run the schema:
   ```bash
   psql <your-connection-string> -f backend/src/db/schema.sql
   ```

## 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL and JWT_SECRET
npm run dev
```
API runs on `http://localhost:5000`. Test it: `curl http://localhost:5000/api/health`

## 3. Frontend setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

## 4. Try it
1. Go to `http://localhost:5173`, sign up with an email/password.
2. You'll land on the dashboard — add a transaction.
3. (Categories/budgets/savings goals have working API routes now; UI pages for them are the next step — see "What's left" below.)

## What's built (Phase 0–2)
- Full DB schema (users, categories, transactions, budgets, savings_goals)
- Auth: signup/login with bcrypt + JWT
- CRUD API: transactions, categories, budgets, savings goals
- Frontend: login/signup, protected dashboard route, add/list/delete transactions

## What's left (Phase 3–4)
- UI pages for categories, budgets (with progress bars), savings goals
- Charts (Recharts): spending by category, income vs expense over time
- Recurring transactions logic
- CSV export
- Deploy: Vercel (frontend) + Railway (backend + DB)

## Notes for interviews
- Passwords are hashed with bcrypt, never stored in plain text.
- JWT is issued on login/signup and sent as `Authorization: Bearer <token>` on every request.
- All CRUD routes are scoped to `req.userId` — one user can never read/edit another user's data.
