BASEDIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

DEVSRV_PORT ?= 3010


include make_docker.mk


.PHONY: dbcreate_dev
dbcreate_dev:
	mkdir -p .r_libs
	R_LIBS=$(BASEDIR)/.r_libs Rscript dbcreator/import.R ignore/ www/dev/db/gpdb_v1.sqlite

devsrv:
	$(MAKE) -C srv run DEVSRV_PORT=$(DEVSRV_PORT)
