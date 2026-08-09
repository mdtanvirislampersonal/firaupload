# syntax=docker/dockerfile:1.7

# ---- Builder ---------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy manifests first for better layer caching
COPY package.json bun.lock* ./

# Install deps
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the Next.js app (standalone output)
RUN bun run build

# ---- Runner ----------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone output + static + public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# No database or local storage to set up — all state lives on GitHub.

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
