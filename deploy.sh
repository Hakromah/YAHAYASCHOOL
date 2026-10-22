#!/bin/bash
# ====================================================================
# deploy.sh — YAHAYASCHOOL full-stack deploy / update script
# Run on Hetzner VPS: bash deploy.sh
# ====================================================================
set -e

PROJECT_DIR="/var/www/YAHAYASCHOOL"
FRONTEND_DIR="$PROJECT_DIR/frontend"
STRAPI_DIR="$PROJECT_DIR/strapicms"
NODE_ENV="production"

echo ""
echo "====================================================="
echo "  YAHAYASCHOOL — Full-Stack Deploy Script"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "====================================================="

# -------------------------------------------------------------------
# 1. Pull latest code
# -------------------------------------------------------------------
echo ""
echo "▶  [1/6] Pulling latest code from GitHub..."
cd "$PROJECT_DIR"
git pull origin main

# -------------------------------------------------------------------
# 2. Build & restart Strapi CMS
# -------------------------------------------------------------------
echo ""
echo "▶  [2/6] Installing Strapi dependencies..."
cd "$STRAPI_DIR"
npm ci --omit=dev

echo "▶  [3/6] Building Strapi CMS..."
NODE_OPTIONS='--max-old-space-size=2048' npm run build

echo "▶  [4/6] Restarting Strapi via PM2..."
pm2 restart yahaya-strapi || pm2 start "$PROJECT_DIR/ecosystem.config.js" --only yahaya-strapi --env production

# -------------------------------------------------------------------
# 3. Build & restart Next.js frontend
# -------------------------------------------------------------------
echo ""
echo "▶  [5/6] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci

echo "▶  Building Next.js (standalone mode)..."
npm run build

# Copy public + static assets into standalone output
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

echo "▶  [6/6] Restarting frontend via PM2..."
pm2 restart yahaya-frontend || pm2 start "$PROJECT_DIR/ecosystem.config.js" --only yahaya-frontend --env production

# -------------------------------------------------------------------
# 4. Save PM2 state
# -------------------------------------------------------------------
pm2 save

# -------------------------------------------------------------------
# 5. Verify
# -------------------------------------------------------------------
echo ""
echo "====================================================="
echo "  Deploy complete! Service status:"
echo "====================================================="
pm2 list | grep -E "yahaya|YAHAYA"
echo ""
echo "  Frontend  → https://hassanskdev.site        (port 3002)"
echo "  Strapi    → https://cms.hassanskdev.site     (port 1339)"
echo "====================================================="
