#!/bin/sh
set -e

# Start nginx in background
nginx -g "daemon off;" &

# Start NestJS backend
cd /app/backend
node dist/main.js