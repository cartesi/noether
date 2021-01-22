#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:15.5.0-alpine AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY tsconfig.prod.json ./
RUN apk add --no-cache git && yarn install --frozen-lockfile
COPY ./src ./src
RUN yarn run build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:15.5.0-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY yarn.lock ./
RUN apk add --no-cache git && yarn install --frozen-lockfile

## We just need the build to execute the command
COPY --from=builder /usr/src/app/dist ./dist
ENTRYPOINT ["node", "/app/dist/index.js"]
