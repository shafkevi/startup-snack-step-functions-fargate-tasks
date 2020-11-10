#!/bin/bash

set -e

mkdir -p dist

rsync -azr --delete secrets/ dist/secrets/
rsync -azr --delete src/ dist/src/
rsync -azr --delete lib/utils/package.json dist/lib/utils/

npx tsc
