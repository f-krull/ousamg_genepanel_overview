# Gene panel Overview

## Development

### Quick start

Requirements: `docker`, `make`, `git`

* ` git clone [this repo]... && cd ...`
* build database:  
  _This part has not been streamlined yet. As a temporary solution, download the already build database file:_  
   `( cd www/dev/db && wget https://genepanels.ousamg.uiocloud.no/db/gpdb_v1.sqlite )`  
  In the future, run `make docker_dbcreate_dev` _TBD_
* run web UI:  
  `make -C ui docker_dev`
* in new tab, start server to host web UI:  
  `make docker_devsrv`
* open `http://localhost:3010`
* open `ui/` folder in VSCode to make live changes

### Without docker (optional)

Requirements:
* nodejs
* npm
* npx
* make
* git
* r-base

Run steps above, but without any `docker_` docker prefixes.
You might need to clean the `.r_libs/` folder when switchig between
docker and non-docker environments.

## Overview, status and future development

### Rationale

This webservice was created with the assumption the underlying data does not change often and read-only access is sufficient.  

The data contained in the genepanel repository get compiled to a single database file. This DB file is served together with the webinterface as static files by a webserver. On the client a DBMS provided with the UI reads the DB file runs local queries. A high-enough cache time (`Cache-Control	max-age`) on the DB file is used to reduce loading times and traffic.  

Over time, with increasing genepanels, the size of the DB file might need to be reduced. One way to accomplish a reduction is file size is to replace all RefSeq IDs (type `TEXT`) used as PK and FK with generated IDs of type `INT` and use a lookup table to map back to the original IDs. This can also be done for HGNC IDs.  

_TDB how to build the db file_

## Production

### Build the UI

* run web UI:  
  `make -C ui docker_prod`
* copy the `www/prod` folder to the server


### Update the DB

* run ...
* copy the db file (`gpdb_v1.sqlite`) to the `db` folder on the server

## Server setup

```
server_name=replace.me

#------------------------------------------------------------------------------

# install packages

sudo apt-get update && DEBIAN_FRONTEND=noninteractive sudo apt-get install -y \
  bash-completion \
  git \
  netcat-traditional \
  locales \
  nodejs \
  npm \
  nginx \
  certbot \
  python3-certbot-nginx

#------------------------------------------------------------------------------


# configure webserver

sudo tee /etc/nginx/sites-available/default << EOI
server {
  root /home/debian/genepanel_overview/;
  server_name ${server_name};

  location / {
    try_files \$uri \$uri/index.html;
    expires 1h;
    add_header Cache-Control "public";
  }
}
EOI

sudo service nginx restart


#------------------------------------------------------------------------------


# configure SSL

sudo certbot --nginx -d ${server_name} -m flo.krull@gmail.com

#------------------------------------------------------------------------------
```
