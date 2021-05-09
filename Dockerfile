FROM node:16-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run copy-h5p-standalone
EXPOSE 80
CMD [ "npm", "start" ]