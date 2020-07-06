const path = require("path");
const webpack = require('webpack');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// const CssUrlRelativePlugin = require('css-url-relative-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const config = require("./config/config");
const IS_DEV = process.env.NODE_ENV === "dev"; //获取cmd命令

let Entries = {};
// let Version = new Date().getTime(); // 这里使用的是时间戳 来区分 ，也可以自己定义成别的如：1.1
// 通过 html-webpack-plugin 生成的 HTML 集合
let HTMLPlugins = [];
Entries['index'] = path.resolve(__dirname, `./src/index.js`);
HTMLPlugins.push(new HtmlWebPackPlugin({
    template: path.resolve(__dirname, `./src/index.html`),
    filename: "index.html",
    chunks: ['index', 'vendors'],
    //chunks:['common','index'],
    minify: !IS_DEV && {
        collapseWhitespace: true, //清楚空格、换行符
        preserveLineBreaks: true, //保留换行符
        removeComments: true //清理html中的注释
    },
    title: '小马国炬',
    inject: true,
    path: '/static'
}));

// 生成多页面的集合
config.HTMLDirs.forEach(page => {
    const htmlPlugin = new HtmlWebPackPlugin({
        filename: `${page}.html`,
        template: path.resolve(__dirname, `./src/views/${page}.html`),
        chunks: [page], //引入的模块，entry中设置多个js时，在这里引入指定的js，如果不设置则全部引入
        //favicon: path.resolve(__dirname, "./src/favicon.ico"), //在网页窗口栏上加上图标
        minify: !IS_DEV && {
            collapseWhitespace: true, //清楚空格、换行符
            preserveLineBreaks: false, //保留换行符
            removeComments: true //清理html中的注释
        }
    });
    HTMLPlugins.push(htmlPlugin);
    Entries[page] = path.resolve(__dirname, `./src/views/${page}.js`);
});

module.exports = {
    //mode: 'development',
    devtool: 'source-map',
    entry: Entries,
    output: {
        filename: "js/[name].[hash:8].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules|static/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [
                        {
                            loader: 'css-loader', // translates CSS into CommonJS modules
                        },
                        {
                            loader: 'postcss-loader', // Run postcss actions
                            options: {
                                plugins: function() { // postcss plugins, can be exported to postcss.config.js
                                    return [
                                        require('autoprefixer')
                                    ];
                                }
                            }
                        },
                        {
                            loader: 'sass-loader' // compiles Sass to CSS
                        }
                    ]
                }),
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                            name: "[name].[ext]",
                            fallback: "file-loader", //超过了限制大小调用回调函数
                            outputPath: "static/images" //图片存储的地址
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: path.posix.join('static', 'fonts/[name].[hash:7].[ext]')
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        IS_DEV ? new webpack.HotModuleReplacementPlugin() : new CleanWebpackPlugin(),
        ...HTMLPlugins,
        //new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            moment: "moment",
            Popper: ['popper.js', 'default'],
        }), //自动加载模块，当在项目中遇见$、jQuery、会自动加载JQUERY模块
        new CopyWebpackPlugin([
            //将单个文件或整个目录复制到构建目录。
            {
                from: "./src/static",
                to: "static"
            },{
                from: "./login",
                to: "./"
            }
        ]),
        // new CssUrlRelativePlugin()
        new ExtractTextPlugin('css/index.[hash:8].css')
    ],
    optimization: {
        minimize: !IS_DEV,
        splitChunks: {
            /*缓存chunk 提取公共模块复用*/
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules|[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                },
                logistics_routes: {
                    name: 'logistics_routes',
                    chunks: 'async',
                    minChunks: 1
                }
            }
        },
    },
    devServer: {
        port: 8055,
        clientLogLevel: 'warning',
        contentBase: path.join(__dirname, '../src'),
        hot: true, //开启 Hot Module Replacement 功能
        hotOnly: true //即使HMR没有生效,浏览器也不自动刷新
    }
};

