# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the Vite frontend ----
FROM node:20-alpine AS build
WORKDIR /app

# Build-time VITE_* values are baked into the bundle.
# Pass these via --build-arg or in cloudbuild.yaml — never the service role key.
ARG VITE_SUPABASE_URL=https://whkpuhdoqsousummmuaw.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoa3B1aGRvcXNvdXN1bW1tdWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTA2NjgsImV4cCI6MjA5MDA4NjY2OH0.bDJBOX30IDhB66VaCxIkfLDgZ6ZNscWmk5Mp-O9hRQE
ARG VITE_BAYSE_PUBLIC_KEY=pk_live_JlLdfrfr6otuTx-fRn28NBJL
ARG VITE_GROQ_API_KEY=
ARG VITE_GEMINI_API_KEY=AIzaSyC7J4s67a3631ixt1tgup-rH6B1f3W4WgM
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_BAYSE_PUBLIC_KEY=$VITE_BAYSE_PUBLIC_KEY \
    VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY \
    VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- Stage 2: production runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend ./backend
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "backend/server.js"]
