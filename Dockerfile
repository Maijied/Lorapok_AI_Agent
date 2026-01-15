FROM node:20-alpine

LABEL maintainer="Maizied"
LABEL description="Lorapok AI Coding Agent"

# Create app directory
WORKDIR /app

# Install git, bash, curl, jq, docker, openssh, github-cli, and build tools
RUN apk add --no-cache \
    git \
    bash \
    curl \
    jq \
    docker-cli \
    docker-cli-compose \
    openssh-client \
    github-cli \
    make \
    g++ \
    python3 \
    build-base

# Set environment variables for better character support
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Install pnpm
RUN npm install -g pnpm

# Fix git safe directory issue for Docker mounts
RUN git config --global --add safe.directory /project

# Install all dependencies (required for testing)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create config directory and logs directory
RUN mkdir -p /root/.lorapok/logs

# Expose port
EXPOSE 3847

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3847/health || exit 1

# Run server
CMD ["node", "server.js"]