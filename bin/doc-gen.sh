#!/usr/bin/env bash

rm -rf docs/

./node_modules/.bin/compodoc \
        -p tsconfig.app.json \
        -d docs/ \
        --disablePrivate --disableInternal --disableGraph \
        --theme Vagrant --hideGenerator \
        "$@"
