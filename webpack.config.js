const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')

const isDev = process.env.NODE_ENV === 'development'

const exclude = [/node_modules/, /pkg/]
const eslintLoader = {
  loader: 'eslint-loader',
  options: {
    fix: isDev,
    failOnWarning: !isDev,
  },
}
module.exports = {
  entry: './example/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude,
        use: [eslintLoader],
      },
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        exclude,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
          eslintLoader,
        ],
      },
      { test: /\.[tj]sx?$/, exclude, use: 'babel-loader' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'example/index.html',
    }),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '.'),
      // Check https://rustwasm.github.io/wasm-pack/book/commands/build.html for
      // the available set of arguments.
      //
      // Optional space delimited arguments to appear before the wasm-pack
      // command. Default arguments are `--verbose`.
      // args: '--log-level warn',
      // Default arguments are `--typescript --target browser --mode normal`.
      // extraArgs: '--no-typescript',

      // Optional array of absolute paths to directories, changes to which
      // will trigger the build.
      watchDirectories: [path.resolve(__dirname, 'src')],

      // The same as the `--out-dir` option for `wasm-pack`
      outDir: path.resolve(__dirname, 'pkg'),

      // The same as the `--out-name` option for `wasm-pack`
      // outName: "index",

      // If defined, `forceWatch` will force activate/deactivate watch mode for
      // `.rs` files.
      //
      // The default (not set) aligns watch mode for `.rs` files to Webpack's
      // watch mode.
      // forceWatch: true,

      // If defined, `forceMode` will force the compilation mode for `wasm-pack`
      //
      // Possible values are `development` and `production`.
      //
      // the mode `development` makes `wasm-pack` build in `debug` mode.
      // the mode `production` makes `wasm-pack` build in `release` mode.
      // forceMode: "development",
    }),
    // Have this example work in Edge which doesn't ship `TextEncoder` or
    // `TextDecoder` at this time.
    new webpack.ProvidePlugin({
      TextDecoder: ['text-encoding', 'TextDecoder'],
      TextEncoder: ['text-encoding', 'TextEncoder'],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  mode: 'development',
}
