#!/bin/sh
set -e

package=$1 && shift
npmCmd="npm $@ --no-package-lock"

cd ./packages/$package || (echo "Package \"$package\" not found!" && exit 1)

echo "> $npmCmd" && $npmCmd
