'use strict';

const path = require('path');
const webpack = require('webpack');

const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const safePostCssParser = require('postcss-safe-parser');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const BrotliPlugin = require('brotli-webpack-plugin');
const AssetsWebpackPlugin = require('assets-webpack-plugin');

const alias = require('../../webpack.config');
const paths = require('./paths');
const { getClientEnvironment } = require('./env');
const getStyleLoaders = require('./getStyleLoaders');

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const { NODE_ENV } = process.env;

module.exports = function (entryPath) {
  if (!entryPath) throw new Error('must have entryPath, webpack');

  const entry = {};
  const bundlePath = entryPath.replace(`${path.resolve()}`, '').replace('/', '');
  entry[bundlePath] = [entryPath];

  const isEnvDevelopment = (NODE_ENV === 'development');
  const isEnvProduction = (NODE_ENV === 'production');
  if (isEnvDevelopment) console.log('isEnvDevelopment:', isEnvDevelopment);
  if (isEnvProduction) console.log('isEnvProduction:', isEnvProduction);

  // Get environment variables to inject into our app.
  const env = getClientEnvironment();
  const shouldUseSourceMap = isEnvDevelopment;

  return {
    target: 'web',
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    watch: false,
    bail: isEnvProduction,
    entry,
    output: {
      path: `${paths.appBuild}/static/js`,
      pathinfo: isEnvDevelopment,
      filename: '[name]/main.[hash].js',
      chunkFilename: `${bundlePath}/[name].[hash].js`,
      publicPath: '/',
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info =>
          path
            .relative(paths.appSrc, info.absoluteResourcePath)
            .replace(/\\/g, '/')
        : isEnvDevelopment &&
                (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'))
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending futher investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2
            },
            mangle: {
              safari10: true
            },
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true
            }
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: shouldUseSourceMap
        })
        // }),
        // // This is only used in production mode
        // new OptimizeCSSAssetsPlugin({
        //   cssProcessorOptions: {
        //     parser: safePostCssParser,
        //     map: shouldUseSourceMap
        //       ? {
        //         // `inline: false` forces the sourcemap to be output into a
        //         // separate file
        //         inline: false,
        //         // `annotation: true` appends the sourceMappingURL to the end of
        //         // the css file, helping the browser find the sourcemap
        //         annotation: true
        //       }
        //       : false
        //   }
        // })
      ],

      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: 'all',
        // maxSize: 5 * 1000 * 1000,
        name: false
      },

      // Keep the runtime chunk separated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      runtimeChunk: false
    },

    resolve: {
      modules: ['node_modules'],
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`),
      alias: alias.resolve.alias
    },

    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },
        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        {
          test: /\.(js|mjs|jsx)$/,
          enforce: 'pre',
          use: [
            {
              options: {
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint')

              },
              loader: require.resolve('eslint-loader')
            }
          ],
          include: paths.appSrc
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.

          oneOf: [

            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                presets: ['react-app'],
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'
                ),

                plugins: [
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: '@svgr/webpack?-svgo,+ref![path]'
                        }
                      }
                    }
                  ]
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                cacheCompression: isEnvProduction,
                compact: isEnvProduction
              }
            },

            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    // 'react-app',
                    require.resolve('babel-preset-react-app/dependencies'),
                    { helpers: true }
                  ]
                ],
                cacheDirectory: true,
                cacheCompression: isEnvProduction,

                // If an error happens in a package, it's possible to be
                // because it was compiled. Thus, we don't want the browser
                // debugger to show the original code. Instead, the code
                // being evaluated would be much more helpful.
                sourceMaps: false
              }
            },

            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction && shouldUseSourceMap
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },

            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction && shouldUseSourceMap,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent
              })
            },

            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders({
                importLoaders: 2,
                sourceMap: isEnvProduction && shouldUseSourceMap
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },

            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders({
                importLoaders: 2,
                sourceMap: isEnvProduction && shouldUseSourceMap,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent
              })
            }
          ]
        }
      ]
    },
    plugins: [

      isEnvProduction && new CompressionPlugin({
        algorithm: 'gzip'
        // threshold: 10240,
      }),

      new AssetsWebpackPlugin({
        prettyPrint: isEnvDevelopment,
        path: 'assets/client',
        filename: 'webpack-client-assets.json'
      }),
      isEnvProduction && new BrotliPlugin({}),

      // new MiniCssExtractPlugin({
      //   // Options similar to the same options in webpackOptions.output
      //   // both options are optional
      //   // filename: 'static/css/[name].[contenthash:8].css',
      //   // chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      //   filename: '[name].[contenthash:8].css',
      //   chunkFilename: '[name].[contenthash:8].chunk.css',
      //   moduleFilename: ({ name }) => `${name.replace('/js/', '/css/')}.css`
      // }),

      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),

      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build. Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': isEnvProduction ? JSON.stringify('production') : JSON.stringify('development')
      }),

      // Moment.js is an extremely popular libs that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)

    ].filter(Boolean),

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.

    node: {
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      net: 'empty',
      __dirname: true,
      tls: 'empty',
      child_process: 'empty'
    },

    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter

    performance: false
  };
};
