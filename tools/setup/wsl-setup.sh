#!/bin/bash
# WSL Setup Script for myMCP
# Automatically configures CORS and networking for WSL/Windows environment

echo "🔧 myMCP WSL Setup"
echo "=================="

# Get WSL IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo "📍 Detected WSL IP: $WSL_IP"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
fi

# Update CORS configuration
echo "🌐 Updating CORS configuration..."
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3001,http://localhost:5173,http://$WSL_IP:5173|" .env

# Update Vite engine URL in root .env
echo "⚡ Updating Vite engine URL in root .env..."
if grep -q "VITE_ENGINE_URL" .env; then
    sed -i "s|VITE_ENGINE_URL=.*|VITE_ENGINE_URL=http://$WSL_IP:3000|" .env
else
    echo "VITE_ENGINE_URL=http://$WSL_IP:3000" >> .env
fi

# Create/update player-dashboard .env.local
echo "📁 Creating player-dashboard .env.local..."
echo "VITE_ENGINE_URL=http://$WSL_IP:3000" > packages/player-dashboard/.env.local

# Check if engine CORS parsing is updated
if ! grep -q "CORS_ORIGIN.split" packages/engine/src/index.ts; then
    echo "🔧 Updating engine CORS parsing..."
    cp packages/engine/src/index.ts packages/engine/src/index.ts.backup
    sed -i 's/origin: process.env.CORS_ORIGIN || \[.*\]/origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http:\/\/localhost:3001", "http:\/\/localhost:3002", "http:\/\/localhost:3003", "http:\/\/localhost:3500", "http:\/\/localhost:5173"]/' packages/engine/src/index.ts
    
    echo "🔨 Rebuilding engine..."
    npm run build --workspace=@mymcp/engine
    
    echo "⚠️  Please restart the engine: npm run start --workspace=@mymcp/engine"
fi

echo ""
echo "✅ WSL setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start engine: npm run start --workspace=@mymcp/engine"
echo "2. Start dashboard: npm run dev --workspace=@mymcp/player-dashboard"
echo "3. Access dashboard: http://$WSL_IP:5173"
echo ""
echo "📱 Access URLs:"
echo "  • Player Dashboard: http://$WSL_IP:5173"
echo "  • Engine API: http://$WSL_IP:3000"
echo "  • Admin Dashboard: http://$WSL_IP:3001"
echo ""
echo "🔄 Run this script again if your WSL IP changes after reboot"
echo "💡 Restart Vite dev server and engine after running this script"
