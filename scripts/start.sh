#!/bin/sh
set -e

echo "Starting container with runtime environment injection..."

# Inject runtime environment variables
echo "Injecting runtime environment variables..."
node scripts/inject-runtime-env.js

# Start the Next.js application
echo "Starting Next.js server..."
exec node server.js