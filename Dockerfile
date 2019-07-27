FROM node:11-alpine

COPY index.html ./
COPY server.js ./
COPY package*.json ./

WORKDIR /routes
COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start"]