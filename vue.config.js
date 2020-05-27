const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.EnvironmentPlugin([
        'API_BTC_URL',
        'API_LTC_URL',
        'COIN_NETWORK'
      ])
    ]
  },
  chainWebpack: (config) => {
    config.optimization.minimizer('terser').tap(args => {
      const { terserOptions } = args[0];
      terserOptions.mangle.reserved = ['BigInteger'];
      return args;
    });

    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
  }
};
