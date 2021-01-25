module.exports = {
  staticFileGlobs: [
    'public/**/*.{js,css,html}',
    'public/maps/**/*.{js,css,html}',
    'public/internal/**/*.{js,css,html}',
    'public/assets/img/*.{png,jpg}'
  ],
  stripPrefix: 'public',
  root: "public",
  maximumFileSizeToCacheInBytes: 2097152
};