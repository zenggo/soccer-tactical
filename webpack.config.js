const path = require('path')
const webpack = require('webpack')
const tsImportPluginFactory = require('ts-import-plugin')

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, './src/index.tsx')
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, './build')
  },
  devtool: 'source-map',
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".css"]
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/, // js jsx ts tsx
        loader: "ts-loader",
        exclude: /node_modules/ // 不加这句则会造成webpack卡住
      },
      {
        test: /\.less$/,
        loader: "style-loader!css-loader?modules&localIdentName=[name]__[local]-[hash:base64:5]!less-loader",
        exclude: /node_modules/ // 自定义的css采用css modules
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        include: /node_modules/
      }
    ]
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'fabric': 'fabric'
  },
  devServer: {
    contentBase: "./",
    historyApiFallback: true, // 404 -> index.html
    inline: true,
    hot: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin()
  ]
}