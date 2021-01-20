let fileswatch   = 'html,htm,txt,json,md,woff2'

const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const webpack = require('webpack-stream');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const mode = require('gulp-mode')();
const stylglob     = require("gulp-empty");
const browserSync = require('browser-sync').create();
const cleancss     = require('gulp-clean-css');
const imagemin     = require('gulp-imagemin');
const newer        = require('gulp-newer');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'app/'
    },
    ghostMode: { clicks: false },
		notify: false,
		online: true,
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
  })
}

function scripts(){
  return src(['app/js/*.js', '!app/js/*.min.js'])
  .pipe(webpack({
    mode: 'production',
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
              presets: ['@babel/env'],
              plugins: ['babel-plugin-root-import']
            }
          }
        ]
      }
    })).on('error', function handleError() {
      this.emit('end')
    })
    .pipe(rename('script.min.js'))
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function styles() {
  return src(['app/styles/styles.scss'])
    .pipe(sass().on('error',sass.logError))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(csso())
    .pipe(cleancss({ level: { 1: { specialComments: 0 } },/* format: 'beautify' */ }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function images() {
  return src(['app/images/src/**/*'])
    .pipe(newer('app/images/dist'))
    .pipe(imagemin())
    .pipe(dest('app/images/dist'))
    .pipe(browserSync.stream())
}

function buildcopy() {
  return src([
    'app/**/*.html',
    'app/**/*.php',
    '{app/js,app/css}/*.min.*',
    'app/images/**/*.*',
    '!app/images/src/**/*',
    'app/fonts/**/*'
  ], { base: 'app/' })
  .pipe(dest('dist'))
}

function cleandist() {
  return del('dist/**/*', { force: true })
}

function startwatch() {
	watch(`app/styles/**/*`, { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
	watch('app/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
	watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}



exports.scripts = scripts
exports.styles  = styles
exports.images  = images

exports.assets  = series(scripts, styles, images)
exports.build   = series(cleandist, scripts, styles, images, buildcopy)
exports.default = (scripts, styles, images, parallel(browsersync, startwatch))