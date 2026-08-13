package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.impl.MusicDaoImpl;
import edu.beihua.ju.entity.Music;
import edu.beihua.ju.service.MusicService;

public class MusicServiceImpl implements MusicService {

    MusicDaoImpl mm=new MusicDaoImpl();

    public MusicServiceImpl() throws Exception {
    }


    public void musicPrint(){
       mm.musicPrint();
    }

    @Override
    public boolean playMusic(String name) {
        if(mm.searchMusicByName(name)==null){
            System.out.println("找不到该歌曲，播放失败");
            return false;
        }else {
            System.out.println("播放成功");
        return true;
        }
    }

    @Override
    public boolean stopMusic(String name) {
        if(mm.searchMusicByName(name)==null) {
            System.out.println("找不到该歌曲，停止失败");
            return false;
        }else {
                System.out.println("停止成功");
            return true;
        }

    }

    @Override
    public boolean showMusic() {
        return mm.musicPrint();
    }

    public boolean delete(String name){
        if(mm.searchMusicByName(name)==null) {
            System.out.println("找不到该歌曲，删除失败");
            return false;
        }else {
            System.out.println("删除成功");
            return mm.delete(name);
        }
    }

    @Override
    public Music searchMusicByName(String name) {
        Music m1 = mm.searchMusicByName(name);
        if (m1 == null){
            System.out.println("没有找到");
             return null;
        } else
            System.out.println(m1.toString());
             return m1;
    }

    @Override
    public boolean update(Music music) {
      if(mm.searchMusicByName(music.getMl_songname())==null){
            System.out.println("没有找到该歌曲，修改失败");
            return false;
        }else {
            System.out.println("修改成功");
        return mm.update(music);
      }
    }


    @Override
    public boolean add(Music music) {
         if(mm.searchMusicByName(music.getMl_songname())==null){
               mm.add(music);
             return true;
         }
         else
             return false;
   }


}
