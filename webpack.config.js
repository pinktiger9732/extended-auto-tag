module.exports = {
  module: {
    rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                    '@babel/preset-env',
                    { 
                        useBuiltIns: "usage",
                        corejs: '3.32.2'
                    }
                ]
              ]
            }
          }
        }
    ]
  },
  output: {
      environment: {
          arrowFunction: false
      }
  }
}
