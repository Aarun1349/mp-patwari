# syntax=docker/dockerfile:1
# Lean multi-stage build → tiny Next.js standalone runtime image (+ Prisma engine).
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Dummy URLs so `prisma generate` (postinstall + build) can resolve env() — it
# does not connect, it only needs the variables to exist.
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
ENV DIRECT_DATABASE_URL="postgresql://x:x@localhost:5432/x"

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Next standalone output + static assets + public dir
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Prisma generated client + query engine (standalone tracing can miss the engine)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
EXPOSE 3000
CMD ["node", "server.js"]
