package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.impl.PlayListDaoImpl;
import edu.beihua.ju.entity.PlayList;

public class PlayListServiceImpl implements edu.beihua.ju.service.PlayListService {
    PlayListDaoImpl pldi=new PlayListDaoImpl();
    @Override
    public boolean add(PlayList playList) {
        if (pldi.queryByName(playList.getPL_name())!=null) {
            return false;
        }
        return pldi.add(playList);
    }

    @Override
    public boolean update(PlayList playList) {
        if (pldi.queryByName(playList.getPL_name())==null){
            return false;
        }
        return pldi.update(playList);
    }

    @Override
    public boolean delete(PlayList playList) {
        if (pldi.queryByName(playList.getPL_name())==null) {
            return false;
        }
        return pldi.delete(playList);

    }

    @Override
    public void showInfo() {
        pldi.showInfo();
    }

    @Override
    public PlayList queryByName(String name) throws Exception {

        PlayList pp=pldi.queryByName(name);
        if(pp==null) {
            throw new Exception("不存在");
        } else
        return pp;
    }
}
