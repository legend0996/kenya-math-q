// PM2 cluster config for the Kenya Math Quest backend.
// Usage: npx pm2 start ecosystem.config.cjs && npx pm2 save
module.exports = {
  apps: [
    {
      name: "kenya-math-quest-backend",
      script: "backend/index.js",
      instances: "max", // one worker per CPU — 3000+ concurrent students
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: "development",
      },
      autorestart: true,
      watch: false,
    },
  ],
};
