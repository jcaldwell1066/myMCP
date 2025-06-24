# WSL Setup Guide for myMCP

This guide helps you set up myMCP in a Windows Subsystem for Linux (WSL) environment with proper networking and CORS configuration.

## 🔑 Prerequisites

**CRITICAL SECURITY REQUIREMENTS:**
- ✅ **API Keys Required**: You MUST have Anthropic and/or OpenAI API keys for AI features
- ✅ **Redis Instance**: You need access to a Redis instance (local or cloud)
- ❌ **Never Commit .env**: The .env file contains sensitive credentials and must never be committed to git

## Quick Setup

### 1. Automated Setup (Recommended)

```bash
# Run the automated WSL setup script
chmod +x tools/setup/wsl-setup.sh
./tools/setup/wsl-setup.sh
```

**⚠️ IMPORTANT**: The script will create a `.env` file, but you MUST add your API keys manually:

```bash
# Edit .env and add your credentials
nano .env

# Add these lines:
ANTHROPIC_API_KEY=your_actual_anthropic_key_here
OPENAI_API_KEY=your_actual_openai_key_here
REDIS_URL=your_redis_connection_string
```

### 2. Manual Setup

If you prefer manual setup:

```bash
# 1. Copy environment template
cp env.example .env

# 2. Get your WSL IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo "Your WSL IP: $WSL_IP"

# 3. Edit .env file and update:
#    - CORS_ORIGIN=http://localhost:3001,http://localhost:5173,http://YOUR_WSL_IP:5173
#    - VITE_ENGINE_URL=http://YOUR_WSL_IP:3000
#    - ANTHROPIC_API_KEY=your_key_here
#    - OPENAI_API_KEY=your_key_here
#    - REDIS_URL=your_redis_url

# 4. Create player dashboard environment
echo "VITE_ENGINE_URL=http://$WSL_IP:3000" > packages/player-dashboard/.env.local

# 5. Build engine with new CORS config
npm run build --workspace=@mymcp/engine
```

## 🔐 Security Checklist

- [ ] ✅ `.env` file exists but is NOT committed to git
- [ ] ✅ API keys are added to `.env` file
- [ ] ✅ Redis URL is configured (no default passwords in production)
- [ ] ✅ WSL IP address is configured for CORS
- [ ] ❌ No sensitive credentials in any committed files

## Starting the System

```bash
# 1. Start the engine
npm run start --workspace=@mymcp/engine

# 2. In another terminal, start the player dashboard
npm run dev --workspace=@mymcp/player-dashboard

# 3. Access the dashboard
# Open browser to: http://YOUR_WSL_IP:5173
```

## Access URLs

After setup, you can access:

- **Player Dashboard**: `http://YOUR_WSL_IP:5173`
- **Engine API**: `http://YOUR_WSL_IP:3000`
- **Admin Dashboard**: `http://YOUR_WSL_IP:3001`
- **Health Check**: `http://YOUR_WSL_IP:3000/health`

## Troubleshooting

### CORS Errors
If you see CORS errors, verify:
1. Your WSL IP is correctly set in `CORS_ORIGIN`
2. Engine has been rebuilt after CORS changes
3. Both engine and dashboard are using the same WSL IP

### API Key Issues
If AI features don't work:
1. Verify API keys are set in `.env`
2. Check engine logs for authentication errors
3. Ensure keys have proper permissions/credits

### WSL IP Changes
WSL IP addresses can change after reboot:
```bash
# Check current IP
hostname -I | awk '{print $1}'

# Re-run setup script to update configuration
./tools/setup/wsl-setup.sh
```

## Network Architecture

```
Windows Host (172.20.80.1)
    ↕ (Browser access)
WSL Environment (172.20.80.209)
    ├── Engine API (:3000)
    ├── Admin Dashboard (:3001)
    └── Player Dashboard (:5173)
```

## Security Notes

- **Never commit `.env`**: Contains sensitive API keys and Redis credentials
- **Use `.env.example`**: Template for creating your own `.env`
- **Rotate keys regularly**: API keys should be rotated periodically
- **Local development only**: This setup is for development, not production

## Files Created/Modified

- `.env` - Your local environment configuration (NOT committed)
- `packages/player-dashboard/.env.local` - Vite environment variables
- `packages/engine/src/index.ts` - Updated CORS parsing
- Engine build artifacts in `packages/engine/dist/`
