package edu.beihua.ju.service;

import edu.beihua.ju.entity.MusicVideo;

public interface MusicVideoService {
    boolean add (MusicVideo musicVideo);
    boolean update(MusicVideo musicVideo);
    boolean delete(MusicVideo musicVideo);


    MusicVideo queryByName(String name) throws Exception;

}
