# Build stage
FROM node:20.18.2-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy core package
COPY packages/core/package.json ./packages/core/
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/core/src ./packages/core/src

# Copy web package
COPY packages/web/package.json ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/
COPY packages/web/app.ts ./packages/web/
COPY packages/web/src ./packages/web/src

# Install dependencies for both packages
RUN npm ci

# Build core package first (web depends on it)
WORKDIR /app/packages/core
RUN npm run build

# Build web package
WORKDIR /app/packages/web
RUN npm run build

# Production stage
FROM node:20.18.2-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built core package
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist

# Copy built web package
COPY --from=builder /app/packages/web/package.json ./packages/web/
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Install production dependencies only
RUN npm ci --only=production --workspace=web --workspace=core

# Set working directory to web package
WORKDIR /app/packages/web

# Expose port (Cloud Run uses PORT env variable, defaults to 8080)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/app.js"]
