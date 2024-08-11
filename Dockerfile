FROM node:slim
WORKDIR /app
RUN apt update && apt install -y zstd
COPY package* .
RUN npm i
COPY app.js .
CMD ["app.js"]