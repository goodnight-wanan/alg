package edu.beihua.ju;

import edu.beihua.ju.dao.impl.MusicDaoImpl;
import edu.beihua.ju.entity.Music;
import edu.beihua.ju.entity.User;
import edu.beihua.ju.service.impl.UserServiceImpl;

import java.util.Scanner;

public class Test {
    public static void main(String[] args) throws Exception {

        System.out.println("-----------音乐网站----------");
        System.out.println("       1.登录");
        System.out.println("       2.注册");
        System.out.println("       0.退出");
        System.out.println("----------------------------");
        UserServiceImpl u1 = new UserServiceImpl();
        Scanner scan = new Scanner(System.in);
        int n1 = scan.nextInt();

            if (n1 == 1) {
                u1.login();
            } else if (n1 == 2) {
                u1.register();
            }
            int n3=100;
            while (n1 != 0) {
                System.out.println("-----------主页-----------");
                System.out.println("     1.查找歌曲");
                System.out.println("     2.进入我的歌单");
                System.out.println("     3.进入分类歌单");
                System.out.println("     0.退出");
                System.out.println("-------------------------");
                int n2 = scan.nextInt();
                if(n2==0){
                    return;
                }
                else if (n2 == 1) {
                    u1.searchMusic();

                    while (n3 != 5) {
                        System.out.println("----------音乐界面---------");
                        System.out.println("    1.播放音乐");
                        System.out.println("    2.停止音乐");
                        System.out.println("    3.评论");
                        System.out.println("    4.收藏");
                        System.out.println("    5.返回");
                        System.out.println("    0.退出");
                        n3 = scan.nextInt();
                        if (n3 == 1) {
                            u1.PlayMusic();
                        } else if (n3 == 2) {
                            u1.StopMusic();
                        } else if (n3 == 3) {
                            u1.Comments();
                        } else if (n3 == 4) {
                            u1.Collection();
                        } else if (n3==0) {
                            return;

                        }
                    }
                } else if (n2 == 2) {
                    System.out.println("----------我的歌单--------");
                    u1.SearchMyPlaylist();
                    System.out.println("-------------------------");
                    while (n3 != 1) {
                        System.out.println("   1.返回");
                        System.out.println("   0.退出");
                        System.out.println("-------------------------");
                        n3=scan.nextInt();
                        if (n3==0){
                            return;
                        }
                    }
                }else if(n2==3){
                     System.out.println("-------分类歌单---------");
                     u1.searchPlaylist();
                     System.out.println("-----------------------");
                    while (n3 != 1) {
                        System.out.println("   1.返回");
                        System.out.println("   0.退出");
                        System.out.println("-------------------------");
                        n3=scan.nextInt();
                        if (n3==0){
                            return;
                        }
                    }
                }
            }
    }
}





