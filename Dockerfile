# Multi-stage build for production-ready Next.js application

# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files (for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
