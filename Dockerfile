# Site statique compilé par Astro, servi par un petit serveur Node (Hono) qui
# porte aussi l'API des scores du jeu (fichier JSON par mois sur le volume /data).
# Aucun secret : MAQUETTE=1 ajoute seulement X-Robots-Tag: noindex.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=80 DATA_DIR=/data DIST_DIR=/app/dist
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/*.mjs ./server/
COPY --from=build /app/dist ./dist
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 80
CMD ["node", "server/index.mjs"]
