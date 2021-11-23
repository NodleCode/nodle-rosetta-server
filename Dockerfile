FROM node:16

# Create app directory
WORKDIR /app

RUN npm install -g typescript ts-node

COPY package*.json ./
COPY .npmrc.example ./

ARG GITHUB_TOKEN
RUN cp .npmrc.example .npmrc && sed -i "s/TOKEN/${GITHUB_TOKEN}/" .npmrc

RUN npm install

COPY . .

EXPOSE 8080

CMD ["ts-node", "./src/index.ts"]