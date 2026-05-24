FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG API_BASE_URL=https://api-nexo.stampedev.cloud
RUN sed -i "s|apiBaseUrl: '.*'|apiBaseUrl: '${API_BASE_URL}'|g" src/environments/environment.prod.ts
RUN pnpm build --configuration production

FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/nexo-agent/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
