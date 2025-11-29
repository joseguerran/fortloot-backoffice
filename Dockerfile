# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for building
RUN npm install --include=dev --loglevel=error

# Copy source code
COPY . .

# Build Next.js application (standalone)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3002

# Create non-root user first (before copying files)
RUN adduser --system --uid 1001 appuser

# Copy built application from builder (standalone output includes dependencies)
COPY --from=builder --chown=appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser /app/.next/static ./.next/static
USER appuser

# Expose port
EXPOSE 3002

# Start Next.js standalone server
CMD ["node", "server.js"]
