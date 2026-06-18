# Use Docker BuildKit syntax
# Multi-stage build for Next.js production

FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps needed for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy app sources and generate Prisma client
COPY . .
RUN npx prisma generate

# Build - JWT_SECRET only needed at runtime, provide dummy for build
ENV JWT_SECRET=build-placeholder
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build

# Production image
FROM node:18-alpine AS runner
ARG JWT_SECRET
ARG DATABASE_URL
ENV NODE_ENV=production
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm","start"]
