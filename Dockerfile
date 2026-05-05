# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the Vite frontend ----
FROM node:20-alpine AS build
WORKDIR /app

# Build-time VITE_* values are baked into the bundle.
# Pass these via --build-arg or in cloudbuild.yaml — never the service role key.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_BAYSE_PUBLIC_KEY
ARG VITE_GROQ_API_KEY
ARG VITE_GEMINI_API_KEY
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
