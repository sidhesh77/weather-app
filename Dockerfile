FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm install && npm install --prefix backend && npm install --prefix frontend

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]