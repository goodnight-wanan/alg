package edu.beihua.ju.entity;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class User {

    private String username;
    private String password;

    public User() {
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) throws Exception{
        if(username.length()>=2)
        this.username = username;
        else
            throw new Exception("用户名不合法，必须大于等于两位数");
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) throws Exception {
        if(password.length()>=8)
            this.password = password;
        else
            throw new Exception("密码不合法，必须大于等于6位数");

    }


}
