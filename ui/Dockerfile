FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
  make \
  npm \
  nodejs

RUN useradd -ms /bin/bash dev-user

USER dev-user
