# TalentMatch - Intelligent Internship & Skill Matching Platform

DBMS Level 3 project - PES University

| Team member | SRN |
|---|---|
| Aks Raj Singh | PES2UG24CS044 |
| Aarush Khullar | PES2UG24CS014 |

Guide: Deena Hijam

TalentMatch connects students and recruiters. Structured data lives in **PostgreSQL**
(constraints, triggers, stored procedures, views, transactions) and the meaning of resumes and
internship descriptions is stored as **pgvector** embeddings, so students get internships ranked by
semantic similarity and recruiters get applicants ranked by fit.

## Tech stack

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS, Next.js Route Handlers as the API,
PostgreSQL + pgvector, node-postgres (`pg`), JWT sessions (`jose`) in HTTP-only cookies, bcrypt via `pgcrypto`,
embeddings with `all-MiniLM-L6-v2` (384 dimensions) through Transformers.js.

## Prerequisites

* Node.js **20.6 or newer** (`node --version`)
* PostgreSQL 14+ **with the pgvector extension** and the `psql` command line tool
* Internet access once, to download the embedding model (about 25 MB) on the first `npm run embed`

### Getting PostgreSQL with pgvector

Check whether you already have it:

```sql
SELECT name FROM pg_available_extensions WHERE name = 'vector';
```

If that returns no row, the easiest fix is Docker (works on Windows, macOS and Linux):

```bash
docker run --name talentmatch-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d pgvector/pgvector:pg16
```

Then use `-h localhost -U postgres` (password `postgres`) in the `psql` commands below.

## Setup (run from this folder)

### 1. Create the database

The scripts in `sql/` are numbered in execution order.

```bash
psql -h localhost -U postgres -f sql/01_base_ddl.sql                 # base tables  (creates database talentmatch)
psql -h localhost -U postgres -f sql/02_ddl_extended.sql             # roles, vector columns, indexes, ALTER/DROP demo
psql -h localhost -U postgres -f sql/03_routines_triggers_views.sql  # views, functions, procedures, triggers
psql -h localhost -U postgres -f sql/04_seed_dml.sql                 # sample data + UPDATE/DELETE demo
```

* If `talentmatch` already exists from Phase 1 (the seven base tables), **skip 01** and run 02, 03, 04.
* To start over: `psql -U postgres -c "DROP DATABASE talentmatch"` and run all four again.

### 2. Configure environment variables

```bash
cp .env.example .env.local        # Windows: copy .env.example .env.local
```

Edit `.env.local`: put your PostgreSQL password in `DATABASE_URL` and a long random `JWT_SECRET`
(generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
`.env.local` is ignored by Git - never commit it.

### 3. Install and generate embeddings

```bash
npm install
npm run embed          # embeds all students and internships and stores the vectors in PostgreSQL
```

### 4. Vector functions and demo queries

```bash
psql -h localhost -U postgres -f sql/05_vector.sql    # fn_recommend_internships, fn_rank_applicants + demo queries
psql -h localhost -U postgres -f sql/06_queries.sql   # report queries, transaction demo, integrity checks
```

`05_vector.sql` **must** be run (the app calls its functions). `06_queries.sql` is for the report; its last
statements are meant to fail (they demonstrate the database rejecting bad data), and it changes the sample data a
little (it applies, updates and deletes rows) - re-seed if you want the original data back.

### 5. Run the app

```bash
npm run dev            # http://localhost:3000
# production check:  npm run build && npm start
```

## Demo accounts (from `sql/04_seed_dml.sql`)

| Role | Email | Password |
|---|---|---|
| Student | ananya.rao@example.com (ML / NLP) | `Student@123` |
| Student | rahul.mehta@example.com (full stack) | `Student@123` |
| Student | priya.nair@example.com (security) | `Student@123` |
| Student | meera.joshi@example.com (frontend / design) | `Student@123` |
| Recruiter | divya@brightanalytics.example.com (Bright Analytics) | `Recruiter@123` |
| Recruiter | rohan@novatech.example.com (NovaTech Solutions) | `Recruiter@123` |
| Recruiter | manoj@cybershield.example.com (CyberShield Labs) | `Recruiter@123` |

Other seeded students: karthik.iyer, sneha.k, vikram.s, arjun.reddy (`@example.com`). You can also register new accounts.

## What to try

* **Student:** dashboard -> Internships (keyword search, filters, tick *Semantic search*) -> Recommended (match %) ->
  Apply / Save -> *Skill gap* -> My applications (status history, withdraw) -> Profile (edit resume text and skills;
  recommendations refresh).
* **Recruiter:** dashboard (funnel statistics) -> Applicants (ranked by semantic similarity) -> change a status ->
  student sees the new status and history -> Post internship -> Close / Reopen.
* **Access control:** while logged in as a student open `/recruiter/dashboard` - you are redirected.

## Where each requirement is implemented

| Requirement | Where |
|---|---|
| ER diagram, relational schema | report chapters 3-4, `sql/01`, `sql/02` |
| DDL: CREATE / ALTER / DROP, constraints, indexes | `sql/01_base_ddl.sql`, `sql/02_ddl_extended.sql` |
| DML and queries (JOIN, GROUP BY, HAVING, subqueries, window) | `sql/04_seed_dml.sql`, `sql/06_queries.sql` |
| Transactions | `sp_apply_for_internship`, SAVEPOINT demo, `PUT /api/profile`, `POST /api/recruiter/internships` |
| Triggers | `sql/03` - validate application, applicant counter, updated_at, status audit history |
| Stored procedures / functions | `sql/03`, `sql/05` |
| Views | `sql/03` |
| Full-text search (GIN) | `GET /api/internships?q=` |
| Vector similarity search (HNSW, cosine) | `sql/05`, `GET /api/recommendations`, `GET /api/internships/search` |
| Authentication, 2 roles | `src/lib/auth.ts`, `src/middleware.ts`, `/api/auth/*` |
| Secrets not hard-coded | `.env.local`, `src/lib/db.ts` |
| Passwords hashed | bcrypt through `crypt(..., gen_salt('bf', 10))` in PostgreSQL |

## Project structure

```
src/app/            pages (student/, recruiter/, login, register) and API route handlers (api/)
src/components/     Navbar, InternshipCard, StatCard, StatusBadge, ApplicationTable
src/lib/            db.ts (pool), auth.ts (JWT), embeddings.ts (MiniLM), api.ts, client.ts, types.ts
src/middleware.ts   role-based route protection
scripts/embed.mjs   generates and stores embeddings
sql/                numbered SQL scripts (see Setup)
```

## Troubleshooting

* **`extension "vector" is not available`** - pgvector is not installed in your PostgreSQL. Use the Docker command above.
* **`password authentication failed`** - fix the password in `DATABASE_URL` inside `.env.local`.
* **`database "talentmatch" already exists`** - skip script 01 (see Setup step 1).
* **Semantic search shows "keyword search was used instead"** - the embedding model could not be loaded (no internet on first
  run). Connect to the internet and run `npm run embed` again; the model is cached afterwards.
* **`node: bad option: --env-file`** - upgrade Node.js to 20.6 or newer.
* **Login works but pages redirect to /login** - `JWT_SECRET` is missing or empty in `.env.local`; restart `npm run dev` after editing it.
