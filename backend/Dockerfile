FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install
RUN npx prisma generate
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]