#!/bin/bash

build() {
	docker build -f db/Dockerfile -t reunion/postgresdb .
	docker build -f webapp/Dockerfile -t reunion/nodewebapp .
}

run() {
	docker container run --name reunion-postgresdb -p 5432:5432 -d reunion/postgresdb
	docker container run --name reunion-nodewebapp -p 9000:9000 -d reunion/nodewebapp
}

shred() {
	docker container rm -f reunion-postgresdb
	docker container rm -f reunion-nodewebapp
}

shred;
build;
run;
