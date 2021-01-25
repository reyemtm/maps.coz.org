var gulp = require('gulp');
var del = require('del');
var replace = require('gulp-replace');
var concat = require('gulp-concat');

//replace localhost to cdn tried hexo-cdnify but did not get good results
// gulp.task('cdn', function(){
//   gulp.src(['public/map-layers-config.json'])
//   .pipe(anyReplace('http://127.0.0.1:4000', 'https://gis.coz.org'))
//   .pipe(anyReplace((content)=> {
//         maps.forEach(item => {
//             content = content.replace(item, `${cdn}${item}`)
//         })
//         return content;
//     }))
//   .pipe(gulp.dest('./'))
// });

var localToCDN = [
	['http://127.0.0.1:4000', 'https://gis.coz.org']
];

gulp.task('cdn', function(){
	gulp.src(['./public/map-layers-config.json'])
		.pipe(replace(localToCDN))
		.pipe(gulp.dest('./'))
})

gulp.task('jsdoc-fix', function() {
  gulp.src('./source/docs')
  .pipe(replace('src="scripts', 'src="/docs/scripts'))
  .pipe(replace('src="styles', 'src="/docs/styles'))
  .pipe(replace('="global.html', '="/docs/global.html'))
  .pipe(gulp.dest("./"))
})

gulp.task('build-mapbox', function(){
  return gulp.src([
    'node_modules/mapbox-gl/dist/mapbox-gl.js',
    'node_modules/@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.min.js'
  ])
  .pipe(concat('mapbox.js'))
  .pipe(gulp.dest('./source/assets/js/dist/'));
})

gulp.task('clean-jsdoc', function () {
  return del([
    './source/pages/docs/'
  ]);
});

gulp.task('clean-public', function() {
  return del([
    './public/assets/js/src/',
    './public/assets/js/build/',
    './public/assets/css/main.scss'
  ])
})

gulp.task('wipe', function() {
  return del([
    './public/'
  ])
});