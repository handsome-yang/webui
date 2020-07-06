/**
 * Created by kunting.liu on 2020/2/22.
 * login.js
 */
const BASE_URL='http://map.guojutech.net';
$(function() {
    $('.login-button').click(function(){
            let username = $("input[name='username']").val();
            let password = $("input[name='password']").val();
            if(!username||!password){
                $(".error-msg").text('用户名和密码不能为空');
            }else {
                axios.post(BASE_URL+'/JT808WebApi/Auth/RequestToken',{
                    username:username,
                    password:password
                },).then((res)=>{
                    console.log(res);
                    //添加数据
                    window.sessionStorage.setItem("token",res.data);
                    window.location.href='/index.html';
                }).catch((err)=>{
                
                })
            }
        });
});
