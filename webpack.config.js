const path = require('path');

module.exports = {
  entry: 'functions/app.js', // Entry point for your application
  output: {
    filename: 'app.bundle.js', // Output file name
    path: path.resolve(__dirname, 'functions-build') // Output directory
  },
  target: 'node', // Ensure Webpack targets Node.js environment
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
