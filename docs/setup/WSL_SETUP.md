# myMCP WSL/Windows Setup Guide

This guide helps you set up myMCP in a WSL (Windows Subsystem for Linux) environment with proper CORS configuration.

## Quick Setup

```bash
# Run the automated WSL setup script
./tools/setup/wsl-setup.sh
```

## Manual Setup

### 1. Get Your WSL IP Address
```bash
# Get current WSL IP
hostname -I | awk '{print $1}'
# Example output: 172.20.80.209
```

### 2. Configure Environment Variables
Create or update `.env` file:
```bash
# Replace 172.20.80.209 with your actual WSL IP
CORS_ORIGIN=http://localhost:3001,http://localhost:5173,http://172.20.80.209:5173
VITE_ENGINE_URL=http://172.20.80.209:3000
```

### 3. Start Services
```bash
# Start engine (in one terminal)
npm run start --workspace=@mymcp/engine

# Start player dashboard (in another terminal)
npm run dev --workspace=@mymcp/player-dashboard

# Optional: Start admin dashboard
npm run start --workspace=@mymcp/admin
```

### 4. Access URLs
- **Player Dashboard**: http://YOUR_WSL_IP:5173
- **Engine API**: http://YOUR_WSL_IP:3000
- **Admin Dashboard**: http://YOUR_WSL_IP:3001

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Check your WSL IP: `hostname -I`
2. Update CORS_ORIGIN in `.env`
3. Restart the engine

### IP Address Changes
WSL IP can change after Windows reboot:
1. Run `./tools/setup/wsl-setup.sh` again
2. Or manually update `.env` with new IP
3. Restart services

### Port Forwarding Issues
If Windows can't access WSL services:
1. Ensure Vite runs with `--host` flag
2. Check Windows Firewall settings
3. Try accessing via WSL IP instead of localhost

## Advanced Configuration

### Static WSL IP (Optional)
For a permanent solution, consider setting up static WSL IP:
- Use tools like `wsl2-boot` (see GitHub: ocroz/wsl2-boot)
- Configure Windows Hyper-V networking
- Set up port forwarding rules

### Environment Variables Reference
```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:5173,http://WSL_IP:5173

# Engine URLs
VITE_ENGINE_URL=http://WSL_IP:3000
ENGINE_URL=http://WSL_IP:3000

# Redis (shared cloud instance)
REDIS_URL=redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991
```
