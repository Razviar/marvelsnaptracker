const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const nonce = Math.random().toString().substr(2);

rules.push(
  {
    test: /\.css$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          attributes: {
            nonce: nonce,
          },
        },
      },
      {loader: 'css-loader'},
    ],
  },
  {
    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          attributes: {
            nonce: nonce,
          },
        },
      },
    ],
  }
);

module.exports = {
  // Put your normal webpack config below here
  devtool: 'source-map',
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.woff', '.woff2', '.ttf', '.eot', '.svg'],
    modules: [NODE_MODULES],
  },
  plugins: [
    new CspHtmlWebpackPlugin(
      {
        'base-uri': "'self'",
        'object-src': "'none'",
        'script-src': ["'self'"],
        'img-src': ["'self'", 'https://marvelsnap.pro/', 'data:'],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
      {
        enabled: true,
        hashingMethod: 'sha256',
        hashEnabled: {
          'script-src': false,
          'style-src': false,
        },
        nonceEnabled: {
          'script-src': false,
          'style-src': false,
        },
      }
    ),
    new CopyPlugin({
      patterns: [{context: 'src/windows', from: '*.woff*', to: 'home_window'}],
    }),
  ],
};
