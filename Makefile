MAKEFLAGS = -j1

export NODE_ENV = test

# Fix color output until TravisCI fixes https://github.com/travis-ci/travis-ci/issues/7967
export FORCE_COLOR = true

.PHONY: build build-only build-dist watch \
  docs-clone docs-build docs-clean \
  lint fix lint-package lint-staged \
  clean test-clean clean-all \
  test-only test-cover test test-ci test-build \
  precommit prepush publish bootstrap bootstrap-ci

build: build-only

build-only:
	./node_modules/.bin/gulp build

build-dist: clean build docs-build

docs-clean:
	rm -rf docs

docs-clone: docs-clean
	git clone -b gh-pages https://github.com/remotelib/remote-lib.git docs

docs-build:
	test -d "./docs" || make docs-clone
	./node_modules/.bin/esdoc

docs-publish:
	test -d "./docs/.git" || make docs-clone
	make docs-build
	cd ./docs && \
	git add . && \
	git commit -m `cd .. && git rev-parse HEAD` && \
	git push
	open http://www.remotelib.com/


watch: clean
	BABEL_ENV=development ./node_modules/.bin/gulp watch

lint: lint-package
	./node_modules/.bin/eslint scripts test packages *.js --format=codeframe

fix:
	./node_modules/.bin/eslint scripts test packages *.js --format=codeframe --fix

lint-package:
	./scripts/lint-package.sh

lint-staged:
	./node_modules/.bin/lint-staged

clean: test-clean docs-clean
	rm -rf packages/*/lib
	rm -rf packages/*/npm-debug*

test-clean:
	rm -rf packages/*/test/tmp
	rm -rf coverage

clean-all: clean
	rm -rf node_modules
	rm -rf packages/*/node_modules

test-only:
	./node_modules/.bin/mocha "packages/*/test/*.js"
	make test-clean

test-cover:
	node_modules/.bin/babel-node node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha "packages/*/test/*.js" --check-coverage --report lcovonly -- -R spec

test-build: build-only test-only

test: lint test-only

precommit: lint-package lint-staged

prepush: clean test-build

test-ci: lint test-cover
	codecov
	make test-clean

publish:
	git pull --rebase
	rm -rf packages/*/lib
	make build-dist
	make test
	./node_modules/.bin/lerna publish --conventional-commits
	make docs-publish

bootstrap: clean-all
	npm install
	./node_modules/.bin/lerna bootstrap -- --no-package-lock
	make build-dist

bootstrap-ci: bootstrap
	npm install -g codecov
