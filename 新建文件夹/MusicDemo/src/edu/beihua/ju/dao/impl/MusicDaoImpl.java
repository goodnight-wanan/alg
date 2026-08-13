package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.MusicDao;
import edu.beihua.ju.entity.Music;

import java.util.Scanner;

public class MusicDaoImpl implements MusicDao {
    Music[] musicsArray=new Music[2];

    public MusicDaoImpl() throws Exception {
       ;
        musicsArray[0] = new Music("谁家", "池鱼", 03.06, "谁家");
        musicsArray[1] = new Music("IMMA GET IT", "檀健次", 03.04, "IMMA GET IT");
    }

    @Override
    public boolean delete(String name) {
        return false;
    }


    @Override
    public boolean add(Music music) {
        return false;
    }

    @Override
    public Music searchMusicByName(String name) {
        for (Music music : musicsArray)
            if (music.getMl_songname().equals(name))
                return music;

            return null;

    }
  @Override
    public boolean update(Music music) {
        return false;
    }


    public boolean musicPrint(){
        for(int i=0;i<musicsArray.length;i++){
            Music music=musicsArray[i];
            if(music!=null){
               System.out.println(music);
            }
        }
       return false;
    }
//    public boolean delete(String name) {
//        for (int i = 0; i < musicsArray.length; i++) {
//            Music music = musicsArray[i];
//            if (music != null && music.getMl_songname().equals(name)) {
//                musicsArray[i] = null;
//                return true;
////                System.out.println("歌曲" + music.getMl_songname() + "删除成功");
//
//
//            }
//            System.out.println("不存在此歌曲信息");
//        }return false;
//    }
//    public boolean musicAdd () throws Exception {
//        System.out.println("请输入歌曲名称");
//        String musicName = new Scanner(System.in).next();
//        System.out.println("请输入演唱者");
//        String musicPlayer = new Scanner(System.in).next();
//        System.out.println("请输入歌曲时长");
//        double musicPayer = new Scanner(System.in).nextDouble();
//        System.out.println("请输入歌曲专辑");
//        String musicAlbumtitle = new Scanner(System.in).next();
//        Music music = new Music(musicName, musicPlayer, musicPayer, musicAlbumtitle);
//        boolean b = add(music);
//        if (b) {
//            return true;
//        } else {
//            return false;
//        }
//    }
//    public boolean add(Music music){
//        int index=searchEmptyIndex();
//        if(index!=-1){
//            musicsArray[index]=music;
//            return true;
//        }
//        return false;
//
//    }
//    public Music searchMusic(){
//        System.out.println("请输入要查询的歌名");
//        String songName=new Scanner(System.in).next();
//        for(int i=0;i<musicsArray.length;i++){
//            Music music=musicsArray[i];
//            if(music!=null&&music.getMl_songname().equals(songName)){
////                System.out.println(music);
//                return music;
//            }
//        }
////        System.out.println("歌曲搜索失败");
//        return null;
//    }
//
//    @Override
//    public boolean update(Music music) {
//        return false;
//    }
//
//    private int searchEmptyIndex(){
//        for(int i=0;i<musicsArray.length;i++){
//            Music music=musicsArray[i];
//            if(music==null){
//                return i;
//            }
//        }
//        return -1;
//    }
}
