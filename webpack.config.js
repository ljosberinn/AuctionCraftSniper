const path = require('path');

module.exports = {
  entry: './assets/js/app.js',
  output: {
    path: path.resolve(__dirname, './assets/js'),
    filename: 'bundle.min.js',
  },
  devtool: 'eval-source-map',
};
