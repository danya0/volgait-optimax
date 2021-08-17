const gulp = require('gulp')
const del = require('del')
const browserSync = require('browser-sync').create()
const webpack = require('webpack-stream')
const rename = require('gulp-rename')
const gulpIf = require('gulp-if')
const autoprefixer = require("gulp-autoprefixer")
const scss = require('gulp-sass')(require('sass'))
const cleanCSS = require('gulp-clean-css')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const projectFolder = 'dist'

const path = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    js: projectFolder + '/js/',
    img: projectFolder + '/img/',
    assets: projectFolder + '/assets/'
  },
  source: {
    html: '*.html',
    css: 'scss/**/*.scss',
    js: 'ts/script.ts',
    assets: 'assets/**/*.*'
  },
  watch: {
    html: '*.html',
    css: 'scss/**/*.scss',
    js: 'ts/**/*.ts',
    assets: 'assets/**/*.*'
  },
  clean: `./${projectFolder}/`,
};

function html() {
  return gulp.src(path.source.html)
      .pipe(gulp.dest(path.build.html))
      .pipe(browserSync.stream())
}

// function css() {
//   return gulp.src(path.source.css)
//       .pipe(scss({
//         outputStyle: 'expanded'
//       }))
//       .pipe(autoprefixer({
//         overrideBrowserslist: isDev ? [">1%", "not dead"] : ["last 5 version"],
//         cascade: false
//       }))
//       .pipe(gulp.dest(path.build.css))
//       // if build
//       .pipe(gulpIf(isProd, cleanCSS({compatibility: 'ie8'})))
//       .pipe(gulpIf(isProd, rename({
//         extname: ".min.css",
//       })))
//       .pipe(gulpIf(isProd, gulp.dest(path.build.css)))
//       .pipe(browserSync.stream())
// }

function js() {
  return gulp.src(path.source.js)
      .pipe(
          webpack({
            mode: isDev ? 'development' : 'production',
            output: {
              filename: 'widget.js',
            },
            devtool: isProd ? false : 'source-map',
            module: {
              rules: [
                { test: /\.css$/, loader: ['style-loader', 'css-loader'] },
                { test: /\.scss$/, loader: ['style-loader', 'css-loader', 'sass-loader'] },
                {
                  test: /\.(js|ts)$/,
                  exclude: /node_modules/,
                  use: {
                    loader: 'babel-loader',
                    options: {
                      presets: ['@babel/preset-env', '@babel/preset-typescript'],
                      plugins: ['@babel/proposal-class-properties', '@babel/proposal-object-rest-spread']
                    }
                  }
                }
              ]
            },
            resolve: {
              extensions: [ '.js', '.ts' ],
            },
          })
      )
      .pipe(gulp.dest(path.build.js))
      .pipe(browserSync.stream())
}

function clean() {
  return del(path.clean)
}

function copyAssets() {
  return gulp.src(path.source.assets)
      .pipe(gulp.dest(path.build.assets))
}

function serve() {
  browserSync.init({
    server: {
      baseDir: "./" + projectFolder + "/",
    },
    port: 3000,
    notify: false,
  });
}

function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], js)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.assets], copyAssets)
}

const dev = gulp.series(clean, gulp.parallel(html, js, copyAssets))
const start = gulp.series(dev, gulp.parallel(watchFiles, serve))

gulp.task('dev', dev)
gulp.task('build', dev)
gulp.task('start', start)
