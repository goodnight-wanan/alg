package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.impl.PlayListDaoImpl;
import edu.beihua.ju.dao.impl.UserDaoImpl;
import edu.beihua.ju.entity.Music;
import edu.beihua.ju.entity.User;
import edu.beihua.ju.service.UserService;

import java.util.Scanner;



public class UserServiceImpl implements UserService{

    UserDaoImpl u=new   UserDaoImpl();
    MusicServiceImpl m1=new MusicServiceImpl();
    PlayListDaoImpl p1=new PlayListDaoImpl();
    public UserServiceImpl() throws Exception {

    }

    @Override
    public void login() {
        Scanner scan = new Scanner(System.in);
        while (true) {
        System.out.println("请输入用户名");
        String username = scan.next();
        System.out.println("请输入用户密码");
        String password = scan.next();
            if(searchByName(username,password)){
                System.out.println("登录成功！");
                break;
            }else {
                System.out.println("用户名或密码错误 请重新输入");
            }
        }


    }
    public boolean searchByName(String username,String password)  {
        User user= u.quertbyName(username);
        if(user!=null&&user.getPassword().equals(password))
            return true;
        else
            return false;

    }
    @Override
    public void register() throws Exception {

        Scanner scan = new Scanner(System.in);
        System.out.println("请输入用户名");
        String username = scan.next();
        System.out.println("请输入用户密码");
        String password = scan.next();
        User user=new User(username ,password);
        if(u.quertbyName(username)==null) {
        u.add(user);
        System.out.println("注册成功！");
        } else
            System.out.println("用户名已存在，请重新注册！");
    }


    @Override
    public void SearchMyPlaylist() throws Exception {
        m1.musicPrint();
    }


    @Override
    public void Collection() {
        System.out.println("收藏成功");

    }

    @Override
    public void Comments() {
       System.out.println("请输入评论");
       Scanner scan=new Scanner(System.in);
       String comment= scan.next();
       System.out.println("评论成功");
    }

    @Override
    public void PlayMusic() {
        System.out.println("正在播放音乐");
    }

    @Override
    public void StopMusic() {
       System.out.println("正在暂停音乐");
    }

    @Override
    public void searchMusic() {
        while (true) {
            System.out.println("请输入歌曲名");
            Scanner scan = new Scanner(System.in);
            String name = scan.next();
            Music music = m1.searchMusicByName(name);
            if (music != null) {
                System.out.println(music.toString());
                break;
            } else
                System.out.println("搜索不到该歌曲，请重新输入");
        }
    }




    @Override
    public void searchPlaylist() {
        p1.showInfo();
    }

}

