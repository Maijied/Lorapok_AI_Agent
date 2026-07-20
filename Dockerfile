FROM node:18-alpine

LABEL maintainer="Maizied"
LABEL description="Lorapok AI Coding Agent"
LABEL version="1.0.0"

# Create app directory
WORKDIR /app

# Install git, bash, curl and other utilities needed for bash command execution
RUN apk add --no-cache git bash curl openssh-client

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --production=false

# Copy source code
COPY . .

# Create config directory and logs directory
RUN mkdir -p /root/.lorapok/logs

# Create /project directory for workspace mounting
RUN mkdir -p /project

# Expose port for REST API server
EXPOSE 3847

# Health check for the REST API server
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3847/health || exit 1

# Default: Run the REST API server
CMD ["node", "server.js"]