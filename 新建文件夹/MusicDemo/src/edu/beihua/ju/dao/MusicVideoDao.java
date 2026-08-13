package edu.beihua.ju.dao;

import edu.beihua.ju.entity.MusicVideo;
import edu.beihua.ju.entity.PlayList;

public interface MusicVideoDao {
    boolean add (MusicVideo musicVideo);
    boolean update(MusicVideo musicVideo);
    boolean delete(MusicVideo musicVideo);


    MusicVideo queryByName(String name) ;
}
