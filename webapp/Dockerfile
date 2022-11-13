FROM docker.io/node:14.6.0-alpine

ENV NODEJS_PORT "9000"
ENV PGHOST "localhost"

COPY webapp/APIHelper webapp/APIHelper
RUN npm ci --prefix webapp/APIHelper

COPY webapp/package.json webapp/package-lock.json webapp/index.js /webapp/
RUN npm ci --prefix /webapp

WORKDIR /webapp
ENTRYPOINT node --trace-warnings index.js
