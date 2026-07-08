FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ pkg-config libsqlite3-dev && rm -rf /var/lib/apt/lists/*

COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm install --prefix backend && npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build --prefix frontend && npm run build --prefix backend

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
