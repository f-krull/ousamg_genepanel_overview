# Gene panel Overview

## Development

### Quick start

Requirements: `docker`, `make`, `git`

* ` git clone [this]... && cd ...`
* build database:  
  `make docker_dbcreate_dev`
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
You might need to clean the `.r_libs/` when switchig between
docker and non-docker environments.

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
