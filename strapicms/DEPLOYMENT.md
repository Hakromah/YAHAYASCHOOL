# Strapi CMS Deployment Guide
## Platform: Strapi Cloud (cloud.strapi.io — Free Tier)

The project already has @strapi/plugin-cloud installed — it is ready to deploy.

---

## What Strapi Cloud Free Tier Includes
- 1 free project
- Managed PostgreSQL database (auto-configured, no DATABASE_URL needed)
- 5 GB media storage (but use Cloudinary below for persistence guarantee)
- Always-on — no sleep like Render free tier
- Auto-deploy from GitHub
- URL: https://YOUR-PROJECT.api.strapiapp.com

---

## Step 1 — Push to GitHub

`ash
cd C:\Users\pc\YAHAYASCHOOL
git add strapicms/
git commit -m "feat: production-ready Strapi config with Cloudinary + Cloud support"
git push
`

---

## Step 2 — Create a Strapi Cloud Project

1. Go to https://cloud.strapi.io → Sign Up / Log In
2. Click **+ Create project** → **Free plan**
3. Connect GitHub → select your YAHAYASCHOOL repo
4. Settings:
   - **Root directory**: strapicms
   - **Node version**: 20.x
   - **Install command**: 
pm install
   - **Build command**: 
pm run build
   - **Start command**: 
pm run start
5. Click **Deploy**

Strapi Cloud auto-injects DATABASE_URL, HOST, PORT — you do NOT need to set those manually.

---

## Step 3 — Set Environment Variables in Strapi Cloud

Go to your project → **Settings** → **Variables** → add these:

### Secrets (copy exactly from your local .env)
| Variable | Value |
|----------|-------|
| APP_KEYS | 1CrQl/ED6vpDwFaUXs2loA==,HIlY/G5m5u7WQsuT11MKfA==,M/Yf4vD2MmPq/wzziWB2sw==,tJSYbZ8Y3FQ4ZwSfwv0kUQ== |
| API_TOKEN_SALT | mIQ2zu35975MLvOtVwxgDQ== |
| ADMIN_JWT_SECRET | /rCx9xk3vO2io8UNSfJEAA== |
| JWT_SECRET | WkHDHCyj+pdtwzfDXFuK7Q== |
| TRANSFER_TOKEN_SALT | YaZshfr/v1WJ3uI3wu9J4A== |
| ENCRYPTION_KEY | Uv1twuIfzo9uuiGWOenkNw== |

### Cloudinary — Image Storage (persistent media)
| Variable | Value |
|----------|-------|
| CLOUDINARY_NAME | db9wzb7z5 |
| CLOUDINARY_KEY | 833288718934649 |
| CLOUDINARY_SECRET | eqntQn9Dk8eozNyCuwQWDybpu58 |
| CLOUDINARY_FOLDER | yahaya-school |

### Frontend CORS
| Variable | Value |
|----------|-------|
| FRONTEND_URL | https://yahayaschool.vercel.app |
| STRAPI_TELEMETRY_DISABLED | true |

DO NOT set DATABASE_URL, DATABASE_HOST, PORT, HOST — Strapi Cloud manages these automatically.

---

## Step 4 — Get Your Strapi Cloud URL

After deploy succeeds, your URL will be:
  https://YOUR-PROJECT-NAME.api.strapiapp.com

Example: https://yahaya-school.api.strapiapp.com

---

## Step 5 — Wire the Vercel Frontend

1. Go to vercel.com → yahayaschool project → Settings → Environment Variables
2. Add / update:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_STRAPI_URL | https://YOUR-PROJECT-NAME.api.strapiapp.com |
| NEXT_PUBLIC_APP_URL | https://yahayaschool.vercel.app |
| NEXT_PUBLIC_APP_NAME | YAHAYASCOOL |
| NEXT_PUBLIC_SCHOOL_NAME | Yahaya International Islamic and English High School |
| NEXT_PUBLIC_DEFAULT_LOCALE | en |
| STRAPI_API_TOKEN | (generate in Step 6) |

3. Redeploy on Vercel to pick up the new env vars.

---

## Step 6 — Generate a Strapi API Token

1. Open https://YOUR-PROJECT-NAME.api.strapiapp.com/admin
2. Log in with admin credentials
3. Settings -> API Tokens -> + Create new API Token
4. Name: Vercel Frontend | Type: Read-only | Duration: Unlimited
5. Copy token -> paste into Vercel as STRAPI_API_TOKEN

---

## Step 7 — Hetzner VPS Migration (when project is complete)

1. Install Node 20+, PostgreSQL on the VPS
2. git clone the repo on VPS, cd strapicms
3. Copy all env vars from Strapi Cloud Variables tab into a .env file
   (add DATABASE_URL from your new Postgres instance)
4. npm install && npm run build && npm run start
5. Point NEXT_PUBLIC_STRAPI_URL in Vercel to your VPS domain/IP
6. Cloudinary images keep working — zero media migration needed

---

## Strapi Cloud Free Tier Limits

| Resource | Limit |
|----------|-------|
| Projects | 1 |
| Database rows | Unlimited |
| Media storage | 5 GB (use Cloudinary to bypass) |
| Bandwidth | 100 GB/month |
| Always-on | YES (no sleep unlike Render free) |
| Custom domain | Paid plan only |
