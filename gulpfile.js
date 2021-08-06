const gulp = require('gulp')
const del = require('del')
const browserSync = require('browser-sync').create()
const rename = require('gulp-rename')
const gulpIf = require('gulp-if')
const webpack = require('webpack-stream')
const autoprefixer = require("gulp-autoprefixer")
const scss = require('gulp-sass')(require('sass'))
const cleanCSS = require('gulp-clean-css');

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const projectFolder = 'dist';

const path = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    js: projectFolder + '/js/',
    img: projectFolder + '/img/',
  },
  source: {
    html: '*.html',
    css: 'scss/**/*.scss',
    js: 'ts/script.ts',
  },
  watch: {
    html: '*.html',
    css: 'scss/**/*.scss',
    js: 'ts/**/*.ts',
  },
  clean: `./${projectFolder}/`,
};

function html() {
  return gulp.src(path.source.html)
      .pipe(gulp.dest(path.build.html))
      .pipe(browserSync.stream())
}

function css() {
  return gulp.src(path.source.css)
      .pipe(scss({
        outputStyle: 'expanded'
      }))
      .pipe(autoprefixer({
        overrideBrowserslist: isDev ? [">1%", "not dead"] : ["last 5 version"],
        cascade: false
      }))
      .pipe(gulp.dest(path.build.css))
      // if build
      .pipe(gulpIf(isProd, cleanCSS({compatibility: 'ie8'})))
      .pipe(gulpIf(isProd, rename({
        extname: ".min.css",
      })))
      .pipe(gulpIf(isProd, gulp.dest(path.build.css)))
      .pipe(browserSync.stream())
}

function js() {
  return gulp.src(path.source.js)
      .pipe(
          webpack({
            mode: isDev ? 'development' : 'production',
            output: {
              filename: 'script.js',
            },
            devtool: isProd ? false : 'source-map',
            module: {
              rules: [
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
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
}

const dev = gulp.series(clean, gulp.parallel(html, css, js))
const start = gulp.series(dev, gulp.parallel(watchFiles, serve));

gulp.task('dev', dev)
gulp.task('build', dev)
gulp.task('start', start)
