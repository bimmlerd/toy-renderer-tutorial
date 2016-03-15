module.exports = {
    entry: './src/app.ts',
    output: {
        path: "./dist/",
        filename: 'bundle.js'
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
        loaders: [
            // all files with a `.ts` extension will be handled by `awesome-typescript-loader`
            { test: /\.ts$/, loader: 'awesome-typescript-loader' }
        ]
    }
}