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

# Build the application with dummy environment variables for Firebase
ENV NEXT_PUBLIC_FIREBASE_API_KEY=dummy_key_for_build
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dummy.firebaseapp.com  
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=dummy_project
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dummy.appspot.com
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=dummy_sender
ENV NEXT_PUBLIC_FIREBASE_APP_ID=dummy_app_id
ENV GOOGLE_CLOUD_PROJECT_ID=dummy_gcp_project
ENV NEXTAUTH_SECRET=dummy_secret_for_build
ENV NEXTAUTH_URL=http://localhost:3000
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

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
