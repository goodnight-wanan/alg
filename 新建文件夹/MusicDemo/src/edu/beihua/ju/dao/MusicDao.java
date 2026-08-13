package edu.beihua.ju.dao;


import edu.beihua.ju.entity.Music;

public interface MusicDao {

    boolean delete(String name);

//    boolean musicAdd(Music music) throws Exception;

    boolean add(Music music);

    Music searchMusicByName(String name);

    boolean update (Music music);
     boolean musicPrint();
}




