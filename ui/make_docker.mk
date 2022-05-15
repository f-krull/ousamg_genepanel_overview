# Bindings that run master make targets inside docker
# Use to avoid installing dependencies on host system

DOCKER_IMAGE_NAME = genepanelov_ui

.PHONY: build_docker
build_docker:
	docker build -t $(DOCKER_IMAGE_NAME) - < Dockerfile

.PHONY: docker_dev
docker_dev: build_docker
	# port 1234 for websocket of "npx parcel watch"
	docker run --rm -ti -p 1234:1234 -v $(BASEDIR):/ui --workdir /ui $(DOCKER_IMAGE_NAME) $(MAKE) dev

.PHONY: docker_prod
docker_prod: build_docker
	docker run --rm -ti -v $(BASEDIR):/ui --workdir /ui $(DOCKER_IMAGE_NAME) $(MAKE) prod
