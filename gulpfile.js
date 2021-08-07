const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');

const proj = ts.createProject('./tsconfig.json');

gulp.task('build', function () {
    return proj.src()
        .pipe(sourcemaps.init())
        .pipe(proj())
        .js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return gulp.src(['dist'], {read: false, allowEmpty:true})
        .pipe(clean());
});

gulp.task('watch', function () {
    return gulp.watch(proj.config.include, gulp.task('build'));
});
