FROM node:18-alpine

LABEL maintainer="Maijied"
LABEL description="Lorapok AI Coding Agent"

# Create app directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create config directory
RUN mkdir -p /root/.lorapok

# Expose port
EXPOSE 3847

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3847/health || exit 1

# Run server
CMD ["node", "server.js"]
