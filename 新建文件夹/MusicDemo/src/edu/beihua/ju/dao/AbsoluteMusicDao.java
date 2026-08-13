package edu.beihua.ju.dao;

import edu.beihua.ju.entity.AbsoluteMusic;
import edu.beihua.ju.entity.MusicVideo;

public interface AbsoluteMusicDao {
    boolean add (AbsoluteMusic absoluteMusic);
    boolean update(AbsoluteMusic absoluteMusic);
    boolean delete(AbsoluteMusic absoluteMusic);


    AbsoluteMusic queryByName(String name) ;
}
