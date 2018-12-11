const path = require('path');

module.exports = {
  entry: ['./assets/js/app.js', './node_modules/datalist-polyfill/datalist-polyfill.min.js'],
  output: {
    path: path.resolve(__dirname, './assets/js'),
    filename: 'bundle.min.js',
  },
};
