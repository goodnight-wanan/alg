package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.PlayListDao;
import edu.beihua.ju.entity.PlayList;

public class PlayListDaoImpl implements PlayListDao {

    PlayList[] playLists = new PlayList[3];

    public PlayListDaoImpl() {
        playLists[0] = new PlayList("民谣", "人间烟火气,最能抚人心");
        playLists[1] = new PlayList("布鲁斯", "深情布鲁斯,浓情老酒馆");
        playLists[2] = new PlayList("国风器乐", "萧鼓乘月,笛赋存风");

    }


    @Override
    public boolean add(PlayList playList) {
        return false;
    }

    @Override
    public boolean update(PlayList playList) {
        return false;
    }

    @Override
    public boolean delete(PlayList playList) {
        return false;
    }

    @Override
    public PlayList queryByName(String name)  {
        for (PlayList pp : playLists)
            if (pp.getPL_name().equals(name))
                return pp;
        return null;

    }


        @Override
        public void showInfo () {
            for (int i = 0; i < playLists.length; i++) {
                System.out.println(playLists[i].PL_name + ":  " + playLists[i].pl_description);
            }
        }
    }

