const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  mode: 'production',
  entry: ['./assets/js/app.js', './node_modules/datalist-polyfill/datalist-polyfill.min.js'],
  output: {
    path: path.resolve(__dirname, './assets/js'),
    filename: 'bundle.min.js',
  },
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
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
      ignore: [
        'node_modules',
        '.eslintrc.js',
        'webpack.config.js',
        'assets/js/app.js',
        'assets/js/app.js.map',
        'assets/js/elementBuilder.js',
        'assets/js/elementBuilder.js.map',
        'assets/js/eventChain.js',
        'assets/js/eventChain.js.map',
        'assets/js/helper.js',
        'assets/js/helper.js.map',
        'assets/js/localStorage.js',
        'assets/js/localStorage.js.map',
      ],
      configFile: 'sentry.properties',
    }),
  ],
};
