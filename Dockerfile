FROM node:20-alpine AS build
ARG ARG_REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=${ARG_REACT_APP_SERVER_URL}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm i -g serve
EXPOSE 3000
CMD ["serve", "-s", "build"]