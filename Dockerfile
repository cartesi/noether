#
# Base stage.
# This stage installs common and required dependencies for next stages
#
FROM node:16.10.0-alpine AS base

RUN apk add --no-cache git python3 make g++

#
# Builder stage.
# This stage compile our TypeScript to get the JavaScript code
#
FROM base AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY tsconfig.prod.json ./
RUN yarn install --frozen-lockfile
COPY ./src ./src
RUN yarn run build

#
# Production stage.
# This stage gets back the JavaScript code from builder stage
# It will also install the production package only
#
FROM base

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

## We just need the build to execute the command
COPY --from=builder /usr/src/app/dist ./dist
ENTRYPOINT ["node", "/app/dist/index.js"]
