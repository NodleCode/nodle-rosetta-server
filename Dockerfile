FROM node:16

# Create app directory
WORKDIR /app

RUN npm install -g typescript ts-node

COPY package*.json ./


RUN npm install

COPY . .

EXPOSE 8080

CMD ["ts-node", "./src/index.ts"]