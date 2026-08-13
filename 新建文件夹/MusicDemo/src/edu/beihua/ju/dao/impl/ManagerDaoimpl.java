package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.ManagerDao;
import edu.beihua.ju.entity.Manager;


public class ManagerDaoimpl implements ManagerDao {

	Manager m[]=new Manager[2];
	public ManagerDaoimpl() {
		m[0]=new Manager("管理员1","123456","中级");
		m[1]=new Manager("管理员2","123456","高级");
	}

	public boolean addManager(Manager mm) {

		return false;
	}

	public boolean deleManager(Manager uName) {

		return false;
	}

	@Override
	public boolean updateManager(Manager uName) {
		return false;
	}

	public Manager queryByUserName(String uName) {
		for (Manager m2 : m)
			if (m2.getUsername().equals(uName)) {
				return m2;
			}
			return null;
	}
}
