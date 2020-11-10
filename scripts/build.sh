#!/bin/bash

set -e

mkdir -p dist

npx tsc

rsync -azr --delete secrets/ dist/secrets/
rsync -azr --delete src/ dist/src/

