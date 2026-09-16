# Strapi CMS Deployment Guide
## Platform: Render.com (Free Web Service + Free PostgreSQL)

---

## Render Free Tier Limits

| Resource | Limit |
|----------|-------|
| Web Service | 750 hrs/month (enough for 1 always-on service) |
| PostgreSQL | 1 GB storage, 97-day TTL (keep active) |
| Sleep after inactivity | 15 min (fix with UptimeRobot in Step 7) |
| Custom domain | YES (free) |

---

## Step 1 — Push to GitHub

`ash
cd C:\Users\pc\YAHAYASCHOOL
git add strapicms/
git commit -m "feat: production-ready Strapi config with Cloudinary + Render support"
git push
`

---

## Step 2 — Create a PostgreSQL Database on Render

1. Go to https://dashboard.render.com -> New + -> PostgreSQL
2. Fill in:
   - Name: yahaya-school-db
   - Database: yahaya_scool
   - User: yahaya_user
   - Region: Frankfurt (EU Central) — closest to Nigeria
   - Plan: Free
3. Click Create Database
4. Once created, go to the database page and copy the Internal Database URL:
   postgresql://yahaya_user:XXXX@dpg-XXXX-a.frankfurt-postgres.render.com/yahaya_scool

---

## Step 3 — Create a Web Service for Strapi

1. New + -> Web Service
2. Connect GitHub -> select YAHAYASCHOOL repo
3. Settings:
   - Name: yahaya-strapi
   - Root Directory: strapicms
   - Runtime: Node
   - Build Command: npm install && npm run build
   - Start Command: npm run start
   - Plan: Free
4. Click Create Web Service

Your Strapi URL will be: https://yahaya-strapi.onrender.com

---

## Step 4 — Set Environment Variables on Render

Go to your Web Service -> Environment tab -> Add these one by one:

### Strapi Secrets
| Variable | Value |
|----------|-------|
| APP_KEYS | 1CrQl/ED6vpDwFaUXs2loA==,HIlY/G5m5u7WQsuT11MKfA==,M/Yf4vD2MmPq/wzziWB2sw==,tJSYbZ8Y3FQ4ZwSfwv0kUQ== |
| API_TOKEN_SALT | mIQ2zu35975MLvOtVwxgDQ== |
| ADMIN_JWT_SECRET | /rCx9xk3vO2io8UNSfJEAA== |
| JWT_SECRET | WkHDHCyj+pdtwzfDXFuK7Q== |
| TRANSFER_TOKEN_SALT | YaZshfr/v1WJ3uI3wu9J4A== |
| ENCRYPTION_KEY | Uv1twuIfzo9uuiGWOenkNw== |

### Database (paste Internal DB URL from Step 2)
| Variable | Value |
|----------|-------|
| DATABASE_CLIENT | postgres |
| DATABASE_URL | postgresql://yahaya_user:5b1yLSqsxkZVQzMgdAKk6iziIzhwzG4o@dpg-dakr0bqjnfac73bm81kg-a/yahaya_scool
| DATABASE_SSL | true |
| DATABASE_SSL_REJECT_UNAUTHORIZED | false |
| DATABASE_POOL_MIN | 1 |
| DATABASE_POOL_MAX | 3 |

### Cloudinary — Persistent Image Storage
| Variable | Value |
|----------|-------|
| CLOUDINARY_NAME | db9wzb7z5 |
| CLOUDINARY_KEY | 833288718934649 |
| CLOUDINARY_SECRET | eqntQn9Dk8eozNyCuwQWDybpu58 |
| CLOUDINARY_FOLDER | yahaya-school |

### Server + CORS
| Variable | Value |
|----------|-------|
| HOST | 0.0.0.0 |
| PORT | 1339 |
| NODE_ENV | production |
| FRONTEND_URL | https://yahayaschool.vercel.app |
| STRAPI_TELEMETRY_DISABLED | true |

---

## Step 5 — Deploy

Click Deploy Latest Commit. First deploy takes 3-5 minutes.
Once it shows Live, your Strapi admin is at:
  https://yahaya-strapi.onrender.com/admin

---

## Step 6 — Wire the Vercel Frontend

1. Go to vercel.com -> yahayaschool project -> Settings -> Environment Variables
2. Add / update:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_STRAPI_URL | https://yahaya-strapi.onrender.com |
| NEXT_PUBLIC_APP_URL | https://yahayaschool.vercel.app |
| NEXT_PUBLIC_APP_NAME | YAHAYASCOOL |
| NEXT_PUBLIC_SCHOOL_NAME | Yahaya International Islamic and English High School |
| NEXT_PUBLIC_DEFAULT_LOCALE | en |
| STRAPI_API_TOKEN | (generate in Step 7 below) |

3. Redeploy on Vercel to pick up the new env vars.

---

## Step 7 — Generate a Strapi API Token

1. Open https://yahaya-strapi.onrender.com/admin
2. Log in (admin password: Admin@Yahaya2025!)
3. Settings -> API Tokens -> + Create new API Token
4. Name: Vercel Frontend | Type: Read-only | Duration: Unlimited
5. Copy token -> paste into Vercel as STRAPI_API_TOKEN

---

## Step 8 — Prevent Free-Tier Sleep (IMPORTANT)

Render free web services sleep after 15 min of inactivity.
First request after sleep takes ~30 seconds (cold start).

Fix: Set up a free uptime monitor at https://uptimerobot.com
- Monitor type: HTTP(s)
- URL: https://yahaya-strapi.onrender.com/api/campuses
- Check interval: Every 5 minutes
- This keeps Strapi always awake at zero cost.

---

## Step 9 — Hetzner VPS Migration (when project is complete)

1. Install Node 20+ and PostgreSQL on the VPS
2. git clone the repo, cd strapicms
3. Create a .env file with all the vars from Step 4 above
   (change DATABASE_URL to point to your local Postgres)
4. npm install && npm run build && npm run start
5. Point NEXT_PUBLIC_STRAPI_URL in Vercel to your VPS domain
6. Cloudinary images keep working with zero migration needed.
