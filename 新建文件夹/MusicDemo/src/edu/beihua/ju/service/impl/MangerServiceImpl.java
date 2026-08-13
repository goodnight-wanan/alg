package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.impl.ManagerDaoimpl;
import edu.beihua.ju.entity.Manager;
import edu.beihua.ju.service.MangerService;

public class MangerServiceImpl implements MangerService {
    ManagerDaoimpl mdi = new ManagerDaoimpl();

    @Override
    public boolean addManager(Manager mm) {
        if (mdi.queryByUserName(mm.getUsername()) != null) {
            return false;
        }
        return mdi.addManager(mm);
    }

    @Override
    public boolean deleManager(Manager mm) {
        if (mdi.queryByUserName(mm.getUsername()) == null) {
            return false;
        }
        return mdi.deleManager(mm);
    }


    @Override
    public boolean updateManager(Manager mm) {
        if (mdi.queryByUserName(mm.getUsername()) == null) {
            return false;
        }
        return mdi.updateManager(mm);
    }

    @Override
    public Manager queryByUserName(String uName) throws Exception {
        Manager manager = mdi.queryByUserName(uName);
        if (manager == null) {

            throw new Exception("用户名不存在");
        } else
            return manager;

    }
}

