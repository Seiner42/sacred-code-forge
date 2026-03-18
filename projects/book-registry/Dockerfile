FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY public ./public
COPY server ./server
COPY data/books.example.json ./data/books.example.json
COPY .env.example ./.env.example
COPY README.md ./README.md

RUN mkdir -p /app/data && cp /app/data/books.example.json /app/data/books.json

EXPOSE 3000

CMD ["npm", "start"]
