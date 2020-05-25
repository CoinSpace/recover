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
