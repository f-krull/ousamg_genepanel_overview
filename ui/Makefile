BASEDIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
PUBLIC_URL ?= "/"
DIST_MODES := dev prod

include make_docker.mk

.PHONY: dev
dev: dev_clean
	mkdir -p dist/dev/
	cp node_modules/sql.js/dist/sql-wasm.* dist/dev/
	npx parcel watch src/*html --dist-dir dist/dev/ --public-url $(PUBLIC_URL)

.PHONY: prod_clean
prod: prod_clean
	mkdir -p dist/prod/
	cp node_modules/sql.js/dist/sql-wasm.* dist/prod/
	npx parcel build src/*html --dist-dir dist/prod/ --public-url $(PUBLIC_URL)

.PHONY: $(addsuffix _clean, $(DIST_MODES))
$(addsuffix _clean, $(DIST_MODES)): %_clean:
	$(RM) dist/$*/*.html
	$(RM) dist/$*/*.css
	$(RM) dist/$*/*.js
	$(RM) dist/$*/*.map
