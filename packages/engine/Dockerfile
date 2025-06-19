FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/engine/package*.json ./packages/engine/
COPY shared/types/package*.json ./shared/types/
COPY shared/config/package*.json ./shared/config/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose port (will be overridden by docker-compose)
EXPOSE 3000

# Start the engine
WORKDIR /app/packages/engine
CMD ["node", "dist/index.js"] 