package edu.beihua.ju.service;

import edu.beihua.ju.entity.AbsoluteMusic;

public interface AbsoluteMusicService {
    boolean add (AbsoluteMusic absoluteMusic);
    boolean update(AbsoluteMusic absoluteMusic);
    boolean delete(AbsoluteMusic absoluteMusic);
    AbsoluteMusic queryByName(String name) throws Exception;
    boolean playAbsoluteMusic(String name);

    boolean stopAbsoluteMusic(String name);
}
