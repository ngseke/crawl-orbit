FROM node:16-alpine as builder
RUN npm i -g pnpm@7.11.0
WORKDIR /app
COPY . /app
RUN pnpm i
RUN pnpm run build

FROM node:16-alpine
RUN apk add --no-cache tzdata
ENV TZ="Asia/Taipei"
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/*.json /app
CMD ["npm", "start"]
