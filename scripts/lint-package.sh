#!/usr/bin/env bash
set -e

./node_modules/.bin/pjl-cli --quiet

for D in ./packages/*/; do
  ./node_modules/.bin/pjl-cli --quiet --file "${D}package.json";
done
