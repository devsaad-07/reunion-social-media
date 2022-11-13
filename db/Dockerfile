FROM docker.io/postgres:alpine

ENV POSTGRES_PASSWORD "password"
ENV POSTGRES_HOST_AUTH_METHOD "trust"
ENV PGDATA "/var/lib/postgresql/data/pgdata"
ENV PGPORT "5432"
ENV POSTGRES_DB "reunion"

COPY db/db-init.sql docker-entrypoint-initdb.d/
