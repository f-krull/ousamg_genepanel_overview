.PHONY: dev
dev:
	$(RM) dist/dev/*
	cp node_modules/sql.js/dist/sql-wasm.* dist/dev/
	npx parcel watch src/*html --dist-dir dist/dev/ --public-url /uidev/

build: 
	$(RM) dist/*.html
	$(RM) dist/*.css
	$(RM) dist/*.js
	$(RM) dist/*.map
	cp node_modules/sql.js/dist/sql-wasm.* dist/
	npx parcel build src/*html --dist-dir dist --public-url /ui
