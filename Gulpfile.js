/**
 * Copyright 2017 Moshe Simantov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable import/no-extraneous-dependencies */
const plumber = require('gulp-plumber');
const through = require('through2');
const chalk = require('chalk');
const newer = require('gulp-newer');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const gutil = require('gulp-util');
const gulp = require('gulp');
const path = require('path');

const base = path.join(__dirname, 'packages');
const scripts = './packages/*/src/**/*.js';

function swapSrcWithLib(srcPath) {
  const parts = srcPath.split(path.sep);
  parts[1] = 'lib';
  return parts.join(path.sep);
}

gulp.task('default', ['build', 'docs']);

gulp.task('build', () =>
  gulp
    .src(scripts, { base })
    .pipe(
      plumber({
        errorHandler(err) {
          gutil.log(err.stack);
        },
      })
    )
    .pipe(
      newer({
        dest: base,
        map: swapSrcWithLib,
      })
    )
    .pipe(
      through.obj((file, enc, callback) => {
        gutil.log('Compiling', `'${chalk.cyan(file.relative)}'...`);
        callback(null, file);
      })
    )
    .pipe(babel())
    .pipe(
      through.obj((file, enc, callback) => {
        // Passing 'file.relative' because newer() above uses a relative path and this keeps it consistent.
        // eslint-disable-next-line no-param-reassign
        file.path = path.resolve(file.base, swapSrcWithLib(file.relative));
        callback(null, file);
      })
    )
    .pipe(gulp.dest(base))
);

gulp.task('watch', ['build'], () => {
  watch(scripts, { debounceDelay: 200 }, () => {
    gulp.start('build');
  });
});
