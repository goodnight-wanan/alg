package edu.beihua.ju.service;

import edu.beihua.ju.entity.PlayList;

public interface PlayListService {
    boolean add (PlayList playList);
    boolean update(PlayList playList);
    boolean delete(PlayList playList);
    public void showInfo();

    PlayList queryByName(String name) throws Exception;
}
