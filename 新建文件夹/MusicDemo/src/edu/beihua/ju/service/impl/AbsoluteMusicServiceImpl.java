package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.AbsoluteMusicDao;
import edu.beihua.ju.dao.impl.AbsoluteMusicDaoImpl;
import edu.beihua.ju.entity.AbsoluteMusic;
import edu.beihua.ju.service.AbsoluteMusicService;

public class AbsoluteMusicServiceImpl implements AbsoluteMusicService {
    AbsoluteMusicDaoImpl ab1 = new AbsoluteMusicDaoImpl();

    public AbsoluteMusicServiceImpl() throws Exception {
    }

    @Override
    public boolean add(AbsoluteMusic absoluteMusic) {
        if ((ab1.queryByName(absoluteMusic.getMl_songname()) == null)) {
            System.out.println("添加成功");
            return ab1.add(absoluteMusic);
        } else {
            System.out.println("已有该纯音乐，添加失败");
        }
        return false;
    }

    @Override
    public boolean update(AbsoluteMusic absoluteMusic) {
        if (ab1.queryByName(absoluteMusic.getMl_songname()) != null) {
            System.out.println("修改成功");
            return  ab1.update(absoluteMusic);
        } else {
            System.out.println("该纯音乐不存在，修改失败");
        }
        return false;
    }

    @Override
    public boolean delete(AbsoluteMusic absoluteMusic) {

        if (ab1.queryByName(absoluteMusic.getMl_songname()) != null) {
            System.out.println("删除成功");
            return ab1.delete(absoluteMusic);
        } else {
            System.out.println("该纯音乐不存在，删除失败");
        }
        return false;
    }

    @Override
    public AbsoluteMusic queryByName(String name) throws Exception {
        AbsoluteMusic absoluteMusic = ab1.queryByName(name);
        if (absoluteMusic == null)
            throw new Exception("该纯音乐不存在");
        else return absoluteMusic;
    }

    @Override
    public boolean playAbsoluteMusic(String name) {
        if(ab1.queryByName(name)==null){
            System.out.println("该纯音乐不存在，播放失败");
            return false;
        }else{
            System.out.println("播放成功");
            return true;
        }
    }

    @Override
    public boolean stopAbsoluteMusic(String name) {
        if (ab1.queryByName(name) == null) {
            System.out.println("该纯音乐不存在，停止失败");
            return false;
        } else {
            System.out.println("停止成功");
            return true;
        }
    }

}


