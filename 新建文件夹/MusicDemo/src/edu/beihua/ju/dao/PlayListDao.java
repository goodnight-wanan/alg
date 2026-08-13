package edu.beihua.ju.dao;

import edu.beihua.ju.entity.PlayList;

public interface PlayListDao {
    boolean add (PlayList playList);
    boolean update(PlayList playList);
    boolean delete(PlayList playList);


    PlayList queryByName(String name) ;
    void showInfo();
}
