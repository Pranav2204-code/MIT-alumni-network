# MIT-WPU Alumni Network

A full-stack alumni network platform for MIT-WPU with a **gamified referral system** — students spend scarce "referral points" (earned by passing quizzes) to request referrals from verified alumni.

---

## Table of Contents

- [Concept](#concept)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [System Design](#system-design)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security Architecture](#security-architecture)
- [Getting Started](#getting-started)
- [Seeding Data](#seeding-data)
- [Environment Variables](#environment-variables)

---

## Concept

**The Core Mechanic — Referral Points as Hinge Hearts**

Students start with a small number of referral points (configurable via env, default 2). They can earn more by:
1. Passing quizzes (topic-based, server-graded, with a 7-day cooldown per quiz)
2. CGPA milestones (admin awards, planned for Phase 2)

Each referral request costs **1 point**. If an alumni declines, the point is **automatically refunded**. This scarcity makes every request deliberate and meaningful, which in turn makes alumni more willing to engage.

**Why not .edu.in email for alumni verification?**

MIT-WPU alumni lose their institutional email after graduation. Verification is instead done against a university-seeded database using:
- PRN (university roll number)
- Full name (case-insensitive match)
- Date of birth (stored as a bcrypt hash — never plaintext)

---

## Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, React Router v6, Zustand, Axios |
| Backend     | Node.js, Express 4, Mongoose 8              |
| Database    | MongoDB (Atlas or self-hosted)              |
| Auth        | JWT in httpOnly cookies (XSS-safe)          |
| Validation  | Zod (server-side schema validation)         |
| Security    | Helmet, CORS, express-rate-limit, bcrypt    |

---

## Project Structure

```
mit-alumni-network/
├── backend/
│   ├── server.js                    # Entry point
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js                   # Express app (middleware, routes)
│       ├── config/
│       │   └── db.js                # Mongoose connection
│       ├── models/
│       │   ├── VerificationRecord.js # University PRN seed data
│       │   ├── User.js              # Core user model
│       │   ├── PointsLedger.js      # Append-only points audit log
│       │   ├── Job.js               # Job postings
│       │   ├── ReferralRequest.js   # Referral requests (state machine)
│       │   ├── Quiz.js              # Quiz definitions
│       │   ├── QuizAttempt.js       # Attempt records + cooldown
│       │   └── Notification.js      # In-app notifications (TTL 90d)
│       ├── controllers/
│       │   ├── auth.controller.js   # verifyPrn, register, login, logout
│       │   ├── user.controller.js   # directory, profile, points, notifications
│       │   ├── job.controller.js    # CRUD for job posts
│       │   ├── referral.controller.js # request, respond, list
│       │   ├── quiz.controller.js   # list, attempt, submit (server-graded)
│       │   └── admin.controller.js  # user mgmt, quiz mgmt, stats
│       ├── middleware/
│       │   ├── auth.middleware.js   # protect, restrictTo, optionalAuth
│       │   ├── rateLimit.middleware.js # tiered rate limits
│       │   └── validate.middleware.js  # Zod schema factory
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── job.routes.js
│       │   ├── referral.routes.js
│       │   ├── quiz.routes.js
│       │   └── admin.routes.js
│       ├── utils/
│       │   ├── jwt.utils.js         # sign, verify, sendTokenResponse
│       │   ├── url.utils.js         # WHATWG URL-based social link validator
│       │   └── points.utils.js      # awardPoints, spendPoints (atomic)
│       └── scripts/
│           ├── seedVerification.js  # CSV → VerificationRecord
│           └── seedQuizzes.js       # Seed 5 starter quizzes
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                  # Routes + auth guard
        ├── main.jsx
        ├── index.css                # Tailwind + component classes
        ├── lib/
        │   └── axios.js             # Configured Axios instance
        ├── store/
        │   └── authStore.js         # Zustand auth store
        ├── components/
        │   ├── auth/
        │   │   ├── ProtectedRoute.jsx
        │   │   └── RoleRoute.jsx
        │   └── layout/
        │       ├── AppLayout.jsx
        │       ├── AuthLayout.jsx
        │       ├── Sidebar.jsx
        │       └── TopBar.jsx
        └── pages/
            ├── auth/
            │   ├── VerifyPrnPage.jsx   # Step 1 registration
            │   ├── RegisterPage.jsx    # Step 2 registration
            │   └── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── DirectoryPage.jsx
            ├── UserProfilePage.jsx
            ├── JobBoardPage.jsx
            ├── JobDetailPage.jsx
            ├── PostJobPage.jsx
            ├── QuizzesPage.jsx
            ├── QuizAttemptPage.jsx
            ├── WalletPage.jsx
            ├── ReferralsPage.jsx
            ├── SettingsPage.jsx
            ├── AdminPage.jsx
            └── NotFoundPage.jsx
```

---

## System Design

### Registration Flow (Two-Step)

```
Step 1 — /auth/verify-prn
  Client sends: PRN + fullName + DOB
  Server:
    1. Look up VerificationRecord by PRN
    2. Case-insensitive name match
    3. bcrypt.compare(DOB, record.dobHash)
    4. If match → return verificationData (prn, name, dept, year)
    5. Never return the hash

Step 2 — /auth/register (MongoDB Transaction)
  Client sends: PRN (from step 1) + email + password
  Server:
    1. Re-check PRN not claimed (race-condition guard)
    2. Check email uniqueness
    3. Derive role from graduationYear vs currentYear
    4. Create User
    5. Mark VerificationRecord.claimed = true
    6. Write signup bonus to PointsLedger
    7. Commit transaction
    8. Set httpOnly JWT cookie
```

### Referral Request Flow (MongoDB Transaction)

```
POST /api/v1/referrals
  1. Validate job exists + has slots
  2. Prevent self-referral
  3. Prevent duplicate request (unique index)
  4. Atomic point spend:
     findOneAndUpdate({ referralPoints: { $gte: 1 } }, { $inc: { referralPoints: -1 } })
     → returns null if balance insufficient (no race condition possible)
  5. Create ReferralRequest
  6. Increment job.referralsFilled
  7. Create Notification for alumni
  8. Commit
```

### Quiz Grading (Server-Side Only)

```
GET /quizzes/:id/attempt    → returns questions WITHOUT correctIndex
POST /quizzes/:id/submit    → server fetches quiz WITH +correctIndex
                              grades answers
                              awards points only on FIRST pass per cooldown window
                              saves QuizAttempt with cooldownUntil
                              returns questions WITH correctIndex + explanations
```

### Points Economy

| Event                      | Points |
|----------------------------|--------|
| Signup bonus               | +2     |
| Pass a quiz                | +1     |
| Request a referral         | -1     |
| Referral declined (refund) | +1     |

All point movements write an immutable `PointsLedger` entry with `balanceAfter` snapshot for full auditability.

---

## Database Schema

### VerificationRecord
```
prn          String  (indexed, unique, uppercase)
fullName     String
department   String
degree       String
graduationYear Number
dobHash      String  (bcrypt, select: false)
claimed      Boolean
claimedBy    ref:User
claimedAt    Date
```

### User
```
prn              String  (unique)
email            String  (unique, lowercase)
password         String  (bcrypt, select: false)
role             Enum[student, alumni, admin]
fullName         String
department       String
degree           String
graduationYear   Number
bio              String
jobTitle         String
company          String
location         String
techStack        [String]
cgpa             Number
socialLinks      { linkedin, github, leetcode, codeforces, hackerrank, portfolio }
referralPoints   Number  (atomic $inc only)
isVerified       Boolean (alumni require admin approval)
isActive         Boolean
isProfileComplete Boolean
verificationRecord ref:VerificationRecord
```

### PointsLedger (append-only)
```
user         ref:User
amount       Number  (signed: positive=earn, negative=spend)
balanceAfter Number  (snapshot at time of transaction)
type         Enum[earn_quiz, earn_cgpa, earn_signup_bonus, earn_admin,
                  spend_referral, refund_referral, deduct_admin]
description  String
performedBy  ref:User (for admin operations)
refModel     String
refId        ObjectId
```

### ReferralRequest (state machine)
```
requestedBy    ref:User (student)
requestedFrom  ref:User (alumni)
job            ref:Job
status         Enum[pending, accepted, declined, expired]  (default: pending)
message        String
responseNote   String
pointsSpent    Number
pointsRefunded Boolean
spendLedgerId  ref:PointsLedger
refundLedgerId ref:PointsLedger
expiresAt      Date  (TTL index, 14 days)
respondedAt    Date

Unique index: { requestedBy, job } — one request per job per student
```

### Quiz
```
title          String
category       Enum[cybersecurity, dsa, networking, web_dev, os, dbms, ml, aptitude]
timeLimitMinutes Number
questions      [{
  text         String
  options      [String] (4 options)
  correctIndex Number  (select: false — never sent to client)
  explanation  String
  difficulty   Enum[easy, medium, hard]
}]
passScore      Number (percentage, default 70)
pointsAwarded  Number (default 1)
isActive       Boolean
```

### QuizAttempt
```
user           ref:User
quiz           ref:Quiz
answers        [{ questionId, selectedIndex, isCorrect }]
totalQuestions Number
correctAnswers Number
score          Number (percentage)
passed         Boolean
pointsAwarded  Number
cooldownUntil  Date  (indexed — enforced server-side)
timeTakenSeconds Number
ledgerId       ref:PointsLedger
```

### Job
```
postedBy       ref:User (alumni)
title          String
company        String
location       String
isRemote       Boolean
jobType        Enum[full_time, part_time, internship, contract]
domain         Enum[software, data, cybersecurity, devops, design, ...]
description    String
requirements   String
skillsRequired [String]
salaryMin      Number
salaryMax      Number
referralSlots  Number (default 5, max 20)
referralsFilled Number
deadline       Date
externalLink   String (URL)
isActive       Boolean
isDeleted      Boolean (soft delete)
```

### Notification
```
recipient      ref:User
type           Enum[referral_request_received, referral_request_accepted,
                    referral_request_declined, points_earned, system_message]
title          String
message        String
actionUrl      String
isRead         Boolean
refModel       String
refId          ObjectId
TTL index: 90 days (auto-delete)
```

---

## API Reference

### Auth
| Method | Path                    | Auth | Description                    |
|--------|-------------------------|------|--------------------------------|
| POST   | /auth/verify-prn        | —    | Step 1: verify PRN+name+DOB    |
| POST   | /auth/register          | —    | Step 2: create account         |
| POST   | /auth/login             | —    | Login → set httpOnly cookie    |
| POST   | /auth/logout            | —    | Clear cookie                   |
| GET    | /auth/me                | ✓    | Current user                   |

### Users
| Method | Path                                  | Auth | Description              |
|--------|---------------------------------------|------|--------------------------|
| GET    | /users                                | ✓    | Alumni directory          |
| GET    | /users/:id                            | ✓    | Public profile            |
| PATCH  | /users/me                             | ✓    | Update own profile        |
| GET    | /users/me/points                      | ✓    | Wallet balance + history  |
| GET    | /users/me/notifications               | ✓    | Notifications             |
| PATCH  | /users/me/notifications/read-all      | ✓    | Mark all read             |

### Jobs
| Method | Path        | Auth    | Roles              | Description     |
|--------|-------------|---------|-------------------|-----------------|
| GET    | /jobs       | —       | —                  | Job board        |
| GET    | /jobs/:id   | —       | —                  | Job detail       |
| POST   | /jobs       | ✓       | alumni, admin      | Post a job       |
| PATCH  | /jobs/:id   | ✓       | alumni, admin      | Edit own job     |
| DELETE | /jobs/:id   | ✓       | alumni, admin      | Soft delete      |
| GET    | /jobs/my-posts | ✓    | alumni, admin      | Own job posts    |

### Referrals
| Method | Path                     | Auth | Roles        | Description               |
|--------|--------------------------|------|--------------|---------------------------|
| POST   | /referrals               | ✓    | student      | Request referral (costs 1pt) |
| GET    | /referrals/sent          | ✓    | student      | Outgoing requests          |
| GET    | /referrals/received      | ✓    | alumni,admin | Incoming requests          |
| PATCH  | /referrals/:id/respond   | ✓    | alumni,admin | Accept or decline          |

### Quizzes
| Method | Path                  | Auth | Description                      |
|--------|-----------------------|------|----------------------------------|
| GET    | /quizzes              | ✓    | List quizzes + user attempt status |
| GET    | /quizzes/my-attempts  | ✓    | Attempt history                   |
| GET    | /quizzes/:id/attempt  | ✓    | Quiz questions (no answers)       |
| POST   | /quizzes/:id/submit   | ✓    | Submit → server grades → points   |

### Admin
| Method | Path                          | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| GET    | /admin/stats                  | ✓    | Platform stats           |
| GET    | /admin/users                  | ✓    | All users                |
| PATCH  | /admin/users/:id/verify       | ✓    | Verify alumni            |
| PATCH  | /admin/users/:id/toggle-active| ✓    | Suspend/reinstate        |
| POST   | /admin/users/:id/award-points | ✓    | Manually adjust points   |
| POST   | /admin/quizzes                | ✓    | Create quiz              |
| PATCH  | /admin/quizzes/:id            | ✓    | Update quiz              |
| DELETE | /admin/quizzes/:id            | ✓    | Deactivate quiz          |
| GET    | /admin/verification-records   | ✓    | View seed records        |

---

## Security Architecture

### Authentication
- JWT stored in **httpOnly, Secure, SameSite=Strict** cookie — JavaScript cannot read it (XSS-safe)
- JWT also returned in response body for mobile/API client flexibility
- Fresh DB lookup on every protected request (`protect` middleware) — immediately reflects bans/deactivations

### Input Validation
- Zod schemas on every mutating route — returns field-level 422 errors
- Body size limit: 10 KB
- Social links validated with **WHATWG `new URL()`** parser + hostname allowlist (prevents `evil.com/linkedin.com/` bypass)

### Rate Limiting
| Limiter             | Limit              |
|---------------------|--------------------|
| Global              | 100 req / 15 min   |
| Auth endpoints      | 10 req / 15 min    |
| PRN verification    | 5 req / hour       |
| Quiz submission     | 20 req / hour      |

### Race Condition Prevention
- Point spending uses **conditional atomic `$inc`**:  
  `findOneAndUpdate({ referralPoints: { $gte: 1 } }, { $inc: { referralPoints: -1 } })`  
  Returns `null` if balance < 1 — two concurrent requests cannot both succeed.
- Registration, referral creation use **MongoDB multi-document transactions**.
- Duplicate referral requests blocked by **unique compound index `{ requestedBy, job }`**.

### Data Privacy
- DOB stored as bcrypt hash only — never plaintext, never returned to client
- Password bcrypt hash excluded from all queries (`select: false`) and stripped by `toJSON()`
- Soft deletes (`isDeleted: true`) preserve referential integrity

### Quiz Integrity
- `correctIndex` has `select: false` — never included in queries unless explicitly `+questions.correctIndex`
- `getQuizForAttempt` explicitly strips answers before sending to client
- All grading is **server-side** — client sends only selected indices, server compares against DB values

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+ (Atlas free tier works)

### 1. Clone and install

```bash
git clone <repo>
cd mit-alumni-network
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MONGO_URI and JWT_SECRET
```

### 3. Seed data

```bash
# Seed verification records from CSV
npm run seed:verification -- --file ./backend/src/data/students.csv

# Seed starter quizzes
npm run seed:quizzes
```

### 4. Run development servers

```bash
# Terminal 1 — backend (port 5000)
npm run dev:backend

# Terminal 2 — frontend (port 5173, proxied to backend)
npm run dev:frontend
```

Open http://localhost:5173

---

## Seeding Data

### Verification Records (CSV)

The CSV must have these columns in order:
```
prn,fullName,department,degree,graduationYear,dob
MIT2020CS001,Pranav Rathi,Computer Science,B.Tech,2024,2002-05-15
```

DOB formats accepted: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`

```bash
node backend/src/scripts/seedVerification.js --file ./students.csv
# Add --clear to wipe existing records first
```

### Admin users

Add PRNs to `ADMIN_PRNS` in `.env` (comma-separated). Users with those PRNs will get `role: admin` on registration.

```
ADMIN_PRNS=MIT2020CS001,MIT2019CS042
```

---

## Environment Variables

| Variable                    | Default | Description                              |
|-----------------------------|---------|------------------------------------------|
| `PORT`                      | 5000    | Express server port                      |
| `NODE_ENV`                  | development | `production` enables secure cookies  |
| `MONGO_URI`                 | —       | MongoDB connection string                |
| `JWT_SECRET`                | —       | At least 32 random chars                 |
| `JWT_EXPIRES_IN`            | 7d      | Token expiry                             |
| `JWT_COOKIE_EXPIRES_DAYS`   | 7       | Cookie max-age                           |
| `FRONTEND_URL`              | http://localhost:5173 | CORS origin              |
| `ADMIN_PRNS`                | —       | Comma-separated PRNs for admin role      |
| `INITIAL_REFERRAL_POINTS`   | 2       | Points given on signup                   |
| `QUIZ_PASS_SCORE`           | 70      | Minimum % to pass a quiz                 |
| `POINTS_PER_QUIZ_PASS`      | 1       | Points awarded per quiz pass             |
| `QUIZ_COOLDOWN_HOURS`       | 168     | Hours before same quiz earns again (7d)  |
| `POINTS_PER_CGPA_MILESTONE` | 1       | Points for CGPA milestone (future)       |
| `CGPA_MILESTONE_THRESHOLD`  | 9.0     | CGPA level that triggers milestone       |

---

## Roadmap

- **Phase 2** — CGPA milestone auto-detection on profile update  
- **Phase 2** — Alumni response-rate badges (gamify alumni side)  
- **Phase 2** — Leaderboard (top point earners, top referrers)  
- **Phase 3** — Email notifications (Nodemailer / SendGrid)  
- **Phase 3** — Admin quiz builder UI  
- **Phase 3** — Mobile app (React Native, same backend)
