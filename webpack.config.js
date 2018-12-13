const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  entry: ['./assets/js/app.js', './node_modules/datalist-polyfill/datalist-polyfill.min.js'],
  output: {
    path: path.resolve(__dirname, './assets/js'),
    filename: 'bundle.min.js',
  },
  devtool: 'hidden-source-map',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  plugins: [
    new SentryWebpackPlugin({
      include: '.',
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js'],
      configFile: 'sentry.properties',
    }),
  ],
};
