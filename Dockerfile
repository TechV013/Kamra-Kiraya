 # Use Docker BuildKit syntax
 # Multi-stage build for Next.js production

 FROM node:18-alpine AS builder
 ARG JWT_SECRET
 ENV JWT_SECRET=${JWT_SECRET}
 WORKDIR /app

 # Install dependencies (including dev deps needed for build)
 COPY package.json package-lock.json* ./
 RUN npm ci

 # Copy app sources and generate Prisma client
 COPY . .
 RUN npx prisma generate

 # Build (requires server-side envs like JWT_SECRET at build-time)
 RUN npm run build

 # Production image
 FROM node:18-alpine AS runner
 ARG JWT_SECRET
 ENV NODE_ENV=production
 ENV JWT_SECRET=${JWT_SECRET}
 WORKDIR /app

 # Copy only necessary files
 COPY --from=builder /app/package.json ./
 COPY --from=builder /app/node_modules ./node_modules
 COPY --from=builder /app/.next ./.next
 COPY --from=builder /app/public ./public
 COPY --from=builder /app/next.config.js ./

 EXPOSE 3000
 CMD ["npm","start"]