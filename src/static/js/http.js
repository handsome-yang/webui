/**
 * 网络请求ajax方法扩展
 *
 * Created by wzw on 2016/9/24.
 *
 */
define(['jquery', 'config', 'cache', 'toastr'], function($, config, $cache, toastr) {
    (function($) {
        //备份jquery的ajax方法
        var _ajax = $.ajax;
        //重写jquery的ajax方法
        $.ajax = function(opt) {
            //备份opt中error和success方法
            var fn = {
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                },
                success: function(data, textStatus) {
                }
            };
            if(opt.error) {
                fn.error = opt.error;
            }
            if(opt.success) {
                fn.success = opt.success;
            }

            //默认设置
            var defaultSetting = {
                contentType: 'application/json',
                dataType: 'json'
            };
            var callbackRewrite = {
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    //错误方法增强处理 这里暂时不处理
                    fn.error(XMLHttpRequest, textStatus, errorThrown);
                    if (textStatus == 'error'){
                        toastr('网络请求失败！', 'error');
                    }
                },

                success: function(data, textStatus, xhr) {
                    //成功回调方法增强处理
                    if(data.code == config.CODE_NOT_LOGIN) {
                        //如果超时就处理 ，指定要跳转的页面
                        //alert("会话超时，请重新登录！");
                        if($("#loginForm").length <= 0) {
                            $.reLogin();
                        }

                    } else {
                        fn.success(data, textStatus);
                    }
                }
            };
            //加上accessToken
            var url = opt.url;
            var token = $cache.getToken();
            if(token) {
                if(url.indexOf("?") > 0) {
                    url = url + "&" + config.TOKEN_NAME + "=" + token;
                } else {
                    url = url + "?" + config.TOKEN_NAME + "=" + token;
                }
                opt.url = url;
            } else {
                window.location.href =  config.LOGIN_PAGE;
            }


            //data处理
            //opt.contentType==false 表示上传附件
            if((typeof opt.data === "object") && (opt.type == 'post' || opt.type == 'POST') && opt.contentType != false) {
                opt.data = JSON.stringify(opt.data);
            }

            //默认设置
            opt = $.extend(defaultSetting, opt);

            //扩展增强处理
            var _opt = $.extend(opt, callbackRewrite);
            return _ajax(_opt);

        };
    })($);
});
