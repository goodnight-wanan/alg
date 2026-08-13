package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.MusicVideoDao;
import edu.beihua.ju.entity.MusicVideo;
import edu.beihua.ju.entity.PlayList;

public class MusicVideoDaoImpl implements MusicVideoDao {
    MusicVideo mvs[]=new MusicVideo[2];
    public MusicVideoDaoImpl() throws Exception {
        mvs[0]=new MusicVideo("如果爱忘了","单依纯/汪苏泷",04.05,"生生不息", "如果爱忘了mv");
        mvs[1]=new MusicVideo("小幸运","田馥甄",04.05,"小幸运", "小幸运mv");
    }

    @Override
    public boolean add(MusicVideo musicVideo) {
        return false;
    }

    @Override
    public boolean update(MusicVideo musicVideo) {
        return false;
    }

    @Override
    public boolean delete(MusicVideo musicVideo) {
        return false;
    }

    @Override
    public MusicVideo queryByName(String name) {
        for(MusicVideo musicVideo:mvs){

            if(musicVideo.getMl_songname().equals(name)){
                return musicVideo;
            }
        }
        return null;
    }
}
