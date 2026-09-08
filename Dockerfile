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
# Port 8080 et non 80 : le conteneur tourne en `node` (non-root), et un port
# < 1024 lui est interdit. ⚠️ L'app Coolify doit donc exposer 8080.
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data DIST_DIR=/app/dist
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
# Les fichiers *.test.mjs restent hors de l'image : ils ne servent qu'au dépôt.
COPY server/index.mjs server/scores.mjs ./server/
COPY --from=build /app/dist ./dist
# chown AVANT le VOLUME : c'est ce propriétaire que Docker recopie dans un
# volume neuf — sans quoi `node` ne peut pas écrire les scores dans /data.
RUN mkdir -p /data && chown -R node:node /app /data
VOLUME ["/data"]
EXPOSE 8080
USER node
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["node", "server/index.mjs"]
