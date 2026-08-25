# Supabase Database Setup (AgriSmart)

The app runs on **PostgreSQL via Supabase**. Create all tables by pasting these files
in order into the Supabase SQL Editor (**Dashboard → SQL Editor → New query**):

| Order | File          | Contents                                  |
|-------|---------------|-------------------------------------------|
| 1     | `1.sql`       | `set_updated_at()` trigger fn, users, marketplace_products, shopping_cart, wishlist, seller_profiles |
| 2     | `2.sql`       | orders, order_items, order_tracking, payments |
| 3     | `3.sql`       | product_reviews, password_resets, password_change_logs |
| 4     | `4.sql`       | qna, contact_messages, contact_us, news, weather_data |
| 5     | `5.sql`       | user_accounts_meta, login_activity, admin_activity_logs, admin_notifications |
| 6     | `6.sql`       | ml_datasets, ml_models, ml_prediction_logs |
| 7     | `7.sql`       | farm_* tables (5) |
| 8     | `8.sql`       | **Upgrade only** — adds `super_admin` role, renames `admin` → `farmer`, creates accounts (run when tables already exist) |
| 9     | `admin.sql`   | (optional) super admin + farmer accounts — `superadmin`/`admin123`, `admin`/`admin` |

**Roles:** `super_admin` (full control — sees all users/farmers, promotes & demotes),
`farmer` (marketplace/admin-panel user, the former `admin` role), `vendor`, `user`.

**On a fresh database:** paste `1.sql` → `7.sql`, then `admin.sql`.
**On the database you already created:** paste only `8.sql`.

Paste `1.sql` → Run → paste `2.sql` → Run → ... until all 7 are done.
On a fresh DB, optionally run `admin.sql` last to create `superadmin`/`admin123` and
`admin`/`admin` (farmer). If tables already exist (you ran the old files), paste `8.sql`.

## Repairing a missing `users.updated_at` column

If the API reports `column "updated_at" of relation "users" does not exist`, run
`9_add_users_updated_at.sql` once in the Supabase SQL Editor, then redeploy the
API. The repair is idempotent and preserves existing user data.

## Connecting the app

1. **Supabase Dashboard → Project Settings → Database** → copy the
   **Connection string** (looks like `postgresql://postgres.xxxx:password@aws-0-...pooler.supabase.com:6543/postgres`).
2. Open `.env` and set:

   ```
   DB_DRIVER=pgsql
   DB_HOST=db.<PROJECT_REF>.supabase.co   (or the pooler host, e.g. aws-0-...pooler.supabase.com)
   DB_PORT=5432                           (use 6543 for the transaction pooler)
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASS=<your database password>
   DB_SSLMODE=require
   ```

3. Restart the PHP server: `php -S localhost:8035`

## Default data

The user accounts (`testuser`/test123, `vendor`/vendor123, `admin`/admin123 as farmer,
`superadmin`/admin123 as super admin) and the 14 sample marketplace products are **not**
in the SQL files — optionally run:

```bash
php scripts/seed_cli.php
```

from the project root after connecting (it requires the project `.env` to point at your
database). Note: `seed_cli.php` only inserts users/products; the super admin and farmer
accounts are created automatically by the app too (login as `superadmin` / `admin123` or
`admin` / `admin123` from the Admin tab).

## Verification

- Open `http://localhost:8035/system_diagnostics.php` → should list 30 tables.
- See `docs/SETUP.md` for the app-level setup.
