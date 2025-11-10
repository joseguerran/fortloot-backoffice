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

# Copy built application from builder (standalone output)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Run as non-root
RUN adduser --system --uid 1001 appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 3002

# Start Next.js standalone server
CMD ["node", "server.js"]
