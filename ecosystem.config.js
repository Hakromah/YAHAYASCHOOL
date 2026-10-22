// PM2 Ecosystem Config — YAHAYASCHOOL (Hetzner VPS)
// Run: pm2 start ecosystem.config.js --env production
// Ports: frontend=3002, strapicms=1339

module.exports = {
  apps: [
    {
      name: 'yahaya-frontend',
      cwd: '/var/www/YAHAYASCHOOL/frontend',
      script: 'node',
      args: '.next/standalone/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      restart_delay: 3000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/yahaya-frontend-error.log',
      out_file: '/var/log/pm2/yahaya-frontend-out.log',
    },
    {
      name: 'yahaya-strapi',
      cwd: '/var/www/YAHAYASCHOOL/strapicms',
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 1339,
        HOST: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=460',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      restart_delay: 5000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/yahaya-strapi-error.log',
      out_file: '/var/log/pm2/yahaya-strapi-out.log',
    },
  ],
};
