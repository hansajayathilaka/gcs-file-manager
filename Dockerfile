# Use the official Node.js runtime as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build without environment variables - they'll be provided at runtime
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy runtime environment injection script and startup script
COPY --from=builder /app/scripts/inject-runtime-env.js ./scripts/inject-runtime-env.js
COPY --from=builder /app/scripts/start.sh ./scripts/start.sh

# Make start script executable and ensure proper permissions
RUN chmod +x ./scripts/start.sh && \
    chown -R nextjs:nodejs ./scripts/ && \
    chown -R nextjs:nodejs ./.next/static && \
    chown -R nextjs:nodejs ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application with runtime environment injection
CMD ["./scripts/start.sh"]
