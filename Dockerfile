FROM ubuntu:22.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
  make \
  npm \
  nodejs \
  r-base

RUN useradd -ms /bin/bash dev-user

USER dev-user
