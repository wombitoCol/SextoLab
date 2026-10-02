# Build stage
FROM node:20-alpine AS build
WORKDIR /app
# Vite incrusta las variables VITE_* en tiempo de build, no de ejecución.
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_USE_MOCK=$VITE_USE_MOCK
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Server stage (static server)
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD [ "serve", "-s", "dist", "-l", "4173" ]
