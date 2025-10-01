const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  context: __dirname,
  output: {
    path: join(__dirname, '../../dist/libs/proto'),
    library: {
      type: 'commonjs',
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/index.ts',
      tsConfig: './tsconfig.lib.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};