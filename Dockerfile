# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source code and configuration files
COPY . .

# Build the client assets and compile/bundle the custom Express server
RUN npm run build

# ==========================================
# Stage 2: Production runtime stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production

# Expose port 8080 (Cloud Run targets 8080 by default, our Express server respects process.env.PORT)
ENV PORT=8080
EXPOSE 8080

# Copy package management files for production dependency installation
COPY package*.json ./

# Install only production dependencies to keep the image lightweight
RUN npm ci --only=production

# Copy compiled assets and server bundle from build stage
COPY --from=builder /app/dist ./dist

# Start the application server
CMD ["node", "dist/server.cjs"]
