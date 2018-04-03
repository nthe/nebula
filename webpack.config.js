const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'index.min.js',
        // libraryTarget: 'umd',
        // library: '*'
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

// ode node_modules\uglify-js-es6\bin\uglifyjs lib\elm.js -o lib\elm.min.js