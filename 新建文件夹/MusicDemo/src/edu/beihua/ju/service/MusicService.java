package edu.beihua.ju.service;

import edu.beihua.ju.entity.Music;
import edu.beihua.ju.entity.PlayList;

public interface MusicService {

    boolean add(Music music);
    Music searchMusicByName(String name);
    boolean update (Music music);
    boolean delete(String name);
     void musicPrint();
     boolean playMusic(String name);
     boolean stopMusic(String name);

     boolean showMusic();

}
