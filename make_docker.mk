# Bindings that run master make targets inside docker
# Use to avoid installing dependencies on host system

DOCKER_IMAGE_NAME := genepanelov

WORK_DIR := /gpov

.PHONY: build_docker
build_docker:
	docker build -t $(DOCKER_IMAGE_NAME) - < Dockerfile

.PHONY: docker_dbcreate_dev
docker_dbcreate_dev: build_docker
	docker run --rm -ti \
		-v $(BASEDIR):$(WORK_DIR) \
		--workdir $(WORK_DIR) \
		$(DOCKER_IMAGE_NAME) $(MAKE) dbcreate_dev

.PHONY: docker_devsrv
docker_devsrv: build_docker
	docker run --rm -ti \
		-p $(DEVSRV_PORT):$(DEVSRV_PORT) \
		-v $(BASEDIR):$(WORK_DIR) \
		--workdir $(WORK_DIR) \
		$(DOCKER_IMAGE_NAME) $(MAKE) devsrv DEVSRV_PORT=$(DEVSRV_PORT)
