FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .

# Build args from Aspire (PublishAsDockerFile(c => c.WithBuildArg(...))) become available here.
# Export as ENV so "vite build" can read them (Vite inlines VITE_* at build time).
ARG VITE_BASE_PATH
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

RUN npm run build
