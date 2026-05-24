FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build --configuration production

FROM nginx:1.27-alpine AS runtime
ENV API_BASE_URL=https://api-nexo.stampedev.cloud
ENV API_HOST=api-nexo.stampedev.cloud
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/nexo-agent/browser /usr/share/nginx/html

EXPOSE 80
