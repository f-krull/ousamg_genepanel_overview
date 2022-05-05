PUBLIC_URL ?= /ui

.PHONY: dev
dev:
	$(RM) dist/dev/*
	cp node_modules/sql.js/dist/sql-wasm.* dist/dev/
	npx parcel watch src/*html --dist-dir dist/dev/ --public-url /uidev/

.PHONY: clean
clean:
	$(RM) dist/*.html
	$(RM) dist/*.css
	$(RM) dist/*.js
	$(RM) dist/*.map

build: clean
	cp node_modules/sql.js/dist/sql-wasm.* dist/
	npx parcel build src/*html --dist-dir dist --public-url $(PUBLIC_URL)
