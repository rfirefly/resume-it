const gulp = require('gulp');
const {src, dest, watch, series, parallel } = require('gulp');
const path = require('path')
const fs = require('fs')
const matter = require('gray-matter')
const yaml = require('js-yaml')
const MarkdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')
const nib = require('nib')
const $ = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()

const isProd = process.env.NODE_ENV === 'production'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true
})
md.use(markdownItAttrs)

const paths = {
  root: path.join(__dirname, '../'),
  src: path.join(__dirname, '../src/'),
  scripts: 'src/scripts/*.js',
  styles: 'src/styles/**/*.styl',
  assets: path.join(__dirname, '../src/assets'),
}

function fonts(){
  return src('node_modules/font-awesome/fonts/fontawesome-webfont.*')
      .pipe(dest('dist/fonts/'))
      .pipe($.size());
}

function scripts(){
  return src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/velocity-animate/velocity.js',
    paths.scripts
  ])
  .pipe($.uglify())
  .pipe($.concat({ path: 'scripts.js', stat: { mode: 0666} }))
  .pipe(dest('dist/assets/'))
  .pipe($.size());
}

function styles(){
  return src([
    'node_modules/font-awesome/css/font-awesome.min.css',
    paths.styles
  ])
  .pipe($.stylus({ use: nib(), compress: true, import: ['nib']}))
  .pipe($.autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
  .pipe($.concat({ path: 'styles.css', stat: { mode: 0666} }))
  .pipe(dest('dist/assets/'))
  .pipe($.size());
}

function html(){
  const MarkdownType = new yaml.Type('tag:yaml.org,2002:md', {
    kind: 'scalar',
    construct: function (text) {
      return md.render(text)
    },
  })
  const YAML_SCHEMA = yaml.Schema.create([ MarkdownType ])
  const context = matter(fs.readFileSync('data.yaml', 'utf8'), {schema: YAML_SCHEMA }).data
  return src(['template/index.html', 'template/print.html'])
    .pipe($.nunjucks.compile(context))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(dest('dist'))
    .pipe($.size());
}

  function watchs(){//监听变化执行任务
    //当匹配任务变化才执行相应任务
    if (isProd) return
    browserSync.init({
        server: "./dist"
    })

    watch(['template/*.html', 'data.yaml'], series(html));
    watch(paths.styles, series(styles));
    watch(paths.scripts, series(scripts));

    watch(["dist/*.html", "dist/assets/*.*"]).on('change', function() {
      browserSync.reload;
    })
}

exports.init = parallel(html,styles,scripts, fonts);
exports.run = series(watchs);
exports.default = series(parallel(html,styles,scripts, fonts), watchs);