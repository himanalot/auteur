const path = require('path');

module.exports = {
  entry: {
    'ae_tools': './jsx/ae_tools.jsx',
    'ae_tools_consolidated': './jsx/ae_tools_consolidated.jsx',
    'hostscript': './jsx/hostscript.jsx'
  },
  mode: 'production',
  target: ['web', 'es3'],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: { ie: '9' },
                  modules: false
                }]
              ]
            }
          }
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'jsx/dist'),
    filename: '[name].jsx'
  }
};