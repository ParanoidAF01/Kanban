const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/frontend/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/frontend/index.html',
        filename: 'index.html'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3000/api'),
        'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || 'http://localhost:3000')
      })
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src/frontend'),
        '@shared': path.resolve(__dirname, 'src/shared')
      }
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      port: 3001,
      hot: true,
      historyApiFallback: true,
      open: false,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true,
          changeOrigin: true
        }
      }
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};
