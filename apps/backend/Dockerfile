# Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules and pg_dump
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads backups log

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "start:dev"]