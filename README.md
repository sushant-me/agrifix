# AgriSmart

[![CI](https://github.com/sushant-me/agrifix/actions/workflows/ci.yml/badge.svg)](https://github.com/sushant-me/agrifix/actions/workflows/ci.yml)

**Smart agriculture platform** for Nepal — a full-stack marketplace, farmer workspace and AI-driven advisory suite.

React + Vite front end, Express REST API, PostgreSQL on Supabase. Hosted AI calls use Hugging Face and automatically fall back to a bundled Nepal-agriculture knowledge base when unavailable. The repository includes an optional, reproducible Python ML pipeline, but no training data or trained artifact is shipped.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite 5, React Router 6, plain CSS |
| Backend  | Node.js ≥ 20, Express 4, `pg`, multer, JWT + httpOnly cookies |
| Database | PostgreSQL (Supabase), 30+ tables |
| Payments | Khalti ePayment (dev keys) |
| Email    | Nodemailer (SMTP / Mailtrap for OTP) |
| Media    | Cloudinary (client-side upload) + local `server/uploads` |
| AI/ML    | Hugging Face text/vision inference, Nepal rules, optional scikit-learn service |

## Roles

| Role          | Access |
|---------------|--------|
| `super_admin` | Everything: user & role management, all orders, farmer applications, ML datasets/models, activity log |
| `farmer`      | Farmer Panel: sells products, manages listings, tracks sales, resolves orders |
| `vendor`      | Standard account with ability to sell |
| `user`        | Browse, chat, order, reviews, predictions |

Login from the login page — demo accounts:

| Username     | Password   | Role         |
|--------------|------------|--------------|
| `superadmin` | `admin123` | Super admin  |
| `admin`      | `admin`    | Farmer       |
| `vendor`     | `vendor123`| Vendor       |
| `testuser`   | `test123`  | User         |

## Project structure

```
├── client/                 # React app (Vite)
│   └── src/
│       ├── api/client.js   # Axios instance (cookies, base URL)
│       ├── context/        # AuthContext
│       ├── components/     # Layouts, Navbar, charts…
│       ├── pages/          # user/, farmer(panel)/, admin/, predictions/…
│       └── styles.css
├── server/
│   ├── .env.example        # Copy to server/.env
│   ├── src/
│   │   ├── routes/index.js # All 96 API routes
│   │   ├── controllers/    # auth, user, marketplace, cart, order, payment,
│   │   │                   # farmer, admin, weather, ml, support
│   │   ├── middlewares/    # auth, error handler, rate limit
│   │   └── utils/          # hf.js (Hugging Face), nepalAgri.js (offline base)
│   └── uploads/            # Multer uploads (avatars, product images, docs)
├── sql/                    # Supabase schema (run 1.sql → 7.sql)
├── public/                 # Marketing/documentation assets
└── package.json            # Root scripts (concurrently)
```

## Quick start

## ML status and architecture

Existing functionality is a hybrid advisory system: crop recommendation, crop-by-location prediction, fertilizer guidance, yield estimates, and rainfall tables are deterministic rules in `server/src/utils/nepalAgri.js`; Llama 3.3 is prompt-based text generation when explicitly called; Qwen 2.5 VL and a hosted plant classifier are pretrained inference only. Nepal province, district, Terai/Hill/Mountain, season, weather, and soil context remain intact.

New functionality is under `server/ml`: header-only dataset contracts, validation, missing-value handling, categorical encoding, train/validation holdout, Random Forest classification, two-regressor comparison, measured metrics, confusion matrices, and serialized `joblib` artifacts. `server/ml/inference_service.py` serves those artifacts, and the crop recommendation endpoint uses it only when `ML_SERVICE_URL` is configured and a valid trained artifact exists. Otherwise the response explicitly reports `offline-rule-based` and `indicative-guidance`.

The repository contains no agriculture rows, disease image dataset, notebooks, trained model files, LoRA adapter, or fine-tuning pipeline. Therefore it contains no defensible accuracy claim and does not claim that Qwen or Llama has been fine-tuned. Copy a template in `server/ml/datasets`, add sourced observations, and follow `server/ml/README.md`; training refuses insufficient data rather than fabricating metrics. Yield and rainfall pipelines are ready for real data, but their current UI endpoints remain rule-based until their required historical features are collected and a service integration is validated.

Prerequisites: **Node.js ≥ 20**, a **Supabase** project (or any PostgreSQL), `openssl` for the JWT secret.

### 1. Database

1. Supabase → **SQL Editor**, paste and run in order: `sql/1.sql` → `sql/2.sql` → … → `sql/7.sql`.
2. On a fresh database, finish with `sql/admin.sql` to create the demo accounts above.
   - Already have old tables? Run only `sql/8.sql` (upgrade).
3. Take the **connection string** from Project Settings → Database → Connection string.

### 2. Environment

```bash
cp server/.env.example server/.env
```

Fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` (Supabase: `db.<ref>.supabase.co` / port `5432`, or port `6543` with the pooler), and:

```bash
openssl rand -hex 32     # → set JWT_SECRET
```

Khalti, SMTP, Cloudinary and `WEATHER_API_KEY` are optional (payments/email/weather features need them).

### 3. Install & run

```bash
npm install                 # root (concurrently)
npm install --prefix client
npm install --prefix server
npm run dev                 # API on :4000, Vite app on :5173
```

Open **http://localhost:5173**.

### Scripts

| Command                  | What it does                                   |
|--------------------------|------------------------------------------------|
| `npm run dev`            | Run API (:4000) + Vite dev server (:5173)      |
| `npm run build`          | Production build of the client                 |
| `npm start`              | Start the API server only                      |
| `npm run preview`        | Serve the built client via Vite preview        |

### Production

```bash
npm run build
# in server/.env: SERVE_CLIENT=true, CLIENT_URL=http://localhost:4000
npm start
```

The Express server then serves the built React app and the API from **http://localhost:4000**.

## Key API areas

| Area | Base route | Notes |
|------|-----------|-------|
| Auth | `/api/auth/*` | Signup/login/logout, `/auth/me`, change/forgot/reset password, avatar |
| Marketplace | `/api/products`, `/api/cart`, `/api/wishlist`, `/api/orders` | Pagination, reviews, Khalti payments, tracking, refunds |
| Chat | `/api/conversations*`, `/api/chat/heartbeat` | 1:1 conversations, unread handling, online presence |
| ML + Weather | `/api/ml/*`, `/api/weather/*` | 5 predictor endpoints + plant-disease image upload (vision model) |
| Farmer | `/api/farmer/apply`, `/api/admin/farmer/*` | Onboarding, seller workspace, sales management |
| Admin | `/api/admin/*` | Dashboard, users & roles, orders, news, Q&A, ML datasets/models, farm data, activity log |

Responses follow `{ success, data }`; errors return `{ success: false, error }` with proper HTTP status codes.

## AI/ML design

- Prediction endpoints call Hugging Face (text + vision) through `server/src/utils/hf.js`.
- On any failure (offline, timeout, quota) they fall back to the **offline knowledge base** in `server/src/utils/nepalAgri.js` — the pages never break.
- The legacy empty `ML/` folder was removed; no Python code lives in this repo.

## License

Private project — for demonstration and academic use.