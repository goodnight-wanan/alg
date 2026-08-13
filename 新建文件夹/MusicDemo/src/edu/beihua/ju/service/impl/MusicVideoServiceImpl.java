package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.MusicVideoDao;
import edu.beihua.ju.dao.impl.MusicVideoDaoImpl;
import edu.beihua.ju.entity.MusicVideo;
import edu.beihua.ju.service.MusicVideoService;

public class MusicVideoServiceImpl implements MusicVideoService {
    MusicVideoDaoImpl mvdi = new MusicVideoDaoImpl();

    public MusicVideoServiceImpl() throws Exception {
    }

    @Override
    public boolean add(MusicVideo musicVideo) {
        if (mvdi.queryByName(musicVideo.getMl_songname()) != null) {
            System.out.println("歌曲已存在,添加失败");
            return false;
        } else {
            System.out.println("歌曲添加成功");
            return mvdi.add(musicVideo);
        }
    }

    @Override
    public boolean update(MusicVideo musicVideo) {
        if (mvdi.queryByName(musicVideo.getMl_songname()) == null) {
            System.out.println("歌曲不存在,修改失败");
            return false;
        } else {
            System.out.println("歌曲修改成功");
            return mvdi.update(musicVideo);
        }
    }

    @Override
    public boolean delete(MusicVideo musicVideo) {
        if (mvdi.queryByName(musicVideo.getMl_songname()) == null) {
            System.out.println("歌曲不存在,删除失败");
            return false;
        } else {
            System.out.println("歌曲删除成功");
            return mvdi.delete(musicVideo);
        }
    }

    @Override
    public MusicVideo queryByName(String name) throws Exception {
        MusicVideo MV = mvdi.queryByName(name);
        if (MV == null) {
            throw new Exception("歌曲不存在");

        } else
            return MV;
    }
}
