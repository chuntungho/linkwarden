FROM node:20.19.6-bullseye-slim AS main-app

ENV YARN_HTTP_TIMEOUT=10000000

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

ENV PRISMA_HIDE_UPDATE_MESSAGE=1

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

RUN corepack enable

COPY ./.yarnrc.yml ./

COPY ./apps/web/package.json ./apps/web/playwright.config.ts ./apps/web/

COPY ./apps/worker/package.json ./apps/worker/

COPY ./packages ./packages

COPY ./yarn.lock ./package.json ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn \
    set -eux && \
    yarn workspaces focus linkwarden @linkwarden/web @linkwarden/worker && \
    apt-get update && \
    apt-get install -yqq --no-install-recommends curl ca-certificates && \
    apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN set -eux && \
    apt-get clean && \
    yarn cache clean

COPY . .

RUN yarn prisma:generate && \
    yarn web:build && \
    rm -rf apps/web/.next/cache

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && NODE_OPTIONS='--max-old-space-size=256' yarn concurrently:start"]
