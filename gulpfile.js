const gulp = require('gulp');
const { watch, series } = require('gulp');
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
  return gulp.src('node_modules/font-awesome/fonts/fontawesome-webfont.*')
      .pipe(gulp.dest('dist/fonts/'))
      .pipe($.size());
}

// gulp.task('fonts', function() {
//     return gulp.src('node_modules/font-awesome/fonts/fontawesome-webfont.*')
//       .pipe(gulp.dest('dist/fonts/'))
//       .pipe($.size());
//   })

function scripts(){
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/velocity-animate/velocity.js',
    paths.scripts
  ])
  .pipe($.uglify())
  .pipe($.concat({ path: 'scripts.js', stat: { mode: 0666} }))
  .pipe(gulp.dest('dist/assets/'))
  .pipe($.size());
}

  // gulp.task('scripts', () => {
  //   return gulp.src([
  //       'node_modules/jquery/dist/jquery.min.js',
  //       'node_modules/velocity-animate/velocity.js',
  //       paths.scripts
  //     ])
  //     .pipe($.uglify())
  //     .pipe($.concat({ path: 'scripts.js', stat: { mode: 0666} }))
  //     .pipe(gulp.dest('dist/assets/'))
  //     .pipe($.size());
  // })

function styles(){
  return gulp.src([
    'node_modules/font-awesome/css/font-awesome.min.css',
    paths.styles
  ])
  .pipe($.stylus({ use: nib(), compress: true, import: ['nib']}))
  .pipe($.autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
  .pipe($.concat({ path: 'styles.css', stat: { mode: 0666} }))
  .pipe(gulp.dest('dist/assets/'))
  .pipe($.size());
}

  // gulp.task('styles', () => {
  //   return gulp.src([
  //       'node_modules/font-awesome/css/font-awesome.min.css',
  //       paths.styles
  //     ])
  //     .pipe($.stylus({ use: nib(), compress: true, import: ['nib']}))
  //     .pipe($.autoprefixer({
  //             browsers: ['last 2 versions'],
  //             cascade: false
  //         }))
  //     .pipe($.concat({ path: 'styles.css', stat: { mode: 0666} }))
  //     .pipe(gulp.dest('dist/assets/'))
  //     .pipe($.size());
  // })

function html(){
  const MarkdownType = new yaml.Type('tag:yaml.org,2002:md', {
    kind: 'scalar',
    construct: function (text) {
      return md.render(text)
    },
  })
  const YAML_SCHEMA = yaml.Schema.create([ MarkdownType ])
  const context = matter(fs.readFileSync('data.yaml', 'utf8'), {schema: YAML_SCHEMA }).data
  return gulp.src(['template/index.html', 'template/print.html'])
    .pipe($.nunjucks.compile(context))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
    .pipe($.size());
}

  // gulp.task('html', () => {
  //   const MarkdownType = new yaml.Type('tag:yaml.org,2002:md', {
  //     kind: 'scalar',
  //     construct: function (text) {
  //       return md.render(text)
  //     },
  //   })
  //   const YAML_SCHEMA = yaml.Schema.create([ MarkdownType ])
  //   const context = matter(fs.readFileSync('data.yaml', 'utf8'), {schema: YAML_SCHEMA }).data
  //   return gulp.src(['template/index.html', 'template/print.html'])
  //     .pipe($.nunjucks.compile(context))
  //     .pipe($.htmlmin({collapseWhitespace: true}))
  //     .pipe(gulp.dest('dist'))
  //     .pipe($.size());
  // })

  gulp.task('watchs',function(){//监听变化执行任务
    //当匹配任务变化才执行相应任务
    if (isProd) return
    browserSync.init({
        server: "./dist"
    })
    gulp.watch('./template/*.html',gulp.series('html'));
    gulp.watch('./src/styles/stylus/**',gulp.series('styles'));
    gulp.watch('./scripts/*.js',gulp.series('scripts'));
    gulp.watch(["dist/*.html", "dist/assets/*.*"]).on('change', browserSync.reload)
})

    gulp.task('init',gulp.parallel(html,styles,scripts, fonts));

    // gulp.task('default',gulp.series(gulp.parallel(html,styles,scripts, fonts), gulp.watchs));

