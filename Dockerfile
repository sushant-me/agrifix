FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

COPY server/src ./src

EXPOSE 10000
CMD ["node", "src/server.js"]