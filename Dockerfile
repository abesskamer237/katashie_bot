FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm install --prefix backend && npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build --prefix frontend && npm run build --prefix backend

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY backend/package.json ./backend/package.json
RUN npm install --prefix backend --omit=dev

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/src ./backend/src
COPY --from=build /app/frontend/dist ./frontend/dist
COPY backend/src/config ./backend/src/config
COPY backend/src/database ./backend/src/database
COPY backend/src/middleware ./backend/src/middleware
COPY backend/src/routes ./backend/src/routes
COPY backend/src/services ./backend/src/services
COPY backend/src/types ./backend/src/types
COPY backend/src/utils ./backend/src/utils

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
