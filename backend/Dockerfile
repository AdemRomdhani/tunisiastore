FROM node:20-alpine

WORKDIR /app

# Install dependencies for sharp native module
RUN apk add --no-cache \
    vips-dev \
    fftw-dev \
    build-base \
    python3 \
    musl-dev \
    libc-dev \
    cargo \
    rust

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads/products uploads/reviews uploads/profiles

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]