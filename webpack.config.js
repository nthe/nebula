const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/*.js',
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: '*.min.js',
        libraryTarget: 'umd',
        library: '*'
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
}