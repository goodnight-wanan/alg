package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.AbsoluteMusicDao;
import edu.beihua.ju.entity.AbsoluteMusic;

public class AbsoluteMusicDaoImpl implements AbsoluteMusicDao {
    AbsoluteMusic[] ab = new AbsoluteMusic[2];

    public AbsoluteMusicDaoImpl() throws Exception {
        ab[0] = new AbsoluteMusic("安妮的仙境", "班得瑞", 03.35, "无", "钢琴");
        ab[1] = new AbsoluteMusic("卡农", "帕赫贝尔", 05.00, "无", "钢琴");

    }

    @Override
    public boolean add(AbsoluteMusic absoluteMusic) {

        return false;
    }

    @Override
    public boolean update(AbsoluteMusic absoluteMusic) {
        return false;
    }

    @Override
    public boolean delete(AbsoluteMusic absoluteMusic) {
        return false;
    }

    @Override
    public AbsoluteMusic queryByName(String name)  {
        for (AbsoluteMusic absoluteMusic : ab)
            if (absoluteMusic.getMl_songname().equals(name))
                return absoluteMusic;
        return null;
    }
}
