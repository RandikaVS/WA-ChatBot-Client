# Dockerfile
FROM node:20-alpine AS base
# ── Step 1: Install dependencies ──────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Step 2: Build the application ─────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build-time env vars (your REACT_APP_SERVER_URL pattern)
ARG ARG_REACT_APP_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$ARG_REACT_APP_SERVER_URL

# Disable Next.js telemetry in CI
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Step 3: Production runner ──────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user — Cloud Run security best practice
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run sets PORT at runtime — Next.js must read it.
# Do NOT hardcode 3000 here.
ENV PORT=8080
EXPOSE 8080

# This starts Next.js on whatever $PORT Cloud Run sets
CMD ["node", "server.js"]