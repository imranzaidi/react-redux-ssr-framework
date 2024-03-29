// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
//
// module.exports = (cssOptions, preProcessor, shouldUseSourceMap) => {
//   const isProduction = !!`${process.env.NODE_ENV}`.match(/production/i);
//
//   const loaders = [
//     isProduction ? {
//       loader: MiniCssExtractPlugin.loader
//     } : require.resolve('style-loader'),
//     {
//       loader: require.resolve('css-loader'),
//       options: cssOptions
//     },
//     {
//       // Options for PostCSS as we reference these options twice
//       // Adds vendor prefixing based on your specified browser support in
//       // package.json
//       loader: require.resolve('postcss-loader'),
//       options: {
//         // Necessary for external CSS imports to work
//         // https://github.com/facebook/create-react-app/issues/2677
//         ident: 'postcss',
//         plugins: () => [
//           require('postcss-flexbugs-fixes'),
//           require('postcss-preset-env')({
//             autoprefixer: {
//               flexbox: 'no-2009'
//             },
//             stage: 3
//           })
//         ],
//         sourceMap: isProduction && shouldUseSourceMap
//       }
//     }
//   ].filter(Boolean);
//   if (preProcessor) {
//     loaders.push({
//       loader: require.resolve(preProcessor),
//       options: {
//         sourceMap: isProduction && shouldUseSourceMap
//       }
//     });
//   }
//   return loaders;
// };
module.exports = (cssOptions) => {
  return [
    'isomorphic-style-loader',
    // Translates CSS into CommonJS
    {
      loader: require.resolve('css-loader'),
      options: cssOptions
    },
    // Compiles Sass to CSS
    {
      loader: require.resolve('sass-loader'),
      options: {
        // sourceMap: shouldUseSourceMap
        sourceMap: false
      }
    }
  ];
};
